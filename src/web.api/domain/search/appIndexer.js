'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getAppSolrCore();
var log = require('../../logger');
var stringUtil = require('../../domain/stringUtil');
var appRank = require('../../domain/analysis/appRank');

var createSolrApp = function(app) {
    var appIndex = {
        id : stringUtil.stripDashes(app.extId),
        name: app.name,
        desc: stringUtil.stripForIndex(app.description),
        publisher: app.developerName,
        "img_url" : app.imageUrl,
        price: app.price,
        is_free: app.price === 0,
        is_iphone: app.isIphone === true,
        is_ipad: app.isIpad === true,
        popularity: app.popularity,
        rating: appRank.getRating(app)
    };

    var nameAscii = solrCore.asciiFold(app.name);

    if (app.name !== nameAscii) {
        appIndex.name_alt = nameAscii;
    }

    return appIndex;
};

var indexApps = function(tempCore, batchSize, next) {
    var processBatch = function(lastId) {
        log.debug("Adding batch from id: " + lastId);

        appStoreRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) { return next(err); }

            if (apps.length === 0) {
                return next();
            }

            lastId = apps[apps.length - 1].id;
            log.debug("Last app: " + apps[apps.length - 1].name);

            var solrApps = apps.map(function(app) {
                return createSolrApp(app);
            });

            tempCore.client.add(solrApps, function(err){
                if(err){ return next(err); }

                tempCore.commit(function(err) {
                    if (err) { return next(err); }

                    processBatch(lastId);
                });
            });
        });
    };

    processBatch(0);
};

var indexApp = function(appId, next) {
    log.debug("Indexing app with id: " + appId);

    appStoreRepo.getAppIndexApp(appId, function(err, app) {
        if (err) { return next(err); }

        if (!app) {
            return next("No app found for id: " + appId);
        }

        var solrApp = createSolrApp(app);

        solrCore.client.add(solrApp, function(err){
            if(err){ return next(err); }

            solrCore.commit(function(err) {
                if (err) { return next(err); }

                next();
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

exports.rebuild = rebuild;
exports.indexApp = indexApp;


