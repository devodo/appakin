'use strict';
var log = require('../logger');
var urlUtil = require('../domain/urlUtil');
var appStoreRepo = require('../repos/appStoreRepo');

var MS_PER_DAY = 24*60*60*1000; // hours*minutes*seconds*milliseconds
var POPULARITY_WEIGTH = 0.7;
var RATING_COUNT_WEIGTH = 0.6;
var RATING_AMPLIFY = 1.05;
var CURRENT_COUNT_WEIGTH = 1.5;
var PAGE_SIZE = 10;

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

            appStoreRepo.getAppCategories(app.id, 0, PAGE_SIZE, function(err, cats) {
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

                if (app.ratingCount) {
                    var ageDays = Math.max(10, (new Date().getTime() - app.releaseDate.getTime()) / MS_PER_DAY);
                    app.popularity = Math.min(1.0, RATING_AMPLIFY * (1 - Math.exp(-POPULARITY_WEIGTH * Math.log(1 + (app.ratingCount/ageDays)))));
                } else {
                    app.popularity = 0;
                }

                var r1 = app.userRating ? parseFloat(app.userRating) : 0;
                var r2 = app.userRatingCurrent ? parseFloat(app.userRatingCurrent) : 0;

                if (r1 === r2 || r2 === 0) {
                    app.rating = r1;
                } else if (r1 === 0) {
                    app.rating = r2;
                }
                else {
                    var r2Count = app.ratingCountCurrent ? app.ratingCountCurrent : 0;
                    var r1Count = app.ratingCount && app.ratingCount > r2Count ? app.ratingCount - r2Count : 0;
                    var r1CountWeighted = r1Count ? Math.pow(r1Count, RATING_COUNT_WEIGTH) : 0;
                    var r2CountWeighted = r2Count ? Math.pow(r2Count, CURRENT_COUNT_WEIGTH) : 0;
                    var countSum = Math.max(1, r1CountWeighted + r2CountWeighted);
                    app.rating = ((r1 * r1CountWeighted) + (r2 * r2CountWeighted)) / countSum;
                }

                delete app.id;
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
