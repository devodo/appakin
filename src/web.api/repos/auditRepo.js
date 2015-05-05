"use strict";
var connection = require('./connection');

var APP_STORE_ID = 1;

var auditAppStoreReferral = function(client, audit, next) {
    var queryStr =
        "INSERT INTO referral_audit(store_id, app_id, category_id, category_app_id, ip, user_id,\n" +
        "store_url, country_code, user_agent, refer, campaign_tracking, date_created)\n" +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var queryParams = [
        APP_STORE_ID,
        audit.appId,
        audit.catId,
        audit.catAppId,
        audit.ip,
        audit.userId,
        audit.storeUrl,
        audit.countryCode,
        audit.userAgent,
        audit.refer,
        audit.campaignTracking
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

exports.auditAppStoreReferral = function(audit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        auditAppStoreReferral(conn.client, audit, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};
