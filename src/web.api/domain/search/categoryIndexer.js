'use strict';
var solr = require('solr-client');
var async = require('async');
var appStoreRepo = require('../../repos/appStoreRepo');
var log = require('../../logger');
var solrCore = require('./solrCore').getCategoryCore();

var addCategory = function(category, appDescriptions, next) {
    log.debug("Adding category: " + category.name);

    solrCore.client.add({
        id : category.id,
        name: category.name,
        description: category.description,
        url: category.urlName,
        "app_desc" : appDescriptions,
        "popularity": category.popularity
    },function(err, obj){
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
            appStoreRepo.getCategoryAppDescriptions(category.id, appDescriptionLimit, function(err, results) {
                if (err) {
                    return callback(err);
                }

                var appDescriptions = results.map(function(item) {
                    return item.description;
                });

                addCategory(category, appDescriptions, function(err) {
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


