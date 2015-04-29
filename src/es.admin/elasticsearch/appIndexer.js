'use strict';

var config = require('../config');
var appConfig = require('./appConfig');
var esClient = require('./esClient');
var log = require('../logger');
var appRank = require('./../domain/appRank');
var indexRepo = require('../repos/indexRepo');
var unidecode = require('unidecode');
var Q = require("q");
var appIndexAdmin = require('./appIndexAdmin');

var aliasName = appConfig.constants.appIndex.alias;
var docType = appConfig.constants.appIndex.docType;

var calculateFacetBoost = function(position, popularity) {
    /*
     Verhulst Function (resource depletion)
     1/((1 + (2^10 - 1) * e^( (x/5 - 50)/5) ))^(1/10)
     1.0/((1 + (2^10 - 1) * e^( (x/3 - 45)/5) ))^(1/10)
     */

    popularity = popularity ? popularity : 0;
    var popFactor = Math.max(Math.pow(popularity, 0.3), 0.1);
    var invertFactor = 1.0 / Math.pow(position, 0.5);
    var verhulstFactor = 1.0 / Math.pow(1 + (Math.pow(2, 10) - 1) * Math.pow(Math.E, (position / 3 - 45) / 5), 1/10);
    var posFactor = Math.max(invertFactor, verhulstFactor);

    return popFactor * posFactor;
};

var calculateCategoryBoost = function(position, popularity) {
    if (!popularity) {
        return 1;
    }

    var result = 1.0 + Math.pow(popularity * 3, 2) / Math.pow(position, 0.5);

    return result;
};

var calculateMaxBoost = function(position, popularity) {
    popularity = popularity ? popularity : 0;

    var result = Math.pow(popularity, 1.5) * (1.0 / Math.pow(position, 0.1));

    return result;
};

var calculateAppBoost = function(popularity) {
    if (!popularity) {
        return 1;
    }

    var result = Math.pow(1 + popularity * 2, 2);

    return result;
};

var createCategoryField = function(categoryApp, appPopularity) {
    return {
        "cat_id": categoryApp.categoryId,
        "position": categoryApp.position,
        "facet_boost": calculateFacetBoost(categoryApp.position, appPopularity),
        "app_boost": calculateCategoryBoost(categoryApp.position, appPopularity),
        "max_boost": calculateMaxBoost(categoryApp.position, appPopularity)
    };
};

var createAppDoc = function(app, categoryFields, categoryNames) {

    var filterIncludes = categoryNames;
    filterIncludes.push(app.developerName);

    var body = {
        "ext_id": app.extId.replace(/\-/g, ''),
        name: app.name,
        desc: app.description,
        "desc_short": (app.description ? app.description.substring(0, 300) : null),
        "image_url" : app.imageUrl,
        price: app.price,
        is_free: app.price === 0,
        is_iphone: app.isIphone === true,
        is_ipad: app.isIpad === true,
        boost: calculateAppBoost(app.popularity),
        rating: appRank.getRating(app),
        categories: categoryFields,
        filter_include: filterIncludes,
        "suggest" : {
            "input": app.name,
            "weight" : (app.popularity ? Math.floor(app.popularity * 1000) : 0)
        }
    };

    var nameAscii = unidecode(app.name);

    if (app.name !== nameAscii) {
        body.name_alt = nameAscii;
    }

    return {
        id: app.id,
        body: body
    };
};

var createAppBatchLoader = function (startId, batchSize) {
    var lastId = startId;

    var nextPromise = function() {
        var deferred = Q.defer();

        log.debug("Loading next app batch from id: " + lastId);

        indexRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) { return deferred.reject(err); }

            if (apps.length === 0) {
                return deferred.resolve();
            }

            lastId = apps[apps.length - 1].id;
            log.debug("Next app batch loaded ending id: " + lastId);

            deferred.resolve({
                lastId: lastId,
                apps: apps
            });
        });

        return deferred.promise;
    };

    return ({
        nextPromise: nextPromise
    });
};

var createAppBatchIndexer = function (tmpIndexName, categoryApps, categories) {
    var categoryAppIndex = 0;

    var categoriesMap = Object.create(null);

    categories.forEach(function(category) {
        categoriesMap[category.id] = category;
    });

    var processBatchResult = function(batchResult) {
        var deferred = Q.defer();

        if (!batchResult) {
            deferred.resolve(true);

            return deferred.promise;
        }

        try {
            var appDocs = batchResult.apps.map(function (app) {
                var categoryFields = [];
                var categoryNames = [];
                if (categoryAppIndex < categoryApps.length && categoryApps[categoryAppIndex].appId < app.id) {
                    throw ("Category app index appId behind app batch appId");
                }

                while (categoryAppIndex < categoryApps.length && categoryApps[categoryAppIndex].appId === app.id) {
                    var category = categoriesMap[categoryApps[categoryAppIndex].categoryId];

                    if (!category) {
                        throw ("No category found for category id: " + categoryApps[categoryAppIndex].categoryId);
                    }

                    categoryNames.push(category.name);
                    categoryFields.push(createCategoryField(categoryApps[categoryAppIndex], app.popularity));
                    categoryAppIndex++;
                }

                return createAppDoc(app, categoryFields, categoryNames);
            });

            esClient.bulkInsert(tmpIndexName, docType, appDocs, function (err) {
                if (err) { return deferred.reject(err); }

                deferred.resolve(false);
            });
        } catch(err) {
            return deferred.reject(err);
        }

        return deferred.promise;
    };

    return ({
        processBatchResult: processBatchResult
    });
};

