'use strict';
var log = require('../logger');
var urlUtil = require('../domain/urlUtil');
var appStoreRepo = require('../repos/appStoreRepo');
var featuredRepo = require('../repos/featuredRepo');
var catViewProvider = require('../domain/viewProvider/categoryViewProvider');
var redisCacheFactory = require("../domain/cache/redisCache");
var appStoreCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.appstore);

var PAGE_SIZE = 20;
var MAX_CAT_PAGES = 10;
var MAX_RELATED = 5;
var POPULAR_PAGE_SIZE = 10;
var POPULAR_MAX_PAGES = 10;

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
                category.totalItems = result.total;
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

    app.get('/ios/popular_categories/:genre', function (req, res, next) {
        var genre = req.params.genre;
        if (!genre || genre.trim() === '')
        {
            return res.status(400).json({error: 'Genre parameter is required'});
        }

        var pageNum = req.query.p ? parseInt(req.query.p, 10) : 1;
        if (isNaN(pageNum) || pageNum < 1) {
            return res.status(400).json({error: 'Bad page number'});
        }

        if (pageNum > POPULAR_MAX_PAGES) {
            return res.status(404).json({error: 'Not found'});
        }

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        var skip = (pageNum - 1) * POPULAR_PAGE_SIZE;

        var getCategoriesFunc;

        if (genre === 'all') {
            getCategoriesFunc = function(next) {
                appStoreRepo.getPopularCategories(skip, POPULAR_PAGE_SIZE, function(err, categories) {
                    if (err) { return next(err); }

                    next(null, {
                        total: POPULAR_PAGE_SIZE * POPULAR_MAX_PAGES,
                        categories: categories
                    });
                });
            };
        } else {
            getCategoriesFunc = function(next) {
                appStoreRepo.getPopularCategoriesByGenre(genre, skip, POPULAR_PAGE_SIZE, next);
            };
        }

        getCategoriesFunc(function (err, pageResult) {
            if (err) { return next(err); }

            if (pageResult.categories.length === 0) {
                return res.status(404).json({error: 'Not found'});
            }

            var categoryIds = pageResult.categories.map(function(category) {
                return category.id;
            });

            catViewProvider.getCategoryChartAppsMap(categoryIds, filters, function(err, categoryAppsMap) {
                if (err) { return next(err); }

                var categories = pageResult.categories.map(function(category) {
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

                var result = {
                    pageNum: pageNum,
                    totalPages: Math.min(POPULAR_MAX_PAGES, Math.ceil(pageResult.total / POPULAR_PAGE_SIZE)),
                    categories: categories
                };

                res.json(result);
            });
        });
    });

    var genresCacheKey = 'appstore_active_genres';
    var genresCacheExpirySeconds = 60 * 60 * 24;
    var getAppStoreGenres = function(next) {
        appStoreCache.getObject(genresCacheKey, function(err, cacheResult) {
            if (err) {
                log.error(err, "Error getting active app store genres from redis cache");
            }

            if (cacheResult) {
                next(null, cacheResult);
            } else {
                appStoreRepo.getActiveAppStoreGenres(function(err, genres) {
                    if (err) { return next(err); }

                    appStoreCache.setEx(genresCacheKey, genres, genresCacheExpirySeconds, function (err) {
                        if (err) {
                            log.error(err);
                        }
                    });

                    return next(null, genres);
                });
            }
        });
    };

    app.get('/ios/appstore_genres', function (req, res, next) {
        getAppStoreGenres(function(err, genres) {
            if (err) { return next(err); }

            res.json(genres);
        });
    });
};
