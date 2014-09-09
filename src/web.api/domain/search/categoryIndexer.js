'use strict';
var solr = require('solr-client');
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var log = require('../../logger');
var solrCore = require('./solrCore').getCategoryCore();

var CATEGORY_TYPE = 1;
var APP_TYPE = 2;


var addCategory = function(category, apps, next) {
    log.debug("Adding category: " + category.name);

    var solrApps = apps.map(function(app) {
        var position = parseInt(app.position, 10);
        var popularity = 1.0 / position;

        return {
            id : category.id + '-' + app.id,
            type: APP_TYPE,
            name: app.name,
            desc: app.description,
            popularity: popularity
        };
    });

    var solrCategory = {
        id : category.id,
        type: CATEGORY_TYPE,
        name: category.name,
        desc: category.description,
        url: category.urlName,
        "_childDocuments_" : solrApps,
        popularity: category.popularity
    };

    solrCore.client.add(solrCategory, function(err, obj){
        if(err){
            return next(err);
        }

        return next(null, obj);
    });
};

var addAllCategories = function(appDescriptionLimit, next) {
    appStoreRepo.getCategories(function(err, categories) {
        if (err) {
            return next(err);
        }

        var processCategory = function(category, callback) {
            appStoreRepo.getCategoryAppsForIndex(category.id, function(err, apps) {
                if (err) {
                    return callback(err);
                }

                addCategory(category, apps, function(err) {
                    callback(err);
                });
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

exports.addCategory = function(category, next) {
    addCategory(category, function(err, resp) {
        if (err) {
            return next(err);
        }

        solrCore.commit(function(err) {
            next(err, resp);
        });
    });
};

exports.addAllCategories = addAllCategories;


