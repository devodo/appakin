'use strict';

var log = require("../../logger");
var appStoreRepo = require("../../repos/appStoreRepo");
var categorySearcher = require("../search/categorySearcher");
var redisCacheFactory = require("../cache/redisCache");
var categoryChartCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.chart);
var urlUtil = require('../urlUtil');

var NUM_CHART_APPS = 10;
var CHART_CACHE_EXPIRY_SECONDS = 600;


var getCacheKeys = function(categoryIds, filters) {
    var filterMask =
        (filters.isIphone === true ? "-iphone": "") +
        (filters.isIpad === true ? "-ipad": "") +
        (filters.isFree === true ? "-free" : "");

    var cacheKeys = categoryIds.map(function(categoryId) {
        return ('cat-' + categoryId + filterMask);
    });

    return cacheKeys;
};

var getCategoryCharts = function(categoryIds, filters, next) {
    if (categoryIds.length === 0) {
        return next(null, Object.create(null));
    }

    var cacheKeys = getCacheKeys(categoryIds, filters);

    categoryChartCache.getObjects(cacheKeys, function(err, cacheResults) {
        if (err) {
            log.error(err, "Error getting category charts from redis cache");
        }

        var missingIds;

        if (!cacheResults) {
            missingIds = categoryIds;
        }
        else {
            missingIds = [];
            cacheResults.forEach(function(cacheResult, i) {
                if (cacheResult === null) {
                    missingIds.push(categoryIds[i]);
                }
            });
        }

        if (missingIds.length === 0) {
            var resultMap = Object.create(null);

            if (cacheResults) {
                cacheResults.forEach(function (cacheResult, i) {
                    resultMap[categoryIds[i]] = cacheResult;
                });
            }

            return next(null, resultMap);
        }

        getCategoryChartsRepo(missingIds, filters, function(err, categoryMap) {
            if (err) { return next(err); }

            var cacheKeyValuePairs = [];

            if (cacheResults) {
                cacheResults.forEach(function (cacheResult, i) {
                    if (cacheResult !== null) {
                        categoryMap[categoryIds[i]] = cacheResult;
                    } else {
                        cacheKeyValuePairs.push({
                            key: cacheKeys[i],
                            value: categoryMap[categoryIds[i]]
                        });
                    }
                });
            }

            if (cacheKeyValuePairs.length > 0) {
                categoryChartCache.msetEx(cacheKeyValuePairs, CHART_CACHE_EXPIRY_SECONDS, function (err) {
                    if (err) {
                        log.error(err);
                    }

                    return;
                });
            }

            next(null, categoryMap);
        });
    });

};

var getCategoryChartsRepo = function(categoryIds, filters, next) {
    appStoreRepo.getMultiCategoryApps(categoryIds, NUM_CHART_APPS, filters, function(err, apps) {
        if (err) { return next(err); }

        var categoryAppsMap = Object.create(null);
        var currentCategory = null;
        apps.forEach(function(app) {
            if (currentCategory === null || currentCategory.id !== app.categoryId) {
                currentCategory =  {
                    id: app.categoryId,
                    apps: []
                };
                categoryAppsMap[app.categoryId] = currentCategory;
            }

            app.url = urlUtil.makeUrl(app.extId, app.name);

            delete app.categoryId;
            currentCategory.apps.push(app);
        });

        next(null, categoryAppsMap);
    });
};

var searchCategories = function(queryStr, pageNum, filters, next) {
    categorySearcher.search(queryStr, pageNum, filters, function(err, searchResult) {
        if (err) { return next(err); }

        var categoryIds = searchResult.categories.map(function(category) {
            return category.categoryId;
        });

        getCategoryCharts(categoryIds, filters, function(err, categoryAppsMap) {
            if (err) { return next(err); }

            searchResult.categories.forEach(function(category) {
                var categoryChart = categoryAppsMap[category.categoryId];

                if (!categoryChart) {
                    log.warn("No category chart found for category id: " + category.categoryId);
                } else {
                    category.chart = categoryChart.apps;
                }

                delete category.categoryId;
            });

            next(null, searchResult);
        });
    });
};

var searchApps = function(queryStr, pageNum, categoryId, filters, next) {
    categorySearcher.searchApps(queryStr, pageNum, categoryId, filters, next);
};

exports.searchCategories = searchCategories;
exports.searchApps = searchApps;








