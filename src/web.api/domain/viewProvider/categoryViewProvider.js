'use strict';

var log = require("../../logger");
var appStoreRepo = require("../../repos/appStoreRepo");
var categorySearcher = require("../search/categorySearcher");
var redisCacheFactory = require("../cache/redisCache");
var categoryChartCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.chart);

var NUM_CHART_APPS = 20;
var CHART_CACHE_EXPIRY_SECONDS = 600;


var getCacheKeys = function(categoryIds) {
    var cacheKeys = categoryIds.map(function(categoryId) {
        return ('cat-' + categoryId);
    });

    return cacheKeys;
};

var getCategoryCharts = function(categoryIds, next) {
    var cacheKeys = getCacheKeys(categoryIds);

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
            cacheResults.forEach(function(cacheResult, i) {
                resultMap[categoryIds[i]] = cacheResult;
            });
            return next(null, resultMap);
        }

        getCategoryChartsRepo(missingIds, function(err, categoryMap) {
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

var getCategoryChartsRepo = function(categoryIds, next) {
    appStoreRepo.getMultiCategoryApps(categoryIds, NUM_CHART_APPS, function(err, apps) {
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

            delete app.categoryId;
            currentCategory.apps.push(app);
        });

        next(null, categoryAppsMap);
    });
};

var searchCategories = function(queryStr, pageNum, next) {
    categorySearcher.search(queryStr, pageNum, function(err, searchResult) {
        if (err) { return next(err); }

        var categoryIds = searchResult.categories.map(function(category) {
            return category.categoryId;
        });

        getCategoryCharts(categoryIds, function(err, categoryAppsMap) {
            if (err) { return next(err); }

            searchResult.categories.forEach(function(category) {
                var categoryChart = categoryAppsMap[category.categoryId];
                category.chart = categoryChart.apps;
                delete category.categoryId;
            });

            next(null, searchResult);
        });
    });
};

var searchApps = function(queryStr, pageNum, categoryId, next) {
    categorySearcher.searchApps(queryStr, pageNum, categoryId, next);
};

exports.searchCategories = searchCategories;
exports.searchApps = searchApps;








