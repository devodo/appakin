'use strict';
var log = require('../logger');
var appStoreRepo = require('../repos/appStoreRepo');
var config = require('../config');
var auditRepo = require('../repos/auditRepo');
var uuidUtil = require('../domain/uuidUtil');
var urlUtil = require('../domain/urlUtil');
var redisCacheFactory = require("../domain/cache/redisCache");
var remoteCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.out);

var getAudit = function(req, appLink, campaignTracking, storeUrl) {
    //TODO: IP to country
    var countryCode = 'US';

    var audit = {
        appId: appLink.appId,
        catId: appLink.catId,
        catAppId: appLink.catAppId,
        ip: req.ip,
        refer: req.get('Referer'),
        userAgent: req.get('User-Agent'),
        countryCode: countryCode,
        campaignTracking: campaignTracking,
        storeUrl: storeUrl
    };

    return audit;
};

var trackingExpirySeconds = 60 * 60 * 48; // 48 hours
var getAffiliateTracking = function(catId, next) {
    var script =
        "local current\n" +
        "current = redis.call(\"incr\",KEYS[1])\n" +
        "if tonumber(current) == 1 then\n" +
        "  redis.call(\"expire\",KEYS[1], ARGV[1])\n" +
        "end\n" +
        "return current";

    var key = "tracking_counter";

    remoteCache.scriptEval(script, [key], [trackingExpirySeconds], function(err, res) {
        if (!res) {
            if (err) {
                log.err(err);
            }

            if (!catId) {
                return next();
            }

            return next(null, uuidUtil.stripDashes(catId));
        }

        return next(null, res);
    });

    if (!catId) {
        return null;
    }

    return uuidUtil.stripDashes(catId);
};

var getStoreUrl = function(appLink, campaignTracking) {
    var storeUrl = appLink.storeUrl + '&at=' + config.itunes.affiliateId;

    if (campaignTracking) {
        storeUrl = storeUrl + '&ct=' + campaignTracking;
    }

    return storeUrl;
};

exports.init = function init(app) {
    app.get('/ios/out/:appId', function (req, res) {
        res.contentType("text/html; charset=UTF-8");

        var appId = req.params.appId;
        var catId = req.query.cat_id;

        if (!appId || !uuidUtil.isValid(appId))
        {
            log.warn('Received bad IOS referral url: ' + req.originalUrl);
            return res.status(400).json({error: 'Bad app id'});
        }

        if (catId && !uuidUtil.isValid(catId)) {
            log.warn('Invalid category id in IOS referral url: ' + req.originalUrl);
            catId = null;
        }

        appStoreRepo.getAppStoreLink(appId, catId, function(err, appLink) {
            if (err) {
                log.error(err);
                return res.status(500).json({error: 'Error retrieving app data'});
            }

            if (!appLink) {
                log.warn('App not found for IOS referral url: ' + req.originalUrl);
                return res.status(404).json({error: 'App not found'});
            }

            getAffiliateTracking(catId, function(err, ct) {
                if (err) { log.error(err); }

                var storeUrl = getStoreUrl(appLink, ct);
                var audit = getAudit(req, appLink, ct, storeUrl);

                auditRepo.auditAppStoreReferral(audit, function(err) {
                    if (err) { log.error(err); }
                });

                return res.redirect(302, storeUrl);

            });
        });
    });
};

exports.init = function init(app) {
    app.get('/ios/app_out/:appEncodedId', function (req, res) {
        res.contentType("text/html; charset=UTF-8");

        var appEncodedId = req.params.appEncodedId;
        if (!appEncodedId)
        {
            return res.status(400).json({error: 'Bad query string'});
        }

        var appId = urlUtil.decodeId(appEncodedId);

        if (!appId || !uuidUtil.isValid(appId)) {
            log.warn('Received bad IOS referral url: ' + req.originalUrl);
            return res.status(400).json({error: 'Bad app id'});
        }

        var catId = null;
        var catEncodedId = req.query.ref;
        if (catEncodedId) {
            catId = urlUtil.decodeId(catEncodedId);
            if (!uuidUtil.isValid(catId)) {
                log.warn('Invalid category id in IOS referral url: ' + req.originalUrl);
                catId= null;
            }
        }

        appStoreRepo.getAppStoreLink(appId, catId, function(err, appLink) {
            if (err) {
                log.error(err);
                return res.status(500).json({error: 'Error retrieving app data'});
            }

            if (!appLink) {
                log.warn('App not found for IOS referral url: ' + req.originalUrl);
                return res.status(404).json({error: 'App not found'});
            }

            getAffiliateTracking(catId, function(err, ct) {
                if (err) { log.error(err); }

                var storeUrl = getStoreUrl(appLink, ct);
                var audit = getAudit(req, appLink, ct, storeUrl);

                auditRepo.auditAppStoreReferral(audit, function(err) {
                    if (err) { log.error(err); }
                });

                return res.redirect(302, storeUrl);

            });
        });
    });
};
