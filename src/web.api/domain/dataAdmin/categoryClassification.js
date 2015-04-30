'use strict';
var async = require('async');
var classificationRepo = require('../../repos/classificationRepo');
var clusterSearcher = require('../search/clusterSearcher');
var log = require('../../logger');

var MIN_SEED_CATEGORY_APPS = 5;

var getClassifiedCategoryAppExtIds = function(seedCategoryId, next) {
    classificationRepo.getTrainingSet(seedCategoryId, function(err, trainingSet) {

        if (trainingSet.length === 0) {
            return next(null);
        }

        clusterSearcher.classifyTrainedSeedCategory(seedCategoryId, trainingSet, function(err, classifiedApps) {
            if (err) { return next(err); }

            var categoryAppExtIds = classifiedApps.filter(function(app) {
                return app.result;
            }).map(function(app) {
                return app.id;
            });

            return next(null, categoryAppExtIds);
        });
    });
};

var getSeedSearchCategoryAppExtIds = function(seedCategoryId, next) {
    var boost = 10;
    clusterSearcher.getCategorySearchSeedApps(seedCategoryId, boost, function(err, apps) {
        if (err) { return next(err); }

        var appExtIds = apps.map(function(app) {
            return app.extId;
        });

        return next(null, appExtIds);
    });
};

var getClassifiedOrSeedSearchCategoryAppExtIds = function(seedCategoryId, next) {
    getClassifiedCategoryAppExtIds(seedCategoryId, function(err, appExtIds) {
        if (err) { return next(err); }

        if (appExtIds) {
            return next(null, appExtIds);
        }

        getSeedSearchCategoryAppExtIds(seedCategoryId, function(err, appExtIds) {
            if (err) { return next(err); }

            next(null, appExtIds);
        });
    });
};

var processReloadSeedCategoryApps = function(seedCategory, next) {
    log.debug("Reloading seed apps for category: " + seedCategory.id);
    getClassifiedOrSeedSearchCategoryAppExtIds(seedCategory.id, function(err, appExtIds) {
        if (err) { return next(err); }

        if (appExtIds.length < MIN_SEED_CATEGORY_APPS) {
            return next("Not enough category apps found: " + appExtIds.length);
        }

        log.debug("Resetting apps for seed category: " + seedCategory.id);
        classificationRepo.resetSeedCategoryApps(seedCategory.id, appExtIds, function(err) {
            if (err) { return next(err); }

            log.debug("Completed reloading seed apps for category: " + seedCategory.id);
            next();
        });
    });
};

var errorToString = function(err) {
    var message = err;

    if (typeof err === 'object') {
        message = JSON.stringify(err);
    }

    return message;
};

var reloadAllSeedCategoryApps = function(next) {
    classificationRepo.getActiveSeedCategories(function(err, seedCategories) {
        if (err) { return next(err); }

        var asyncIterator = function(seedCategory, callback) {
            processReloadSeedCategoryApps(seedCategory, function(err) {
                if (err) {
                    log.error(err);
                    var message = errorToString(err);
                    classificationRepo.updateSeedCategoryBuildMessage(seedCategory.id, message, function(err) {
                        if (err) { return next(err); }

                        return callback();
                    });
                } else {
                    callback();
                }
            });
        };

        async.eachSeries(seedCategories, asyncIterator, function(err) {
            return next(err);
        });
    });
};

var reloadSeedCategoryApps = function(seedCategoryId, next) {
    classificationRepo.getSeedCategory(seedCategoryId, function(err, seedCategory) {
        if (err) { return next(err); }

        if (!seedCategory) {
            return next("No seed category found with id: " + seedCategoryId);
        }

        if (seedCategory.dateDeleted) {
            return next("Seed category is set as deleted: " + seedCategoryId);
        }

        if (!seedCategory.isActive) {
            return next("Seed category is not set as active: " + seedCategoryId);
        }

        processReloadSeedCategoryApps(seedCategory, function(err) {
            if (err) {
                log.error(err);
                var message = JSON.stringify(err);
                classificationRepo.updateSeedCategoryBuildMessage(seedCategory.id, message, function(err) {
                    return next(err);
                });
            }

            next();
        });
    });
};

var getSeedCategoryAppsAndValidate = function(seedCategoryId, next) {
    classificationRepo.getSeedCategoryApps(seedCategoryId, function(err, seedCategoryApps) {
        if (err) { return next(err); }

        if (seedCategoryApps.length < MIN_SEED_CATEGORY_APPS) {
            return next(new Error("Transfer failed due to not enough apps for seed category id: " + seedCategory.id));
        }

        return next(null, seedCategoryApps);
    });
};

var processTransferSeedCategoryApps = function(seedCategory, next) {
    log.debug("Transfering seed apps for category: " + seedCategory.id);

    if (!seedCategory.buildVersion) {
        log.warn("Seed category does not have a valid build_version: " + seedCategory.id);
        return next();
    }

    classificationRepo.getSeedCategoryMap(seedCategory.id, function(err, seedCategoryMap) {
        if (err) { return next(err); }

        if (seedCategoryMap && seedCategory.buildVersion === seedCategoryMap.buildVersion) {
            log.debug("Skipping as category apps already at latest build version: " + seedCategory.buildVersion);
            return next();
        }

        getSeedCategoryAppsAndValidate(seedCategory.id, function(err, seedCategoryApps) {
            if (err) { return next(err); }

            if (seedCategoryMap) {
                log.debug("Resetting category apps for category: " + seedCategoryMap.categoryId);
                classificationRepo.resetCategoryFromSeed(seedCategory, seedCategoryMap, seedCategoryApps, function(err) {
                    if (err) { return next(err); }

                    return next();
                });
            } else {
                log.debug("Creating new category from seed category: " + seedCategory.id);
                classificationRepo.createCategoryFromSeed(seedCategory, seedCategoryApps, function(err) {
                    if (err) { return next(err); }

                    return next();
                });
            }
        });
    });
};

var transferSeedCategoryApps = function(seedCategoryId, next) {
    classificationRepo.getSeedCategory(seedCategoryId, function(err, seedCategory) {
        processTransferSeedCategoryApps(seedCategory, function(err) {
            if (err) {
                log.error(err);
                var message = errorToString(err);
                classificationRepo.updateSeedCategoryBuildMessage(seedCategory.id, message, function(err) {
                    if (err) { return next(err); }

                    return next(message);
                });
            } else {
                next();
            }
        });
    });
};

var transferAllSeedCategoryApps = function(next) {
    classificationRepo.getActiveSeedCategories(function(err, seedCategories) {
        if (err) { return next(err); }

        var asyncIterator = function(seedCategory, callback) {
            processTransferSeedCategoryApps(seedCategory, function(err) {
                if (err) {
                    log.error(err);
                    var message = errorToString(err);
                    classificationRepo.updateSeedCategoryBuildMessage(seedCategory.id, message, function(err) {
                        if (err) { return next(err); }

                        return callback();
                    });
                } else {
                    callback();
                }
            });
        };

        async.eachSeries(seedCategories, asyncIterator, function(err) {
            if (err) { return next(err); }

            log.debug("Completed transfering all seed category apps");
            return next();
        });
    });
};

exports.reloadAllSeedCategoryApps = reloadAllSeedCategoryApps;
exports.rebuildAllSeedCategories = reloadSeedCategoryApps;
exports.transferAllSeedCategoryApps = transferAllSeedCategoryApps;

exports.reloadSeedCategoryApps = reloadSeedCategoryApps;
exports.transferSeedCategoryApps = transferSeedCategoryApps;