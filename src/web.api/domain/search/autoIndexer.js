'use strict';
var solr = require('solr-client');
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var log = require('../../logger');
var solrCore = require('./solrCore').getAutoSolrCore();

var CATEGORY_TYPE = 1;
var APP_TYPE = 2;

var addCategory = function(category, next) {
    log.debug("Adding category: " + category.name);

    solrCore.client.add({
        id: category.id,
        type: CATEGORY_TYPE,
        name: category.name,
        "popularity": category.popularity
    },function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var addApp = function(app, next) {
    log.debug("Adding app: " + app.name);

    var appIndex = {
        id: app.id,
        type: APP_TYPE,
        name: app.name,
        popularity: app.popularity
    };

    solrCore.client.add(appIndex, function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var addAllCategories = function(next) {
    appStoreRepo.getCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        var processCategory = function(category, callback) {
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

var addAllApps = function(next) {
    appStoreRepo.getChartAppIndex(function (err, apps) {
        if (err) {
            return next(err);
        }

        var processApp = function (app, callback) {
            addApp(app, function (err) {
                callback(err);
            });
        };

        async.eachSeries(apps, processApp, function (err) {
            if (err) {
                return next(err);
            }

            solrCore.commit(function (err) {
                if (err) {
                    return next(err);
                }
            });
        });
    });
};

var addAllAuto = function(next) {
    addAllCategories(function(err) {
        if (err) { return next(err); }

        addAllApps(function(err) {
            if (err) { return next(err); }

            next();
        });
    });
};

exports.addAllAuto = addAllAuto;





