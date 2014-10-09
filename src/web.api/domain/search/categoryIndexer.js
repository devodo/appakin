'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getCategoryCore();
var text = require('../text');
var log = require('../../logger');
var fs = require('fs');

var PARENT_TYPE = 1;
var CHILD_TYPE = 2;

var addCategory = function(category, apps, numAppDescriptions, numChartApps, next) {
    var children = apps.map(function(app) {
        return {
            id : category.id + '-' + app.id,
            type: CHILD_TYPE,
            "parent_id": category.id,
            name: app.name,
            desc: app.description,
            url: app.extId.replace(/\-/g, ''),
            "image_url": app.imageUrl,
            position: parseInt(app.position, 10) + 10,
            popularity: app.popularity
        };
    });

    var appDescriptions = [];

    for (var i = 0; i < numAppDescriptions && i < apps.length; i++) {
        appDescriptions.push(apps[i].description);
    }

    var chartApps = [];

    for (i = 0; i < numChartApps && i < apps.length; i++) {
        var app = apps[i];
        chartApps.push({
            name: app.name,
            url: app.extId.replace(/\-/g, ''),
            "image_url": app.imageUrl,
            position: parseInt(app.position, 10) + 10
        });
    }

    var categoryChild = {
        id : category.id + '-0',
        type: CHILD_TYPE,
        "parent_id": category.id,
        name: category.name,
        desc: appDescriptions.join('\n\n'),
        position: 1,
        popularity: category.popularity
    };

    children.push(categoryChild);

    var solrCategory = {
        id : category.id,
        "parent_id": category.id,
        type: PARENT_TYPE,
        cat_name: category.name,
        url: category.extId.replace(/\-/g, ''),
        "cat_chart": JSON.stringify(chartApps),
        "_childDocuments_": children
    };

    solrCore.client.add(solrCategory, function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var rebuild = function(numAppDescriptions, numChartApps, next) {
    appStoreRepo.getCategories(function (err, categories) {
        if (err) {
            return next(err);
        }

        var processCategory = function (category, callback) {
            log.debug("Adding category: " + category.name);
            appStoreRepo.getCategoryAppsForIndex(category.id, function (err, apps) {
                if (err) {
                    return callback(err);
                }

                addCategory(category, apps, numAppDescriptions, numChartApps, function (err) {
                    callback(err);
                });
            });
        };

        async.eachSeries(categories, processCategory, function (err) {
            if (err) {
                return next(err);
            }

            log.debug("Solr committing changes");
            solrCore.commit(function (err) {
                if (err) {
                    return next(err);
                }

                log.debug("Solr optimising");
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


