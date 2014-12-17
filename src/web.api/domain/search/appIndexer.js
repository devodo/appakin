'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getAppSolrCore();
var log = require('../../logger');

var createSolrApp = function(app) {
    var appIndex = {
        id : app.extId.replace(/\-/g, ''),
        name: app.name,
        desc: app.description,
        "img_url" : app.imageUrl,
        price: app.price,
        is_free: app.price === 0,
        is_iphone: app.isIphone === true,
        is_ipad: app.isIpad === true,
        popularity: app.popularity
    };

    var nameAscii = solrCore.asciiFold(app.name);

    if (app.name !== nameAscii) {
        appIndex.name_alt = nameAscii;
    }

    return appIndex;
};

var rebuild = function(batchSize, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
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

                    processBatch(lastId);
                });
            });
        });
    };

    processBatch(0);
};

exports.rebuild = rebuild;


