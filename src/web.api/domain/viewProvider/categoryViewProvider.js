'use strict';

var log = require("../../logger");
var appStoreRepo = require("../../repos/appStoreRepo");
var categorySearcher = require("../search/categorySearcher");
var appSearcher = require("../search/elasticSearch/appSearcher");
var redisCacheFactory = require("../cache/redisCache");
var categoryChartCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.chart);
var categoryCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.category);
var urlUtil = require('../urlUtil');
var async = require('async');

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

var getCategoryChartsRepo = function(categoryIds, filters, next) {
    appStoreRepo.getMultiCategoryApps(categoryIds, NUM_CHART_APPS, filters, function(err, apps) {
        if (err) { return next(err); }

        var categoryResults = [];
        var currentCategory = null;
        apps.forEach(function(app) {
            if (currentCategory === null || currentCategory.id !== app.categoryId) {
                currentCategory =  {
                    id: app.categoryId,
                    apps: []
                };
                categoryResults.push(currentCategory);
            }

            app.id = app.extId.replace(/\-/g, '');
            delete app.extId;
            app.url = urlUtil.makeUrl(app.id, app.name);

            delete app.categoryId;
            currentCategory.apps.push(app);
        });

        next(null, categoryResults);
    });
};

var getCategoryByExtIdRepo = function(extCategoryId, next) {
    appStoreRepo.getCategoryByExtId(extCategoryId, function(err, category) {
        if (err) { return next(err); }

        return next(null, category);
    });
};

var getCategoriesRepo = function(categoryIds, next) {
    appStoreRepo.getCategories(categoryIds, function(err, categories) {
        if (err) { return next(err); }

        categories.forEach(function(category) {
            category.extId = category.extId.replace(/\-/g, '');
            category.url = urlUtil.makeUrl(category.extId, category.name);
        });

        return next(null, categories);
    });
};

var getCategoryByExtIdCacheKey = function(categoryId) {
    return ('cat-extid-' + categoryId);
};

var getCategoryCacheKey = function(categoryId) {
    return ('cat-' + categoryId);
};

