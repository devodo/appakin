'use strict';
var solr = require('solr-client');
var async = require('async');
var unidecode = require('unidecode');
var slug = require('slug');
var appStoreRepo = require('../../repos/appStoreRepo');
var log = require('../../logger');
var solrCore = require('./solrCore').getAutoSolrCore();

var CATEGORY_TYPE = 1;
var APP_TYPE = 2;


var slugify = function(input) {
    var slugStr = slug(input, ' ');
    slugStr = slugStr.toLowerCase().trim();

    return slugStr;
};

var addCategory = function(category, next) {
    log.debug("Adding category: " + category.name);

    var name = slugify(category.name);

    solrCore.client.add({
        id: category.id,
        type: CATEGORY_TYPE,
        name: name,
        "name_wildcard": name,
        "name_prefix": name,
        "popularity": category.popularity
    },function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var addApp = function(app, next) {
    var name = slugify(app.name);

    if (!name || name === '') {
        return next();
    }

    var appIndex = {
        id: app.id,
        type: APP_TYPE,
        name: name,
        "name_prefix": name,
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

            log.debug("Last app name: " + apps[apps.length - 1].name);

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

var addAllAuto = function(batchSize, next) {
    addAllCategories(function(err) {
        if (err) { return next(err); }

        addAllApps(batchSize, function(err) {
            if (err) { return next(err); }

            next();
        });
    });
};

exports.addAllAuto = addAllAuto;





