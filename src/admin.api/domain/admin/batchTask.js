'use strict';

var categoryClassification = require('../../domain/dataAdmin/categoryClassification');
var clusterIndexer = require('../../domain/search/clusterIndexer');
var searchIndexClient = require('./searchIndexClient');
var appStoreAdminRepo = require('../../repos/appStoreAdminRepo');
var classificationRepo = require('../../repos/classificationRepo');
var ambiguityAnalyser = require('../analysis/ambiguityAnalyser');
var appAnalyser = require('../analysis/appAnalyser');
var log = require('../../logger');

var APP_BATCH_SIZE = 1000;
var INDEX_BATCH_SIZE = 1000;
var APP_ANALYSIS_BATCH_SIZE = 100;
var CAT_POSITION_FACTOR = 0.3;
var RELATED_CAT_POSITION_FACTOR = 0.3;
var MAX_RELATED = 100;

var rebuildAppIndex = function(next) {
    log.info("Triggering search index rebuild");

    searchIndexClient.triggerIndexSnapshot(INDEX_BATCH_SIZE, function(err) {
        next(err);
    });
};

var rebuildClusterIndex = function(next) {
    log.info("Rebuilding cluster index");

    clusterIndexer.rebuild(APP_BATCH_SIZE, function(err) {
        next(err);
    });
};

var clusterIndexChangedApps = function(modifiedSinceDate, next) {
    log.info("Indexing changed apps for cluster index");
    clusterIndexer.indexChangedApps(modifiedSinceDate, function(err) {
        next(err);
    });
};

var rebuildAllSeedCategories = function(next) {
    log.info("Reloading all seed category apps");
    categoryClassification.reloadAllSeedCategoryApps(function (err) {
        if (err) { return next(err); }

        log.info("Transferring all seed category apps");
        categoryClassification.transferAllSeedCategoryApps(function (err) {
            next(err);
        });
    });
};

var resetAppPopularity = function(next) {
    log.info("Resetting app popularities");

    appStoreAdminRepo.resetAppPopularities(next);
};

var resetCategoryPopularity = function(next) {
    log.info("Resetting category popularities");
    appStoreAdminRepo.resetCategoryPopularities(next);
};

var resetCategoryGenres = function(next) {
    log.info("Resetting category genres");
    appStoreAdminRepo.resetCategoryGenres(next);
};

var resetRelatedCategories = function(next) {
    log.info("Resetting related categories");
    appStoreAdminRepo.resetRelatedCategories(CAT_POSITION_FACTOR, RELATED_CAT_POSITION_FACTOR, MAX_RELATED, next);
};

var resetRelatedCategory = function(categoryId, next) {
    log.info("Resetting related category");
    appStoreAdminRepo.resetRelatedCategory(categoryId, CAT_POSITION_FACTOR, RELATED_CAT_POSITION_FACTOR, MAX_RELATED, next);
};

var rebuildSeedCategory = function(seedCategoryId, next) {
    categoryClassification.reloadSeedCategoryApps(seedCategoryId, function(err) {
        if (err) { return next(err); }

        categoryClassification.transferSeedCategoryApps(seedCategoryId, function(err) {
            if (err) { return next(err); }

            classificationRepo.getSeedCategoryMap(seedCategoryId, function(err, seedCategoryMap) {
                if (err) { return next(err); }

                if (!seedCategoryMap) {
                    return next("No seed category map found for seed category id: " + seedCategoryId);
                }

                resetRelatedCategory(seedCategoryMap.categoryId, function(err) {
                    if (err) { return next(err); }

                    next();
                });
            });
        });
    });
};

var analyseAmbiguity = function(next) {
    log.info("Starting ambiguity analysis");

    ambiguityAnalyser.analyse(function(err) {
        next(err);
    });
};

var analyseApps = function(batchSize, forceAll, next) {
    log.info("Starting apps analysis");

    appAnalyser.analyse(batchSize, forceAll, function(err) {
        next(err);
    });
};

var rebuildAll = function(next) {
    analyseApps(APP_ANALYSIS_BATCH_SIZE, false, function(err) {
        if (err) { return next(err); }

        resetAppPopularity(function(err) {
            if (err) { return next(err); }

            rebuildClusterIndex(function(err) {
                if (err) { return next(err); }

                rebuildAllSeedCategories(function(err) {
                    if (err) { return next(err); }

                    rebuildAppIndex(function(err) {
                        if (err) { return next(err); }

                        resetCategoryPopularity(function(err) {
                            if (err) { return next(err); }

                            resetRelatedCategories(function(err) {
                                if (err) { return next(err); }

                                resetCategoryGenres(function(err) {
                                    if (err) { return next(err); }

                                    analyseAmbiguity(function(err) {
                                        if (err) { return next(err); }

                                        next();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

exports.rebuildAll = rebuildAll;
exports.rebuildAllSeedCategories = rebuildAllSeedCategories;
exports.rebuildClusterIndex = rebuildClusterIndex;
exports.clusterIndexChangedApps = clusterIndexChangedApps;
exports.rebuildAppIndex = rebuildAppIndex;
exports.resetAppPopularity = resetAppPopularity;
exports.resetCategoryPopularity = resetCategoryPopularity;
exports.resetCategoryGenres = resetCategoryGenres;
exports.resetRelatedCategories = resetRelatedCategories;
exports.resetRelatedCategory = resetRelatedCategory;

exports.rebuildSeedCategory = rebuildSeedCategory;

exports.analyseAmbiguity = analyseAmbiguity;
exports.analyseApps = analyseApps;