var getCategoryByExtId = function(extCategoryId, next) {
    var cacheKey = getCategoryByExtIdCacheKey(extCategoryId);

    categoryCache.getObject(cacheKey, function(err, cacheResult) {
        if (err) {
            log.error(err, "Error getting category from redis cache: " + extCategoryId);
        }

        if (cacheResult) {
            next(null, cacheResult);
        } else {
            getCategoryByExtIdRepo(extCategoryId, function(err, category) {
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

var getCreateCategoryChartKeyFunc = function(filters) {
    var filterMask = getFilterMask(filters);

    return function(categoryId) {
        return ('cat_chart-' + categoryId + filterMask);
    };
};

var getCategoryChartsRepoFunc = function(filters) {
    return function(categoryIds, next) {
        return getCategoryChartsRepo(categoryIds, filters, next);
    };
};

var getCategoriesCharts = function(categoryIds, filters, next) {
    var createKeyFunc = getCreateCategoryChartKeyFunc(filters);
    var repoLookupFunc = getCategoryChartsRepoFunc(filters);
    getMultiCacheObjects(categoryChartCache, categoryIds, createKeyFunc, repoLookupFunc, CHART_CACHE_EXPIRY_SECONDS, next);
};

var getCategories = function(categoryIds, next) {
    getMultiCacheObjects(categoryCache, categoryIds, getCategoryCacheKey, getCategoriesRepo, CATEGORY_CACHE_EXPIRY_SECONDS, next);
};

var getMultiCacheObjects = function(cache, ids, createKeyFunc, repoLookupFunc, expirySeconds, next, retryCount) {
    if (ids.length === 0) {
        return next(null, []);
    }

    var cacheKeys = ids.map(function(id) {
        return createKeyFunc(id);
    });

    cache.getObjects(cacheKeys, function(err, cacheResults) {
        if (err) {
            log.error(err, "Error getting multi objects from redis cache.");

            if (err.isParseError) {
                log.warn(err, "Parse errors encountered. Will attempt to clear cache and retry.");

                return cache.deleteKeys(err.keys, function(err) {
                    if (err) { return next(err); }

                    //retry
                    retryCount = retryCount ? retryCount + 1 : 1;
                    if (retryCount > 2) {
                        return next(new Error('Get multi objects stuck in retry loop'));
                    }

                    getMultiCacheObjects(cache, ids, createKeyFunc, repoLookupFunc, expirySeconds, next, retryCount);
                });
            }
        }

        var missingIds;
        var missingIdsIndex;
        var results;

        if (!cacheResults) {
            missingIds = ids;
            results = [];
        }
        else {
            missingIds = [];
            missingIdsIndex = [];
            results = cacheResults;

            cacheResults.forEach(function(cacheResult, i) {
                if (cacheResult === null) {
                    missingIds.push(ids[i]);
                    missingIdsIndex.push(i);
                }
            });
        }

        if (missingIds.length === 0) {
            return next(null, results);
        }

        repoLookupFunc(missingIds, function(err, repoResults) {
            if (err) { return next(err); }

            var repoResultsMap = Object.create(null);
            var cacheKeyValuePairs = [];

            repoResults.forEach(function(repoResult) {
                repoResultsMap[repoResult.id] = repoResult;
                delete repoResult.id;

                if (cacheResults) {
                    cacheKeyValuePairs.push({
                        key: createKeyFunc(repoResult.id),
                        value: repoResult
                    });
                }
            });

            if (cacheKeyValuePairs.length > 0) {
                cache.msetEx(cacheKeyValuePairs, expirySeconds, function (err) {
                    if (err) {
                        log.error(err);
                    }
                });
            }

            missingIds.forEach(function(missingId, i) {
                if (cacheResults) {
                    results[missingIdsIndex[i]] = repoResultsMap[missingId];
                } else {
                    results.push(repoResultsMap[missingId]);
                }
            });

            next(null, results);
        });
    });
};

var parseAppResults = function(appResults) {
    var apps = appResults.apps.map(function(appResult) {
        var app = {
            id: appResult.field.ext_id,
            name: appResult.field.name,
            url: urlUtil.makeUrl(appResult.field.ext_id, appResult.field.name),
            imageUrl: appResult.field.image_url,
            price: appResult.field.price,
            rating: appResult.field.rating
        };

        if (appResult.highlight) {
            app.highlight = {};

            if (appResult.highlight.name_stem) {
                app.highlight.name = appResult.highlight.name_stem;
            }

            if (appResult.highlight.desc_stem) {
                app.highlight.desc = appResult.highlight.desc_stem;
            }
        }

        return app;
    });

    return apps;
};

var parseAppResultsMain = function(appResults) {
    return {
        total: appResults.total,
        apps: parseAppResults(appResults)
    }
};

var searchMain = function(queryStr, pageNum, filters, next) {
    appSearcher.search(queryStr, pageNum, filters, function(err, searchResult) {
        if (err) {
            return next(err);
        }

        var result = {
            page: pageNum
        };

        if (searchResult.result.app) {
            result.appResults = parseAppResultsMain(searchResult.result.app);
        }

        if (!searchResult.result.category) {
            return next(null, result);
        }

        var categoryIds = searchResult.result.category.categories.map(function (categoryResult) {
            return categoryResult.id;
        });

        result.categoryResults = {
            total: searchResult.result.category.total
        };

        async.parallel([
                function (callback) {
                    getCategoriesCharts(categoryIds, filters, callback);
                },
                function (callback) {
                    getCategories(categoryIds, callback);
                }
            ],
            function (err, results) {
                if (err) {
                    return next(err);
                }

                result.categoryResults.categories = searchResult.result.category.categories.map(function (categoryResult, i) {
                    var category = results[1][i];

                    if (!category) {
                        return next(new Error('Category missing: ' + categoryResult.id));
                    }

                    var categoryChart = results[0][i];

                    if (!categoryChart) {
                        return next(new Error('Category chart missing: ' + categoryResult.id));
                    }

                    category.id = category.extId;
                    delete category.extId;
                    delete category.description;

                    category.chart = categoryChart;
                    category.appResults = parseAppResultsMain(categoryResult.app);

                    return category;
                });

                next(null, result);
            });
    });
};

var searchCategories = function(queryStr, pageNum, filters, next) {
    appSearcher.searchCategories(queryStr, pageNum, filters, function(err, searchResult) {
        if (err) { return next(err); }

        var result = {
            page: pageNum,
            total: searchResult.result.category.total,
            suggestions: []
        };

        if (searchResult.result.suggestions) {
            result.suggestions = searchResult.result.suggestions.map(function (suggestion) {
                return suggestion.text;
            });
        }

        var categoryIds = searchResult.result.category.categories.map(function (categoryResult) {
            return categoryResult.id;
        });

        if (categoryIds.length === 0) {
            return next(null, result);
        }

        async.parallel([
                function (callback) {
                    getCategoriesCharts(categoryIds, filters, callback);
                },
                function (callback) {
                    getCategories(categoryIds, callback);
                }
            ],
            function (err, results) {
                if (err) {
                    return next(err);
                }

                result.categories = searchResult.result.category.categories.map(function (categoryResult, i) {
                    var category = results[1][i];

                    if (!category) {
                        return next(new Error('Category missing: ' + categoryResult.id));
                    }

                    var categoryChart = results[0][i];

                    if (!categoryChart) {
                        return next(new Error('Category chart missing: ' + categoryResult.id));
                    }

                    category.id = category.extId;
                    delete category.extId;
                    delete category.description;

                    category.totalApps = categoryResult.app.total;
                    category.apps = parseAppResults(categoryResult.app);
                    category.chart = categoryChart;


                    return category;
                });

                next(null, result);
            });
    });
};

var searchApps = function(queryStr, pageNum, extCategoryId, filters, next) {
    extCategoryId = extCategoryId.replace(/\-/g, '');

    getCategoryByExtId(extCategoryId, function(err, category) {
        if (err) { return next(err); }

        if (!category) {
            return next("No category found id: " + extCategoryId);
        }

        getCategoriesCharts([category.id], filters, function(err, categoriesCharts) {
            if (err) { return next(err); }

            var categoryChart = categoriesCharts[0];

            if (!categoryChart) {
                log.error("No category chart found for category id: " + extCategoryId);
            }

            categorySearcher.searchApps(queryStr, pageNum, extCategoryId, filters, function(err, searchResult) {
                if (err) { return next(err); }

                searchResult.categoryId = extCategoryId;
                searchResult.categoryName = category.name;
                searchResult.categoryUrl = urlUtil.makeUrl(extCategoryId, category.name);
                searchResult.categoryChart = categoryChart.apps;

                next(null, searchResult);
            });
        });
    });
};


exports.searchCategories = searchCategories;
exports.searchApps = searchApps;
exports.getCategoryChartAppsMap = null;
exports.getCategoriesCharts = getCategoriesCharts;








