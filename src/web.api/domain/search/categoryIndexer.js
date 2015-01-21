'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getCategoryCore();
var text = require('../text');
var log = require('../../logger');
var fs = require('fs');

var PARENT_TYPE = 1;
var CHILD_TYPE = 2;

var addCategory = function(localSolrCore, category, apps, next) {
    var catId = category.extId.replace(/\-/g, '');

    var children = apps.map(function(app) {
        return {
            id : app.extId.replace(/\-/g, ''),
            type: CHILD_TYPE,
            "parent_id": catId,
            name: app.name,
            desc: app.description,
            "image_url": app.imageUrl,
            position: app.position,
            price: app.price,
            popularity: app.popularity,
            is_iphone: app.isIphone === true,
            is_ipad: app.isIpad === true,
            is_free: app.price === 0,
            app_cat_name: category.name
        };
    });

    var solrCategory = {
        id: catId,
        cat_id: category.id,
        "parent_id": catId,
        type: PARENT_TYPE,
        cat_name: category.name,
        "_childDocuments_": children
    };

    localSolrCore.client.add(solrCategory, function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var rebuild = function(next) {
    log.debug("Creating temp core");
    solrCore.createTempCore(function(err, tempCore) {
        if (err) { return next(err); }

        appStoreRepo.getCategories(function (err, categories) {
            if (err) { return next(err); }

            var processCategory = function (category, callback) {
                log.debug("Adding category: " + category.name);
                appStoreRepo.getCategoryAppsForIndex(category.id, function (err, apps) {
                    if (err) { return callback(err); }

                    addCategory(tempCore, category, apps, function (err) {
                        callback(err);
                    });
                });
            };

            async.eachSeries(categories, processCategory, function (err) {
                if (err) { return next(err); }

                log.debug("Solr committing changes");
                tempCore.commit(function (err) {
                    if (err) {
                        return next(err);
                    }

                    log.debug("Solr optimising");
                    tempCore.optimise(function (err) {
                        if (err) { return next(err); }

                        log.debug("Swapping in temp core");
                        solrCore.swapInTempCore(tempCore, true, function(err) {
                            if (err) { return next(err); }

                            next();
                        });
                    });
                });
            });
        });
    });

};

var rebuildCategory = function(categoryId, next) {
    appStoreRepo.getCategory(categoryId, function (err, category) {
        if (err) { return next(err); }
        if (!category) { return next("No category found for id: " + categoryId); }

        log.debug("Adding category: " + category.name);
        appStoreRepo.getCategoryAppsForIndex(category.id, function (err, apps) {
            if (err) { return next(err); }

            addCategory(solrCore, category, apps, function (err) {
                if (err) { return next(err); }

                log.debug("Solr committing changes");
                solrCore.commit(function (err) {
                    if (err) { return next(err); }

                    next();
                });
            });
        });
    });
};

var loadCorpusTermFrequency = function(next) {
    var file = 'domain/search/docfreq.json';

    fs.readFile(file, 'utf8', function (err, data) {
        if (err) { return err; }

        var memento = JSON.parse(data);
        var corpusFrequency = text.LoadCorpusTermFrequency(memento);

        next(null, corpusFrequency);
    });
};

var saveCorpusTermFrequency = function(next) {
    var file = 'domain/search/docfreq.json';

    getCorpusTermFrequency(function(err, corpusFrequency) {
        if (err) { return next(err); }

        var memento = corpusFrequency.saveToMemento();

        var data = JSON.stringify(memento);
        fs.writeFile(file, data, function (err) {
            if (err) { return next(err); }

            next();
        });
    });
};

var getCorpusTermFrequency = function(next) {
    appStoreRepo.getCategories(function(err, categories) {
        if (err) { return next(err); }

        var corpusFrequency = text.CreateCorpusTermFrequency(categories.length);

        var processCategory = function(category, callback) {
            log.debug("Processing category: " + category.name);

            appStoreRepo.getCategoryAppsForIndex(category.id, function(err, apps) {
                if (err) { return callback(err); }

                var doc = text.CreateDocumentTermFrequency(apps.length);

                apps.forEach(function(app, index) {
                    doc.appendDocumentFragment(app.description, index + 1);
                });

                corpusFrequency.appendDocumentTermFrequencies(doc.getDocumentFrequencies());

                callback();
            });
        };

        async.eachSeries(categories, processCategory, function(err) {
            if (err) { return next(err); }

            next(null, corpusFrequency);
        });
    });
};

var getCategoryKeywords = function(categoryId, next) {
    loadCorpusTermFrequency(function(err, corpusFrequency) {
        if (err) { return next(err); }

        appStoreRepo.getCategoryAppsForIndex(categoryId, function (err, apps) {
            if (err) { return next(err); }

            var documentFrequency = text.CreateDocumentTermFrequency(apps.length);

            apps.forEach(function(app, index) {
                var termFrequencies = text.extractTermFrequencies(app.description);
                documentFrequency.appendTermFrequencies(termFrequencies, index + 1);
            });

            var docTermFrequencies = documentFrequency.getTermFrequencies();
            corpusFrequency.convertToTfIdf(docTermFrequencies);

            var sortedTerms = text.sortTermFrequencies(docTermFrequencies);

            next(null, sortedTerms);
        });
    });
};

exports.saveCorpusTermFrequency = saveCorpusTermFrequency;
exports.rebuild = rebuild;
exports.rebuildCategory = rebuildCategory;
exports.getCategoryKeywords = getCategoryKeywords;


