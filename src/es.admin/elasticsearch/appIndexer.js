'use strict';

var config = require('../config');
var appConfig = require('./appConfig');
var esClient = require('./esClient');
var log = require('../logger');
var appRank = require('./../domain/appRank');
var indexRepo = require('../repos/indexRepo');

var aliasName = "appakin-app";
var docType = "app";

var createCategoryField = function(categoryApp) {
    return {
        "cat_id": categoryApp.categoryId,
        "position": categoryApp.position
    };
};

var createDoc = function(app, categoryFields) {
    var body = {
        "ext_id": app.extId.replace(/\-/g, ''),
        name: app.name,
        desc: app.description,
        publisher: app.developerName,
        "img_url" : app.imageUrl,
        price: app.price,
        is_free: app.price === 0,
        is_iphone: app.isIphone === true,
        is_ipad: app.isIpad === true,
        boost: app.popularity,
        rating: appRank.getRating(app),
        categories: categoryFields
    };

    return {
        id: app.id,
        body: body
    };
};

var indexApps = function(tmpIndexName, batchSize, categoryApps, next) {
    var categoryAppIndex = 0;

    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        indexRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) { return next(err); }

            if (apps.length === 0) {
                return next();
            }

            lastId = apps[apps.length - 1].id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            var appDocs = apps.map(function(app) {
                var categoryFields = [];
                while (categoryApps[categoryAppIndex].appId === app.id) {
                    categoryFields.push(createCategoryField(categoryApps[categoryAppIndex]));
                    categoryAppIndex++;
                }

                return createDoc(app, categoryFields);
            });

            esClient.bulkInsert(tmpIndexName, docType, appDocs, function(err){
                if(err){ return next(err); }

                processBatch(lastId);
            });
        });
    };

    processBatch(0);
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

            indexApps(tmpIndexName, batchSize, categoryApps, function(err) {
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
};
