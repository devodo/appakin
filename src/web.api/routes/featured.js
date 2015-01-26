'use strict';
var log = require('../logger');
var featuredRepo = require('../repos/featuredRepo');
var config = require('../config');
var urlUtil = require('../domain/urlUtil');
var redisCacheFactory = require("../domain/cache/redisCache");
var remoteCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.featured);

var localCache = null;

var catBias = config.featured.homePage.categoryBias;
var catTake = config.featured.homePage.categories;
var appBias = config.featured.homePage.appBias;
var appTake = config.featured.homePage.apps;
var remoteCacheExpirySeconds = config.featured.homePage.remoteCacheExpirySeconds;
var localCacheExpiryMs = config.featured.homePage.localCacheExpirySeconds * 1000;

var cacheKey = "home_featured";

var getFeatured = function(next) {
    remoteCache.getObject(cacheKey, function(err, cacheResult) {
        if (err) {
            log.error(err, "Error getting home featured apps from redis cache");
        }

        if (cacheResult) {
            return next(null, cacheResult);
        }

        featuredRepo.getFeaturedCategoriesAndApps(catBias, catTake, appBias, appTake, function(err, results) {
            if (err) { return next(err); }

            var categories = [];
            var currentCategory = null;

            results.forEach(function (item) {
                var itemId = item.catExtId.replace(/\-/g, '');
                if (!currentCategory || currentCategory.id !== itemId) {
                    currentCategory = {
                        id: itemId,
                        name: item.catName,
                        url: urlUtil.makeUrl(item.catExtId, item.catName),
                        apps: []
                    };
                    categories.push(currentCategory);
                }

                var app = {
                    id: item.appExtId.replace(/\-/g, ''),
                    name: item.appName,
                    artworkUrl: item.appArtworkSmallUrl,
                    url: urlUtil.makeUrl(item.appExtId, item.appName),
                    price: item.appPrice,
                    isIphone: item.appIsIphone,
                    isIpad: item.appIsIpad,
                    desc: item.appDesc
                };

                currentCategory.apps.push(app);
            });

            remoteCache.setEx(cacheKey, categories, remoteCacheExpirySeconds, function (err) {
                if (err) {
                    log.error(err);
                }
            });

            next(null, categories);
        });
    });
};

var getFeaturedCached = function(next) {
    var timeNow = new Date().getTime();

    if (!localCache || localCache.createTime + localCacheExpiryMs < timeNow) {
        getFeatured(function(err, categories) {
            if (err) { return next(err); }

            localCache = {
                createTime: timeNow,
                categories: categories
            };

            return next(null, categories);
        });
    } else {
        next(null, localCache.categories);
    }
};

exports.init = function init(app) {
    app.get('/ios/featured/home', function (req, res, next) {
        getFeaturedCached(function(err, categories) {
            if (err) { return next(err); }

            res.json(categories);
        });
    });
};
