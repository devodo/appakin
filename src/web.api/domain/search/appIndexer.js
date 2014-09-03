'use strict';
var solr = require('solr-client');
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var solrCore = require('./solrCore').getAppSolrCore();
var log = require('../../logger');

var addApp = function(app, next) {
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
        description: app.description,
        url: app.urlName,
        "img_url" : app.imageUrl,
        price: app.price,
        "is_iphone": isIphone,
        "is_ipad": isIPad,
        "is_free": !app.price || parseInt(app.price) === 0,
        popularity: app.popularity
    };

    solrCore.client.add(appIndex, function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
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

exports.addApp = addApp;
exports.addAllApps = addAllApps;


