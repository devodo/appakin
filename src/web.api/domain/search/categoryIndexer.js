'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getCategoryCore();
var text = require('../text');
var log = require('../../logger');
var fs = require('fs');

var CATEGORY_TYPE = 1;
var APP_TYPE = 2;

var addCategory = function(category, apps, numAppDescriptions, next) {
    var solrApps = apps.map(function(app) {
        return {
            id : category.id + '-' + app.id,
            type: APP_TYPE,
            "parent_id": category.id,
            name: app.name,
            "app_desc": app.description,
            url: app.extId.replace(/\-/g, ''),
            "image_url": app.imageUrl,
            position: app.position,
            popularity: app.popularity
        };
    });

    var appDescriptions = [];

    for (var i = 0; i < numAppDescriptions && i < apps.length; i++) {
        appDescriptions.push(apps[i].description);
    }

    var solrCategory = {
        id : category.id,
        "parent_id": category.id,
        type: CATEGORY_TYPE,
        name: category.name,
        //desc: category.description,
        desc: appDescriptions.join("\n\n"),
        url: category.extId.replace(/\-/g, ''),
        "_childDocuments_": solrApps,
        popularity: category.popularity
    };

    solrCore.client.add(solrCategory, function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var rebuild = function(numAppDescriptions, outputHandler, next) {
    appStoreRepo.getCategories(function (err, categories) {
        if (err) {
            return next(err);
        }

        var processCategory = function (category, callback) {
            outputHandler("Adding category: " + category.name);
            appStoreRepo.getCategoryAppsForIndex(category.id, function (err, apps) {
                if (err) {
                    return callback(err);
                }

                addCategory(category, apps, numAppDescriptions, function (err) {
                    callback(err);
                });
            });
        };

        async.eachSeries(categories, processCategory, function (err) {
            if (err) {
                return next(err);
            }

            outputHandler("Solr committing changes");
            solrCore.commit(function (err) {
                if (err) {
                    return next(err);
                }

                outputHandler("Solr optimising");
                solrCore.optimise(function (err) {
                    next(err);
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
exports.getCategoryKeywords = getCategoryKeywords;