var indexAppsPromise = function(tmpIndexName, batchSize, categoryApps, categories) {
    var appBatchLoader = createAppBatchLoader(0, batchSize);
    var appBatchIndexer = createAppBatchIndexer(tmpIndexName, categoryApps, categories);
    var nextBatchPromise = appBatchLoader.nextPromise();

    var processNextBatch = function() {
        return nextBatchPromise
            .then(function (batchResult) {
                nextBatchPromise = appBatchLoader.nextPromise();

                if (batchResult) {
                    log.debug("Indexing batch ending at id: " + batchResult.lastId);
                }

                return batchResult;
            })
            .then(appBatchIndexer.processBatchResult)
            .then(function (isDone) {
                if (isDone) {
                    log.debug("App batch loader completed");

                    return;
                }

                return processNextBatch();
            });
    };

    return processNextBatch();
};

var indexCategoriesPromise = function(tmpIndexName, categories) {
    var deferred = Q.defer();

    var categoryIdOffset = 10000000;

    var categoryDocs = categories.map(function(category) {
        var categoryField = {
            "cat_id": category.id,
            "max_boost": (category.popularity ? category.popularity : 0) + 100
        };

        var body = {
            "ext_id": category.extId.replace(/\-/g, ''),
            name: category.name,
            categories: categoryField,
            "is_cat": true,
            "suggest" : {
                "input": category.name,
                "weight" : 10000 + (category.popularity ? Math.floor(category.popularity * 1000) : 0)
            }
        };

        return {
            id: category.id + categoryIdOffset,
            body: body
        };
    });

    esClient.bulkInsert(tmpIndexName, docType, categoryDocs, function(err){
        if (err){ return deferred.reject(err); }

        deferred.resolve();
    });

    return deferred.promise;
};

var getCategoryAppsPromise = function() {
    var deferred = Q.defer();

    indexRepo.getCategoryApps(function(err, categoryApps) {
        if (err) { return deferred.reject(err); }

        deferred.resolve(categoryApps);
    });

    return deferred.promise;
};

var getCategoriesPromise = function() {
    var deferred = Q.defer();

    indexRepo.getCategories(function(err, categories) {
        if (err) { return deferred.reject(err); }

        deferred.resolve(categories);
    });

    return deferred.promise;
};

var optmiseIndexPromise = function(indexName) {
    var deferred = Q.defer();

    esClient.optimize(indexName, function(err) {
        if (err) { return deferred.reject(err); }

        deferred.resolve();
    });

    return deferred.promise;
};

var rebuildPromise = function(batchSize) {
    log.debug("Creating new index");

    return appIndexAdmin.createAppIndexPromise()
        .then(function (newIndexName) {
            log.debug("Retrieving category apps");
            return getCategoryAppsPromise()
                .then(function (categoryApps) {
                    log.debug("Retrieving categories");
                    return getCategoriesPromise()
                        .then(function (categories) {
                            log.debug("Indexing apps");
                            return indexAppsPromise(newIndexName, batchSize, categoryApps, categories)
                                .then(function () {
                                    log.debug("Indexing categories");
                                    return indexCategoriesPromise(newIndexName, categories);
                                });
                        });
                })
                .then(function () {
                    log.debug("Optimising index");
                    return optmiseIndexPromise(newIndexName);
                })
                .then(function () {
                    return newIndexName;
                });
        });
};

exports.rebuildPromise = rebuildPromise;

exports.rebuildAndSwapInPromise = function(batchSize) {
    log.debug("Rebuilding and swapping in new app index");

    return rebuildPromise(batchSize)
        .then(function (newIndexName) {
            log.debug("Get current index");
            return appIndexAdmin.getCurrentIndexPromise()
                .then(function (currentIndex) {
                    log.debug("Swap in new index");
                    return appIndexAdmin.swapInNewIndexPromise(currentIndex, newIndexName);
                });
        });
};

exports.deleteInactiveIndicesPromise = function() {
    log.debug("Deleting inactive indices");

    return appIndexAdmin.deleteSwapOutIndicesPromise();
};
