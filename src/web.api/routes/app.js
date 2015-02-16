'use strict';
var log = require('../logger');
var urlUtil = require('../domain/urlUtil');
var appStoreRepo = require('../repos/appStoreRepo');
var appRank = require('../domain/analysis/appRank');

var MAX_CATEGORIES = 10;

exports.init = function init(app) {

    app.get('/ios/app/:encodedId/:slug', function (req, res) {
        var encodedId = req.params.encodedId;
        if (!encodedId)
        {
            return res.status(400).json({error: 'Bad query string'});
        }

        var extId = urlUtil.decodeId(encodedId);

        if (!extId) {
            return res.status(400).json({error: 'Bad app id'});
        }

        appStoreRepo.getAppByExtId(extId, function(err, app) {
            if (err) {
                log.error(err);
                return res.status(500).json({error: 'Error retrieving app data'});
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

                app.popularity = appRank.getPopularity(app);
                app.rating = appRank.getRating(app);

                app.id = app.extId.replace(/\-/g, '');
                delete app.extId;
                delete app.storeAppId;
                delete app.censoredName;
                delete app.storeUrl;
                delete app.devId;
                delete app.devUrl;
                delete app.dateCreated;
                delete app.primaryGenre;
                delete app.genres;
                delete app.bundleId;
                delete app.sellerName;
                delete app.supportedDevices;
                delete app.releaseNotes;
                delete app.languageCodes;
                delete app.features;
                delete app.isGameCenterEnabled;
                res.json(app);
            });
        });
    });

    app.get('/ios/app/:extId', function (req, res, next) {
        var extId = req.params.extId;
        if (!extId)
        {
            return res.status(400).json({error: 'Bad query string'});
        }

        appStoreRepo.getAppByExtId(extId, function(err, app) {
            if (err) { return next(err); }

            if (!app) {
                return res.status(404).json({error: 'App not found'});
            }

            app.url = urlUtil.makeUrl(app.extId, app.name);
            res.json(app);
        });
    });

};
