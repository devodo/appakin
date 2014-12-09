'use strict';
var log = require('../logger');
var featuredRepo = require('../repos/featuredRepo');
var config = require('../config');
var urlUtil = require('../domain/urlUtil');

exports.init = function init(app) {
    app.get('/ios/featured/home', function (req, res, next) {
        var catBias = config.featured.homePage.categoryBias;
        var catTake = config.featured.homePage.categories;
        var appBias = config.featured.homePage.appBias;
        var appTake = config.featured.homePage.apps;

        featuredRepo.getFeaturedCategoriesAndApps(catBias, catTake, appBias, appTake, function(results, err) {
            if (err) { return next(err); }

            var categories = {};

            results.forEach(function(item) {
                var category = categories[item.catExtId];

                if (!category) {
                    category = {
                        id: item.catExtId,
                        name: item.catName,
                        url: urlUtil.makeUrl(item.catExtId, item.catName),
                        apps: []
                    };
                    categories[item.catExtId] = category;
                }

                var app = {
                    id: item.appExtId,
                    name: item.catName,
                    url: urlUtil.makeUrl(item.catExtId, item.catName),
                    apps: []
                }
            });

        });

        res.json(app);
    });
};
