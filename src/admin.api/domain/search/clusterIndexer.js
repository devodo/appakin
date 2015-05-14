'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getClusterCore();
var log = require('../../logger');
var stringUtil = require('../../domain/stringUtil');

var createSolrDoc = function(app) {
    var doc = {
        id : stringUtil.stripDashes(app.extId),
        name: app.name,
        desc: stringUtil.stripForIndex(app.description),
        "primary_genre": app.genres[0],
        genres: app.genres,
        "screenshot_urls": app.screenShotUrls,
        "ipad_screenshot_urls": app.iPadScreenShotUrls,
        popularity: app.popularity,
        "is_english": app.isEnglish,
        "dev_id": app.devId
    };

    if (app.advisoryRating) {
        doc.age_rating = parseInt(app.advisoryRating.replace(/([0-9]+)/, '$1'), 10);

        if (isNaN(doc.age_rating)) {
            delete doc.age_rating;
            log.warn("Error parsing advisory rating: " + app.advisoryRating + " for app: " + app.id);
        }
    }

    return doc;
};

var indexApps = function(tempCore, batchSize, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreRepo.getClusterIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) { return next(err); }

            if (apps.length === 0) {
                return next();
            }

            lastId = apps[apps.length - 1].id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            var solrApps = apps.map(function(app) {
                return createSolrDoc(app);
            });

            tempCore.client.add(solrApps, function(err){
                if(err) { return next(err); }

                tempCore.commit(function(err) {
                    if (err) { return next(err); }

                    processBatch(lastId);
                });
            });
        });
    };

    processBatch(0);
};

var indexApp = function(appId, forceIsEnglish, next) {
    log.debug("Indexing app id: " + appId);

    appStoreRepo.getClusterIndexApp(appId, function(err, app) {
        if (err) { return next(err); }

        if (!app) {
            return next("No app found for id: " + appId);
        }

        if (forceIsEnglish === true) {
            app.isEnglish = true;
        }

        var solrApp = createSolrDoc(app);

        solrCore.client.add(solrApp, function(err){
            if(err) { return next(err); }

            solrCore.commit(function(err) {
                if (err) { return next(err); }

                next();
            });
        });
    });
};

var indexChangedApps = function(modifiedSinceDate, next) {
    log.debug("Indexing changed apps since: " + modifiedSinceDate);

    appStoreRepo.getModifiedClusterIndexApps(modifiedSinceDate, function(err, apps) {
        if (err) { return next(err); }

        log.debug("Number of apps changed: " + apps.length);

        if (apps.length === 0) {
            return next(null, 0);
        }

        var solrApps = apps.map(function(app) {
            return createSolrDoc(app);
        });

        solrCore.client.add(solrApps, function(err){
            if(err) { return next(err); }

            solrCore.commit(function(err) {
                if (err) { return next(err); }

                solrCore.optimise(function(err) {
                    if (err) { return next(err); }

                    next(null, apps.length);
                });
            });
        });
    });
};

var rebuild = function(batchSize, next) {
    log.debug("Creating temp core");
    solrCore.createTempCore(function(err, tempCore) {
        if (err) { return next(err); }

        log.debug("Indexing apps");
        indexApps(tempCore, batchSize, function(err) {
            if (err) { return next(err); }

            log.debug("Optimising temp core");
            tempCore.optimise(function(err) {
                if (err) { return next(err); }

                log.debug("Swapping in temp core");
                solrCore.swapInTempCore(tempCore, true, function(err) {
                    if (err) { return next(err); }

                    next();
                });
            });
        });
    });
};

var rebuildApp = function(appId, next) {
    indexApp(solrCore, appId, function(err) {
        if (err) { return next(err); }

        next();
    });
};

exports.rebuild = rebuild;
exports.indexApp = indexApp;
exports.indexChangedApps = indexChangedApps;


