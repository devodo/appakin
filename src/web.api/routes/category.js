'use strict';
var log = require('../logger');
var urlUtil = require('../domain/urlUtil');
var appStoreRepo = require('../repos/appStoreRepo');
var featuredRepo = require('../repos/featuredRepo');
var catViewProvider = require('../domain/viewProvider/categoryViewProvider');
var redisCacheFactory = require("../domain/cache/redisCache");
var appRank = require('../domain/appRank');
var appStoreCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.appstore);

var PAGE_SIZE = 20;
var MAX_CAT_PAGES = 10;
var RELATED_PAGE_SIZE = 5;
var OLD_MAX_RELATED = 5;
var MAX_RELATED_PAGES = 5;
var POPULAR_PAGE_SIZE = 10;
var POPULAR_MAX_PAGES = 10;
var MAX_CAT_APPS = PAGE_SIZE * MAX_CAT_PAGES;

exports.init = function init(app) {
    app.get('/ios/category/2.0/:encodedId/:slug', function (req, res, next) {
        var encodedId = req.params.encodedId;
        if (!encodedId)
        {
            return res.status(400).json({error: 'Bad query string'});
        }

        var extId = urlUtil.decodeId(encodedId);

        if (!extId) {
            return res.status(400).json({error: 'Bad category id'});
        }

        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        appStoreRepo.getCategoryByExtId(extId, function (err, category) {
            if (err) { return next(err); }

            if (!category) {
                return res.status(404).json({error: 'Category not found'});
            }

            var urlName = urlUtil.slugifyName(category.name);
            var categoryUrl = urlUtil.makeUrl(category.extId, category.name);
            if (req.params.slug !== urlName) {
                var absUrl = '/ios/category/' + categoryUrl;
                return res.redirect(301, absUrl);
            }

            category.url = categoryUrl;

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

    app.get('/ios/category/chart/:extId', function (req, res, next) {
        var categoryExtId = req.params.extId;

        var pageNum = (req.query && req.query.p) ? parseInt(req.query.p, 10) : 1;

        if (isNaN(pageNum) || pageNum < 1 || pageNum > MAX_CAT_PAGES) {
            return res.status(400).json({error: 'Bad page number'});
        }

        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        var skip = (pageNum - 1) * PAGE_SIZE;
        appStoreRepo.getCategoryAppsByExtId(categoryExtId, filters, skip, PAGE_SIZE, function (err, result) {
            if (err) { return next(err); }

            result.apps.forEach(function (app) {
                app.id = app.extId.replace(/\-/g, '');
                app.url = urlUtil.makeUrl(app.extId, app.name);
                delete app.extId;
            });

            res.json({
                page: pageNum,
                totalPages: Math.min(MAX_CAT_PAGES, Math.ceil(result.total / PAGE_SIZE)),
                apps: result.apps
            });
        });
    });

    app.get('/ios/category/price_drop/:extId', function (req, res, next) {
        var categoryExtId = req.params.extId;
        var pageNum = (req.query && req.query.p) ? parseInt(req.query.p, 10) : 1;

        if (isNaN(pageNum) || pageNum < 1 || pageNum > MAX_CAT_PAGES) {
            return res.status(400).json({error: 'Bad page number'});
        }

        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        var minPopularity = 0;
        if (req.query.popular === 'true') {
            minPopularity = 0.1;
        }

        var skip = (pageNum - 1) * PAGE_SIZE;

        appStoreRepo.getCategoryPriceDropAppsByExtId(categoryExtId, minPopularity, filters, skip, PAGE_SIZE, function (err, result) {
            if (err) { return next(err); }

            var dateNow = new Date();

            result.apps.forEach(function (app) {
                app.id = app.extId.replace(/\-/g, '');
                app.url = urlUtil.makeUrl(app.extId, app.name);

                app.popularity = appRank.getPopularity(app);
                app.rating = appRank.getRating(app);

                var daysDiff = Math.floor((dateNow - app.priceChangeDate) / 86400000);
                app.changeAgeDays = Math.max(daysDiff, 0);

                delete app.extId;
                delete app.userRatingCurrent;
                delete app.ratingCountCurrent;
                delete app.userRating;
                delete app.ratingCount;
                delete app.releaseDate;
                delete app.priceChangeDate;
            });

            res.json({
                page: pageNum,
                totalPages: Math.min(MAX_CAT_PAGES, Math.ceil(result.total / PAGE_SIZE)),
                apps: result.apps
            });
        });
    });

    app.get('/ios/category/related/:extId', function (req, res, next) {
        var categoryExtId = req.params.extId;
        var pageNum = (req.query && req.query.p) ? parseInt(req.query.p, 10) : 1;

        if (isNaN(pageNum) || pageNum < 1 || pageNum > MAX_RELATED_PAGES) {
            return res.status(400).json({error: 'Bad page number'});
        }

        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        var skip = (pageNum - 1) * RELATED_PAGE_SIZE;

        appStoreRepo.getRelatedCategoriesByExtId(categoryExtId, skip, RELATED_PAGE_SIZE, function (err, result) {
            if (err) { return next(err); }

            if (result.total === 0) {
                return {
                    page: pageNum,
                    total: 0,
                    relatedCategories: []
                };
            }

            var categoryIds = result.categories.map(function(category) {
                return category.id;
            });

            catViewProvider.getCategoriesCharts(categoryIds, filters, function(err, categoriesCharts) {
                if (err) { return next(err); }

                var relatedCategories = result.categories.map(function(category, i) {
                    var categoryChart = categoriesCharts[i];

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

                res.json({
                    page: pageNum,
                    totalPages: Math.min(MAX_RELATED_PAGES, Math.ceil(result.total / RELATED_PAGE_SIZE)),
                    categories: relatedCategories
                });
            });
        });
    });

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

        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);

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
                category.totalItems = Math.min(result.total, MAX_CAT_APPS);
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

    app.get('/ios/related_categories/:encodedId/:slug', function (req, res, next) {
        var encodedId = req.params.encodedId;
        if (!encodedId)
        {
            return res.status(400).json({error: 'Bad query string'});
        }

        var extId = urlUtil.decodeId(encodedId);

        if (!extId) {
            return res.status(400).json({error: 'Bad category id'});
        }

        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);

        var filters = {
            isIphone: req.query.is_iphone === 'true',
            isIpad: req.query.is_ipad === 'true',
            isFree: req.query.is_free === 'true'
        };

        appStoreRepo.getRelatedCategoriesByExtId(extId, 0, OLD_MAX_RELATED, function (err, result) {
            if (err) { return next(err); }

            var categoryIds = result.categories.map(function(category) {
                return category.id;
            });

            catViewProvider.getCategoriesCharts(categoryIds, filters, function(err, categoriesCharts) {
                if (err) { return next(err); }

                var relatedCategories = result.categories.map(function(category, i) {
                    var categoryChart = categoriesCharts[i];

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

        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);

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
        } else if (genre === 'apps') {
            getCategoriesFunc = function(next) {
                appStoreRepo.getAppsCategories(skip, POPULAR_PAGE_SIZE, function(err, categories) {
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

            catViewProvider.getCategoriesCharts(categoryIds, filters, function(err, categoriesCharts) {
                if (err) { return next(err); }

                var categories = pageResult.categories.map(function(category, i) {
                    var categoryChart = categoriesCharts[i];

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
