'use strict';
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getAppSolrCore();

var createSolrApp = function(app) {
    var isIphone = false;
    var isIPad = false;

    for (var i = 0; i < app.supportedDevices.length; i++) {
        if (app.supportedDevices[i].indexOf('iPhone') > -1) {
            isIphone = true;
            break;
        }
    }

    for (i = 0; i < app.supportedDevices.length; i++) {
        if (app.supportedDevices[i].indexOf('iPad') > -1) {
            isIPad = true;
            break;
        }
    }

    var appIndex = {
        id : app.id,
        name: app.name,
        desc: app.description,
        url: app.extId.replace(/\-/g, ''),
        "img_url" : app.imageUrl,
        price: app.price,
        "is_iphone": isIphone,
        "is_ipad": isIPad,
        "is_free": !app.price || parseInt(app.price, 10) === 0,
        popularity: app.popularity
    };

    return appIndex;
};

var rebuild = function(batchSize, outputHandler, next) {
    var processBatch = function(lastId) {
        outputHandler("Adding batch from id: " + lastId);

        appStoreRepo.getAppIndexBatch(lastId, batchSize, function(err, apps) {
            if (err) {
                return next(err);
            }

            if (apps.length === 0) {
                solrCore.optimise(function(err) {
                    return next(err);
                });
            }

            lastId = apps[apps.length - 1].id;
            outputHandler("Last app: " + apps[apps.length - 1].name);

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


