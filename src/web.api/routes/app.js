'use strict';
var log = require('../logger');
var urlUtil = require('../domain/urlUtil');
var appStoreRepo = require('../repos/appStoreRepo');
var appRank = require('../domain/appRank');

var MAX_CATEGORIES = 10;

exports.init = function init(app) {

    app.get('/ios/app/:encodedId/:slug', function (req, res, next) {
        var extId = decodeExtId(req, res);
        if (extId === null) {
            return;
        }

        var expirySeconds = 600;
        res.setHeader("Cache-Control", "public, max-age=" + expirySeconds);

        getAppByExtId(extId, req, res, next);
    });

    app.get('/ios/app-dev/:encodedId/:slug', function (req, res, next) {
        var extId = decodeExtId(req, res);
        if (extId === null) {
            return;
        }

        getAppByExtId(extId, req, res, next);
    });

    app.get('/ios/app/:extId', function (req, res, next) {
        var extId = req.params.extId;
        if (!extId) {
            return res.status(400).json({error: 'Bad query string'});
        }

        getAppByExtId(extId, req, res, next);
    });

};

function getAppByExtId(extId, req, res, next) {
    appStoreRepo.getAppByExtId(extId, function(err, app) {
        if (err) {
            return next(err);
        }

        if (!app) {
            return res.status(404).json({error: 'App not found'});
        }

        var urlName = urlUtil.slugifyName(app.name);
        var appUrl = urlUtil.makeUrl(app.extId, app.name);
        if (req.params.slug !== urlName) {
            return res.redirect(301, '/ios/app/' + appUrl);
        }

        appStoreRepo.getAppCategories(app.id, 0, MAX_CATEGORIES, function(err, cats) {
            if (err) {
                log.error(err);
                return res.status(500).json({error: 'Error retrieving app category data'});
            }

            cats.forEach(function(cat) {
                cat.url = urlUtil.makeUrl(cat.extId, cat.name);
                delete cat.extId;
            });

            app.url = appUrl;
            app.categories = cats;

            app.popularity = appRank.normalisePopularity(app.popularity);
            app.rating = appRank.getRating(app);

            app.id = app.extId.replace(/\-/g, '');
            app.artworkMediumUrl = app.artworkLargeUrl.replace(/\.[0-1]+x[0-1]+-75/g, '');

            delete app.extId;
            delete app.userRatingCurrent;
            delete app.ratingCountCurrent;
            delete app.userRating;
            delete app.ratingCount;

            res.json(app);
        });
    });
}

function decodeExtId(req, res) {
    var encodedId = req.params.encodedId;
    if (!encodedId)
    {
        res.status(400).json({error: 'Bad query string'});
        return null;
    }

    var extId = urlUtil.decodeId(encodedId);

    if (!extId) {
        res.status(400).json({error: 'Bad app id'});
        return null;
    }

    return extId;
}
