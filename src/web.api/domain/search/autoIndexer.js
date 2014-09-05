'use strict';
var solr = require('solr-client');
var async = require('async');
var unidecode = require('unidecode');
var appStoreRepo = require('../../repos/appStoreRepo');
var log = require('../../logger');
var solrCore = require('./solrCore').getAutoSolrCore();

var CATEGORY_TYPE = 1;
var APP_TYPE = 2;
var APP_ID_OFFSET = 10000000;

var preProcess = function(input) {
    return input.toLowerCase().trim();
};

var asciiFold = function(input) {
    return unidecode(input);
};

var addCategory = function(category, next) {
    log.debug("Adding category: " + category.name);

    var name = preProcess(category.name);

    var solrCategory = {
        id: category.id,
        type: CATEGORY_TYPE,
        name: name,
        "name_prefix": name,
        "name_wildcard": name,
        "popularity": category.popularity
    };

    if (name !== asciiFold(name)) {
        solrCategory.name_ascii = name;
        solrCategory.name_prefix_ascii = name;
        solrCategory.name_wildcard_ascii = name;
    }

    solrCore.client.add(solrCategory, function(err, obj) {
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var addApp = function(app, next) {
    var name = preProcess(app.name);

    var solrApp = {
        id: parseInt(app.id, 10) + APP_ID_OFFSET,
        type: APP_TYPE,
        name: name,
        "name_prefix": name,
        popularity: app.popularity
    };

    if (name !== asciiFold(name)) {
        solrApp.name_ascii = name;
        solrApp.name_prefix_ascii = name;
    }

    solrCore.client.add(solrApp, function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var addAllCategories = function(next) {
    appStoreRepo.getCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        var processCategory = function(category, callback) {
            addCategory(category, function(err) {
                callback(err);
            });
        };

        async.eachSeries(categories, processCategory, function(err) {
            if (err) {
                return next(err);
            }

            solrCore.commit(function(err) {
                next(err);
            });
        });

    });
};

var addAllApps = function(batchSize, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                return next();
            }

            lastId = apps[apps.length - 1].id;

            log.debug("Last app name: " + apps[apps.length - 1].name);

            var processApp = function(app, callback) {
                addApp(app, function(err) {
                    callback(err);
                });
            };

            async.eachSeries(apps, processApp, function(err) {
                if (err) {
                    return next(err);
                }

                solrCore.commit(function(err) {
                    if (err) {
                        return next(err);
                    }

                    processBatch(lastId);
                });
            });
        });
    };

    processBatch(0);
};

var addAllAuto = function(batchSize, next) {
    addAllCategories(function(err) {
        if (err) { return next(err); }

        addAllApps(batchSize, function(err) {
            if (err) { return next(err); }

            next();
        });
    });
};

exports.addAllAuto = addAllAuto;





