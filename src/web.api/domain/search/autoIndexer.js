'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getAutoSolrCore();
var log = require('../../logger');

var CATEGORY_TYPE = 1;
var APP_TYPE = 2;
var APP_ID_OFFSET = 10000000;

var addCategory = function(category, next) {
    var nameDisplay = solrCore.preProcessDisplayText(category.name);
    var nameIndex = solrCore.preProcessIndexText(category.name);

    var solrCategory = {
        id: category.id,
        type: CATEGORY_TYPE,
        "name_display": nameDisplay,
        name: nameIndex,
        "name_word_prefix": nameIndex,
        "popularity": category.popularity
    };

    var nameAscii = solrCore.asciiFold(nameIndex);

    if (nameIndex !== nameAscii) {
        solrCategory.name_alt = nameAscii;
    }

    solrCore.client.add(solrCategory, function(err, obj) {
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var createSolrApp = function(app) {
    var nameDisplay = solrCore.preProcessDisplayText(app.name);
    var nameIndex = solrCore.preProcessIndexText(app.name);

    var solrApp = {
        id: parseInt(app.id, 10) + APP_ID_OFFSET,
        type: APP_TYPE,
        "name_display": nameDisplay,
        name: nameIndex,
        popularity: app.popularity
    };

    var nameAscii = solrCore.asciiFold(nameIndex);

    if (nameIndex !== nameAscii) {
        solrApp.name_alt = nameAscii;
    }

    return solrApp;
};

var addAllCategories = function(next) {
    appStoreRepo.getCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        var processCategory = function(category, callback) {
            log.debug("Adding category: " + category.name);

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

var addChartApps = function(next) {
    log.debug("Adding chart apps to index");

    appStoreRepo.getChartAppIndex(function(err, apps) {
        if (err) {
            return next(err);
        }

        var solrApps = apps.map(function(app) {
            return createSolrApp(app);
        });

        solrCore.client.add(solrApps, function(err){
            if(err){
                return next(err);
            }

            solrCore.commit(function(err) {
                if (err) {
                    return next(err);
                }

                next();
            });
        });
    });
};

var addAllApps = function(lastId, batchSize, next) {
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

            var solrApps = apps.map(function(app) {
                return createSolrApp(app);
            });

            solrCore.client.add(solrApps, function(err, obj){
                if(err){
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

    processBatch(lastId);
};

var rebuildWithAllApps = function(lastId, batchSize, outputHandler, next) {
    addAllCategories(outputHandler, function(err) {
        if (err) { return next(err); }

        addAllApps(lastId, batchSize, outputHandler, function(err) {
            if (err) { return next(err); }

            solrCore.optimise(function(err) {
                return next(err);
            });
        });
    });
};

var rebuild = function(next) {
    addAllCategories(function(err) {
        if (err) { return next(err); }

        addChartApps(function(err) {
            if (err) { return next(err); }

            solrCore.optimise(function(err) {
                return next(err);
            });
        });
    });
};

exports.rebuild = rebuild;





