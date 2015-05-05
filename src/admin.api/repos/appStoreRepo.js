"use strict";
var async = require('async');
var connection = require('./connection');

var getClusterIndexBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.genres," +
        "a.screenshot_urls, a.ipad_screenshot_urls, a.dev_id, " +
        "ap.popularity, aa.desc_is_english\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "LEFT JOIN app_popularity ap\n" +
        "ON a.app_id = ap.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "AND a.date_deleted is null\n" +
        "ORDER BY a.app_id\n" +
        "limit $2;";

    var queryParams = [
        lastId,
        limit
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.app_id,
                extId: item.ext_id,
                name: item.name,
                devId: item.dev_id,
                description: item.description,
                genres: item.genres,
                screenShotUrls: item.screenshot_urls,
                iPadScreenShotUrls: item.ipad_screenshot_urls,
                popularity: item.popularity,
                isEnglish: item.desc_is_english
            };
        });

        next(null, items);
    });
};

var getClusterIndexApp = function(client, appId, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.genres," +
        "a.screenshot_urls, a.ipad_screenshot_urls, a.dev_id, " +
        "ap.popularity, aa.desc_is_english\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "LEFT JOIN app_popularity ap\n" +
        "ON a.app_id = ap.app_id\n" +
        "WHERE a.app_id = $1\n" +
        "AND a.date_deleted is null;";

    client.query(queryStr, [appId], function (err, result) {
        if (err) { return next(err); }

        if (result.rows.length === 0) {
            return next(null, null);
        }

        var item = result.rows[0];
        var app = {
            id: item.app_id,
            extId: item.ext_id,
            name: item.name,
            devId: item.dev_id,
            description: item.description,
            genres: item.genres,
            screenShotUrls: item.screenshot_urls,
            iPadScreenShotUrls: item.ipad_screenshot_urls,
            popularity: item.popularity,
            isEnglish: item.desc_is_english
        };

        next(null, app);
    });
};

var getModifiedClusterIndexApps = function(client, modifiedSinceDate, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.genres," +
        "a.screenshot_urls, a.ipad_screenshot_urls, a.dev_id, " +
        "ap.popularity, aa.desc_is_english\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "LEFT JOIN app_popularity ap\n" +
        "ON a.app_id = ap.app_id\n" +
        "WHERE a.date_modified > $1\n" +
        "AND a.date_deleted is null\n" +
        "ORDER BY a.app_id;";

    client.query(queryStr, [modifiedSinceDate], function (err, result) {
        if (err) { return next(err); }

        var items = result.rows.map(function(item) {
            return {
                id: item.app_id,
                extId: item.ext_id,
                name: item.name,
                devId: item.dev_id,
                description: item.description,
                genres: item.genres,
                screenShotUrls: item.screenshot_urls,
                iPadScreenShotUrls: item.ipad_screenshot_urls,
                popularity: item.popularity,
                isEnglish: item.desc_is_english
            };
        });

        next(null, items);
    });
};

exports.getClusterIndexBatch = function(lastId, limit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getClusterIndexBatch(conn.client, lastId, limit, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.getClusterIndexApp = function(appId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getClusterIndexApp(conn.client, appId, function(err, app) {
            conn.close(err, function(err) {
                next(err, app);
            });
        });
    });
};


exports.getModifiedClusterIndexApps = function(modifiedSinceDate, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getModifiedClusterIndexApps(conn.client, modifiedSinceDate, function(err, apps) {
            conn.close(err, function(err) {
                next(err, apps);
            });
        });
    });
};
