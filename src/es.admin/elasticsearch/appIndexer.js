'use strict';

var config = require('../config');
var appConfig = require('./appConfig');
var esClient = require('./esClient');
var log = require('../logger');
var appRank = require('./../domain/appRank');
var indexRepo = require('../repos/indexRepo');
var unidecode = require('unidecode');

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

var indexApps = function(tmpIndexName, batchSize, categoryApps, categories, next) {
    var categoryAppIndex = 0;

    var categoriesMap = Object.create(null);

    categories.forEach(function(category) {
        categoriesMap[category.id] = category;
    });

    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        indexRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) { return next(err); }

            if (apps.length === 0) {
                return next();
            }

            lastId = apps[apps.length - 1].id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            try {

                var appDocs = apps.map(function (app) {
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

                esClient.bulkInsert(tmpIndexName, docType, appDocs, function(err){
                    if(err){ return next(err); }

                    processBatch(lastId);
                });

            } catch(err) {
                return next(err);
            }
        });
    };

    processBatch(0);
};

var indexCategories = function(tmpIndexName, categories, next) {
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
        if(err){ return next(err); }

        next();
    });
};

var createAppIndex = function(tmpAlias, next) {
    var timestamp = (new Date()).getTime();
    var newIndexName = aliasName + "-idx-" + timestamp;
    var aliases = {};
    aliases[tmpAlias] = {};

    esClient.createIndex(newIndexName, appConfig.settings, appConfig.mappings, aliases, function(err) {
        if (err) { return next(err); }

        next(null, newIndexName);
    });
};

var getCurrentIndex = function(next) {
    esClient.existsAlias(aliasName, function(err, resp) {
        if (err) { return next(err); }

        if (resp === false) {
            return next(null, null);
        }

        esClient.getAliasIndexes(aliasName, function(err, resp) {
            if (err) { return next(err); }

            if (!resp) {
                return next(null, null);
            }

            var indexes = [];

            Object.keys(resp).forEach(function(key) {
                if (key.indexOf(aliasName) === 0) {
                    indexes.push(key);
                }
            });

            if (indexes.length === 0) {
                return next(null, null);
            }

            if (indexes.length > 1) {
                return next('Multiple indexes found with alias: ' + aliasName);
            }

            next(null, indexes[0]);
        });
    });
};

exports.rebuild = function(batchSize, next) {
    log.debug("Rebuilding app index");

    var tmpAlias = aliasName + "-idx-inactive";

    log.debug("Creating new index");
    createAppIndex(tmpAlias, function(err, tmpIndexName) {
        if (err) { return next(err); }

        log.debug("Retrieving category apps");
        indexRepo.getCategoryApps(function(err, categoryApps) {
            if (err) { return next(err); }

            log.debug("Retrieving categories");
            indexRepo.getCategories(function(err, categories) {
                if (err) { return next(err); }

                log.debug("Indexing apps");
                indexApps(tmpIndexName, batchSize, categoryApps, categories, function(err) {
                    if (err) { return next(err); }

                    log.debug("Indexing categories");
                    indexCategories(tmpIndexName, categories, function(err) {
                        if (err) { return next(err); }

                        log.debug("Optimising index");
                        esClient.optimize(tmpIndexName, function(err) {
                            if (err) { return next(err); }

                            log.debug("Get current index");
                            getCurrentIndex(function(err, currentIndex) {
                                if (err) { return next(err); }

                                log.debug("Swap in new index");
                                esClient.activateIndex(currentIndex, tmpIndexName, aliasName, tmpAlias, function(err) {
                                    if (err) { return next(err); }

                                    if (!currentIndex) {
                                        return next();
                                    }

                                    log.debug("Delete old index");
                                    esClient.deleteIndex(tmpAlias, function(err) {
                                        next(err);
                                    });
                                });
                            });
                        });
                    });
                });
            });

        });
    });
};
