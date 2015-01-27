'use strict';

var log = require("../../logger");
var appStoreRepo = require("../../repos/appStoreRepo");
var categorySearcher = require("../search/categorySearcher");
var redisCacheFactory = require("../cache/redisCache");
var categoryChartCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.chart);
var categoryCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.category);
var urlUtil = require('../urlUtil');

var NUM_CHART_APPS = 10;
var CHART_CACHE_EXPIRY_SECONDS = 600;
var CATEGORY_CACHE_EXPIRY_SECONDS = 3600;

var getFilterMask = function(filters) {
    var filterMask =
        (filters.isIphone === true ? "-iphone": "") +
        (filters.isIpad === true ? "-ipad": "") +
        (filters.isFree === true ? "-free" : "");

    return filterMask;
};

var getCategoryChartCacheKeys = function(categoryIds, filters) {
    var filterMask = getFilterMask(filters);

    var cacheKeys = categoryIds.map(function(categoryId) {
        return ('cat_chart-' + categoryId + filterMask);
    });

    return cacheKeys;
};

var getCategoryCacheKey = function(categoryId) {
    return ('cat-' + categoryId);
};

var getCategory = function(categoryId, next) {
    var cacheKey = getCategoryCacheKey(categoryId);

    categoryCache.getObject(cacheKey, function(err, cacheResult) {
        if (err) {
            log.error(err, "Error getting category from redis cache: " + categoryId);
        }

        if (cacheResult) {
            next(null, cacheResult);
        } else {
            getCategoryRepo(categoryId, function(err, category) {
                if (err) { return next(err); }

                categoryCache.setEx(cacheKey, category, CATEGORY_CACHE_EXPIRY_SECONDS, function (err) {
                    if (err) {
                        log.error(err);
                    }
                });

                return next(null, category);
            });
        }
    });
};

var getCategoryCharts = function(categoryIds, filters, next) {
    if (categoryIds.length === 0) {
        return next(null, Object.create(null));
    }

    var cacheKeys = getCategoryChartCacheKeys(categoryIds, filters);

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

            app.id = app.extId.replace(/\-/g, '');
            delete app.extId;
            app.url = urlUtil.makeUrl(app.id, app.name);

            delete app.categoryId;
            currentCategory.apps.push(app);
        });

        next(null, categoryAppsMap);
    });
};

var getCategoryRepo = function(categoryId, next) {
    appStoreRepo.getCategoryByExtId(categoryId, function(err, category) {
        if (err) { return next(err); }

        return next(null, category);
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
    categoryId = categoryId.replace(/\-/g, '');

    getCategory(categoryId, function(err, category) {
        if (err) { return next(err); }

        if (!category) {
            return next("No category found id: " + categoryId);
        }

        getCategoryCharts([category.id], filters, function(err, categoryAppsMap) {
            if (err) { return next(err); }

            var categoryChart = categoryAppsMap[category.id];

            if (!categoryChart) {
                log.error("No category chart found for category id: " + categoryId);
            }

            categorySearcher.searchApps(queryStr, pageNum, categoryId, filters, function(err, searchResult) {
                if (err) { return next(err); }

                searchResult.categoryId = categoryId;
                searchResult.categoryName = category.name;
                searchResult.categoryUrl = urlUtil.makeUrl(categoryId, category.name);
                searchResult.categoryChart = categoryChart.apps;

                next(null, searchResult);
            });
        });
    });
};

exports.searchCategories = searchCategories;
exports.searchApps = searchApps;








