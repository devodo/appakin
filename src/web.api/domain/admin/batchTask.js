'use strict';

var categoryClassification = require('../../domain/dataAdmin/categoryClassification');
var clusterIndexer = require('../../domain/search/clusterIndexer');
var autoIndexer = require('../../domain/search/autoIndexer');
var appIndexer = require('../../domain/search/appIndexer');
var categoryIndexer = require('../../domain/search/categoryIndexer');
var log = require('../../logger');

var APP_BATCH_SIZE = 1000;
var MAX_NGRAM_DEPTH = 6;

var rebuildClusterIndex = function(next) {
    log.info("Rebuilding cluster index");
    clusterIndexer.rebuild(APP_BATCH_SIZE, function(err) {
        next(err);
    });
};

var rebuildAutoIndex = function(next) {
    log.info("Rebuilding auto index");
    autoIndexer.rebuild(APP_BATCH_SIZE, MAX_NGRAM_DEPTH, function(err) {
        next(err);
    });
};

var rebuildAppIndex = function(next) {
    log.info("Rebuilding app index");
    appIndexer.rebuild(APP_BATCH_SIZE, function(err) {
        next(err);
    });
};

var rebuildCategoryIndex = function(next) {
    log.info("Rebuilding category index");
    categoryIndexer.rebuild(function(err) {
        next(err);
    });
};

var reloadCategoryApps = function(next) {
    log.info("Reloading all seed category apps");
    categoryClassification.reloadAllSeedCategoryApps(function (err) {
        if (err) { return next(err); }

        log.info("Transferring all seed category apps");
        categoryClassification.transferAllSeedCategoryApps(function (err) {
            next(err);
        });
    });
};

var rebuildCategories = function(next) {
    rebuildClusterIndex(function(err) {
        if (err) { return next(err); }

        reloadCategoryApps(function(err) {
            if (err) { return next(err); }

            rebuildCategoryIndex(function(err) {
                next(err);
            });
        });
    });
};

var rebuildAll = function(next) {
    var errors = [];
    rebuildCategories(function(err) {
        if (err) { errors.push(err); }

        rebuildAutoIndex(function(err) {
            if (err) { errors.push(err); }

            rebuildAppIndex(function(err) {
                if (err) { errors.push(err); }

                if (errors.length > 0) {
                    return next(errors);
                } else {
                    return next();
                }
            });
        });
    });
};

exports.rebuildAll = rebuildAll;

