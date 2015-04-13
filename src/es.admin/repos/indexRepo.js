"use strict";
var connection = require('./connection');
var config = require('../config');

var openConnection = function(next) {
    var settings = config.db.index;

    connection.open(settings, function(err, conn) {
        if (err) { return next(err); }

        return next(null, conn);
    });
};

var executeQuery = function(queryFunc, next) {
    openConnection(function(err, conn) {
        if (err) { return next(err); }

        queryFunc(conn, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.getAppIndexBatch = function(lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, a.is_iphone, a.is_ipad, a.dev_name,\n" +
        "a.user_rating_current, a.rating_count_current, a.user_rating, a.rating_count,\n" +
        "ap.popularity\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "AND a.name is not null\n" +
        "AND a.date_deleted is null\n" +
        "ORDER BY a.app_id\n" +
        "limit $2;";

    var queryParams = [
        lastId,
        limit
    ];

    var queryFunc = function(conn, next) {
        conn.client.query(queryStr, queryParams, function (err, result) {
            if (err) { return next(err); }

            var items = result.rows.map(function(item) {
                return {
                    id: item.app_id,
                    extId: item.ext_id,
                    name: item.name,
                    description: item.description,
                    supportedDevices: item.supported_devices,
                    imageUrl: item.artwork_small_url,
                    price: item.price,
                    isIphone: item.is_iphone,
                    isIpad: item.is_ipad,
                    developerName: item.dev_name,
                    userRatingCurrent: item.user_rating_current,
                    ratingCountCurrent: item.rating_count_current,
                    userRating: item.user_rating,
                    ratingCount: item.rating_count,
                    popularity: item.popularity
                };
            });

            next(null, items);
        });
    };

    executeQuery(queryFunc, function(err, result) {
        next(err, result);
    });
};

exports.getCategoryApps = function(next) {
    var queryStr =
        "SELECT category_id, app_id, position\n" +
        "FROM category_app\n" +
        "order by app_id;";

    var queryFunc = function(conn, next) {
        conn.client.query(queryStr, function (err, result) {
            if (err) { return next(err); }

            var items = result.rows.map(function(item) {
                return {
                    categoryId: item.categoryId,
                    appId: item.appId,
                    position: item.position
                };
            });

            next(null, items);
        });
    };

    executeQuery(queryFunc, function(err, result) {
        next(err, result);
    });
};
