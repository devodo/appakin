'use strict';
var log = require('../logger');
var urlUtil = require('../domain/urlUtil');
var appStoreRepo = require('../repos/appStoreRepo');
var featuredRepo = require('../repos/featuredRepo');
var catViewProvider = require('../domain/viewProvider/categoryViewProvider');

var PAGE_SIZE = 20;
var MAX_CAT_PAGES = 10;
var MAX_RELATED = 5;

exports.init = function init(app) {

    app.get('/ios/category/:encodedId/:slug', function (req, res, next) {
        var encodedId = req.params.encodedId;
        if (!encodedId)
        {
            return res.status(400).json({error: 'Bad query string'});
        }

        var extId = urlUtil.decodeId(encodedId);

        if (!extId) {
            return res.status(400).json({error: 'Bad category id'});
        }

        var pageNum = (req.query && req.query.p) ? parseInt(req.query.p, 10) : 1;

        if (isNaN(pageNum) || pageNum < 1 || pageNum > MAX_CAT_PAGES) {
            return res.status(400).json({error: 'Bad page number'});
        }

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        appStoreRepo.getCategoryByExtId(extId, function (err, category) {
            if (err) {
                return next(err);
            }

            if (!category) {
                return res.status(404).json({error: 'Category not found'});
            }

            var urlName = urlUtil.slugifyName(category.name);
            var categoryUrl = urlUtil.makeUrl(category.extId, category.name);
            if (req.params.slug !== urlName) {
                var absUrl = '/ios/category/' + categoryUrl;
                if (pageNum > 1) {
                    absUrl += '?p=' + pageNum;
                }
                return res.redirect(301, absUrl);
            }

            var skip = (pageNum - 1) * PAGE_SIZE;
            appStoreRepo.getCategoryApps(category.id, filters, skip, PAGE_SIZE, function (err, result) {
                if (err) {
                    return next(err);
                }

                var apps = result.apps;

                apps.forEach(function (app) {
                    app.id = app.extId.replace(/\-/g, '');
                    app.url = urlUtil.makeUrl(app.extId, app.name);
                    delete app.extId;
                });

                category.url = categoryUrl;
                category.page = pageNum;
                category.totalPages = Math.min(MAX_CAT_PAGES, Math.ceil(result.total / PAGE_SIZE));
                category.apps = apps;

                featuredRepo.getFeaturedApps(category.id, 2, 5, filters, function (err, fApps) {
                    if (err) {
                        return next(err);
                    }

                    var featuredApps = fApps.map(function (item) {
                        return {
                            id: item.extId.replace(/\-/g, ''),
                            name: item.name,
                            artworkUrl: item.artworkSmallUrl,
                            url: urlUtil.makeUrl(item.extId, item.name),
                            isIphone: item.isIphone,
                            isIpad: item.isIpad,
                            price: item.price
                        };
                    });

                    category.featured = featuredApps;

                    category.id = category.extId.replace(/\-/g, '');
                    delete category.extId;
                    res.json(category);
                });
            });
        });
    });

    app.get('/ios/related_categories/:encodedId/:slug?', function (req, res, next) {
        var encodedId = req.params.encodedId;
        if (!encodedId)
        {
            return res.status(400).json({error: 'Bad query string'});
        }

        var extId = urlUtil.decodeId(encodedId);

        if (!extId) {
            return res.status(400).json({error: 'Bad category id'});
        }

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        appStoreRepo.getRelatedCategoriesByExtId(extId, 0, MAX_RELATED, function (err, categories) {
            if (err) { return next(err); }

            var categoryIds = categories.map(function(category) {
                return category.id;
            });

            catViewProvider.getCategoryChartAppsMap(categoryIds, filters, function(err, categoryAppsMap) {
                if (err) { return next(err); }

                var relatedCategories = categories.map(function(category) {
                    var categoryChart = categoryAppsMap[category.id];

                    if (!categoryChart) {
                        return log.error("No related category chart found for category id: " + category.id);
                    }

                    return {
                        id: category.extId.replace(/\-/g, ''),
                        name: category.name,
                        url: urlUtil.makeUrl(category.extId, category.name),
                        chart: categoryChart.apps
                    };
                });

                res.json(relatedCategories);
            });
        });
    });
};
