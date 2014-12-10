'use strict';
var log = require('../logger');
var urlUtil = require('../domain/urlUtil');
var appStoreRepo = require('../repos/appStoreRepo');
var featuredRepo = require('../repos/featuredRepo');

var PAGE_SIZE = 20;
var MAX_CAT_PAGES = 5;

exports.init = function init(app) {

    app.get('/ios/category/:encodedId/:slug', function (req, res, next) {
        var encodedId = req.params.encodedId;
        if (!encodedId)
        {
            return res.status(400).send('Bad query string');
        }

        var extId = urlUtil.decodeId(encodedId);

        if (!extId) {
            return res.status(400).send('Bad category id');
        }

        var pageNum = (req.query && req.query.p) ? parseInt(req.query.p, 10) : 1;

        if (isNaN(pageNum) || pageNum < 1 || pageNum > MAX_CAT_PAGES) {
            return res.status(400).send('Bad page number');
        }

        appStoreRepo.getCategoryByExtId(extId, function(err, category) {
            if (err) { return next(err); }

            if (!category) {
                return res.status(404).send('Category not found');
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
            appStoreRepo.getCategoryApps(category.id, skip, PAGE_SIZE, function(err, apps) {
                if (err) { return next(err); }

                var pIndex = skip + 1;
                apps.forEach(function(app) {
                    app.url = urlUtil.makeUrl(app.extId, app.name);
                    app.position = pIndex++;
                    delete app.extId;
                });

                category.url = categoryUrl;
                category.page = pageNum;
                category.apps = apps;

                featuredRepo.getFeaturedApps(category.id, 2, 5, function(err, fApps) {
                    if (err) { return next(err); }

                    var featuredApps = fApps.map(function(item) {
                        return {
                            id: item.extId,
                            name: item.name,
                            artworkUrl: item.artworkSmallUrl,
                            url: urlUtil.makeUrl(item.extId, item.name),
                            price: item.price
                        };
                    });

                    category.featured = featuredApps;

                    delete category.id;
                    res.json(category);
                });
            });
        });
    });

};
