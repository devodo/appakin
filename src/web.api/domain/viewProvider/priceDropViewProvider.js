'use strict';

var log = require("../../logger");
var config = require("../../config");
var appStoreRepo = require("../../repos/appStoreRepo");
var redisCacheFactory = require("../cache/redisCache");
var priceDropCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.pricedrop);
var categoryViewProvider = require("./categoryViewProvider");
var urlUtil = require('../urlUtil');
var appRank = require('../appRank');

var MAX_DAYS = 60;
var MIN_POPULARITY = 0.58489319246111;

var NUM_APPS = 10;
var PRICE_DROP_CACHE_EXPIRY_SECONDS = 600;
var PRICE_DROP_CATEGORY_KEY = "popular_price_drops";

var getFilterMask = function(filters) {
    var filterMask =
        (filters.isIphone === true ? "_iphone": "") +
        (filters.isIpad === true ? "_ipad": "") +
        (filters.isFree === true ? "_free" : "");

    return filterMask;
};

var getPopularPriceDropsRepo = function(filters, next) {
    appStoreRepo.getPopularPriceDrops(MAX_DAYS, MIN_POPULARITY, filters, function(err, priceDrops) {
        if (err) { return next(err); }

        var categoriesMap = {};
        var categories = [];

        priceDrops.forEach(function(priceDrop) {
            var app = {
                id: priceDrop.extId.replace(/\-/g, ''),
                name: priceDrop.name,
                artworkSmallUrl: priceDrop.artworkSmall,
                price: priceDrop.price,
                oldPrice: priceDrop.oldPrice,
                ageDays: priceDrop.ageDays,
                popularity: appRank.normalisePopularity(priceDrop.popularity),
                rating: appRank.getRating(priceDrop),
                url: urlUtil.makeUrl(priceDrop.extId, priceDrop.name)
            };

            priceDrop.categories.forEach(function(categoryId) {
                var category = categoriesMap[categoryId];

                if (!category) {
                    category = {
                        id: categoryId,
                        totalApps: 0,
                        score: 0,
                        apps: []
                    };

                    categoriesMap[categoryId] = category;
                    categories.push(category);
                }

                category.totalApps++;

                var popularityLog = Math.log(priceDrop.popularity)/Math.log(10);
                var appWeight = popularityLog / Math.pow(app.ageDays + 1, 0.5);
                category.score += appWeight;

                if (category.apps.length < NUM_APPS) {
                    category.apps.push(app);
                }

            });
        });

        categories.sort(function(a, b) {
            return b.score - a.score;
        });

        next(null, categories);
    });
};

var getPriceDropCategories = function(skip, take, filters, next) {
    var filterMask = getFilterMask(filters);
    var catKey = PRICE_DROP_CATEGORY_KEY + filterMask;

    priceDropCache.lRangeObjects(catKey, skip, take, function(err, cacheResult) {
        if (err) { return next(err); }

        if (cacheResult && cacheResult.total > 0) {
            return next(null, {
                total: cacheResult.total,
                categories: cacheResult.items
            });
        }

        getPopularPriceDropsRepo(filters, function(err, categories) {
            if (err) { return next(err); }

            priceDropCache.createList(catKey, categories, PRICE_DROP_CACHE_EXPIRY_SECONDS, function(err) {
                if (err) { log.error(err); }
            });

            if (!categories) {
                return next(null, null);
            }

            var result = {
                total: categories.length,
                categories: categories.slice(skip, skip + take)
            };

            next(null, result);
        });

    });
};

var getPopularPriceDrops = function(skip, take, filters, next) {
    var filterMask = getFilterMask(filters);

    getPriceDropCategories(skip, take, filterMask, function(err, result) {
        if (err) { return next(err); }

        if (!result) {
            return next();
        }

        var pcCategoryIds = result.categories.map(function(pcCategory) {
            return pcCategory.id;
        });

        categoryViewProvider.getCategories(pcCategoryIds, function(err, categories) {
            if (err) { return next(err); }

            result.categories.forEach(function(pcCategory, i) {
                pcCategory.id = categories[i].extId;
                pcCategory.name = categories[i].name;
                pcCategory.url = categories[i].url;

                delete pcCategory.score;
            });

            next(null, result);
        });
    });
};

exports.getPopularPriceDrops = getPopularPriceDrops;








