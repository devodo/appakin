'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var log = require('../../logger');
var solrCore = require('./solrCore').getAutoSolrCore();

var CATEGORY_TYPE = 1;
var APP_TYPE = 2;
var APP_ID_OFFSET = 10000000;

var addCategory = function(category, next) {
    log.debug("Adding category: " + category.name);

    var name = solrCore.preProcessText(category.name);

    var solrCategory = {
        id: category.id,
        type: CATEGORY_TYPE,
        name: name,
        "name_word_prefix": name,
        "popularity": category.popularity
    };

    var nameAscii = solrCore.asciiFold(name);

    if (name !== nameAscii) {
        solrCategory.name_alt = nameAscii;
    }

    solrCore.client.add(solrCategory, function(err, obj) {
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var addApp = function(app, next) {
    var name = solrCore.preProcessText(app.name);

    var solrApp = {
        id: parseInt(app.id, 10) + APP_ID_OFFSET,
        type: APP_TYPE,
        name: name,
        popularity: app.popularity
    };

    var nameAscii = solrCore.asciiFold(name);

    if (name !== nameAscii) {
        solrApp.name_alt = nameAscii;
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





