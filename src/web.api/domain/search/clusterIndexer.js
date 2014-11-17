'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getClusterCore();
var log = require('../../logger');

var createSolrDoc = function(app) {
    var doc = {
        id : app.extId.replace(/\-/g, ''),
        name: app.name,
        desc: app.description,
        "desc_top": solrCore.getTopWords(app.description, 200),
        "primary_genre": app.genres[0],
        genres: app.genres,
        "screenshot_urls": app.screenShotUrls,
        "ipad_screenshot_urls": app.iPadScreenShotUrls,
        popularity: app.popularity
    };

    return doc;
};

var rebuild = function(batchSize, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreRepo.getClusterIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                log.debug("Optimising index");
                return solrCore.optimise(function(err) {
                    next(err);
                });
            }

            lastId = apps[apps.length - 1].id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            var solrApps = apps.map(function(app) {
                return createSolrDoc(app);
            });

            solrCore.client.add(solrApps, function(err){
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

    processBatch(0);
};

exports.rebuild = rebuild;


