'use strict';
var log = require('../logger');
var featuredRepo = require('../repos/featuredRepo');
var config = require('../config');
var urlUtil = require('../domain/urlUtil');

var featuredCache = null;

var getFeatured = function(next) {
    var catBias = config.featured.homePage.categoryBias;
    var catTake = config.featured.homePage.categories;
    var appBias = config.featured.homePage.appBias;
    var appTake = config.featured.homePage.apps;

    featuredRepo.getFeaturedCategoriesAndApps(catBias, catTake, appBias, appTake, function(err, results) {
        if (err) { return next(err); }

        var categories = [];
        var currentCategory = null;

        results.forEach(function (item) {

            if (!currentCategory || currentCategory.id !== item.catExtId) {
                currentCategory = {
                    id: item.catExtId,
                    name: item.catName,
                    url: urlUtil.makeUrl(item.catExtId, item.catName),
                    apps: []
                };
                categories.push(currentCategory);
            }

            var app = {
                id: item.appExtId,
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

        next(null, categories);
    });
};

var getFeaturedCached = function(next) {
    var cacheTtlMs = config.featured.homePage.ttl;
    var timeNow = new Date().getTime();

    if (!featuredCache || featuredCache.createTime + cacheTtlMs < timeNow) {
        getFeatured(function(err, categories) {
            if (err) { return next(err); }

            featuredCache = {
                createTime: timeNow,
                categories: categories
            };

            return next(null, categories);
        });
    } else {
        next(null, featuredCache.categories);
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
