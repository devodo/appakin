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
        "a.artwork_small_url, p.price, a.is_iphone, a.is_ipad, a.dev_name, a.release_date,\n" +
        "r.user_rating_current, r.rating_count_current, r.user_rating, r.rating_count,\n" +
        "ap.popularity\n" +
        "FROM appstore_app a\n" +
        "JOIN appstore_price p on a.app_id = p.app_id and p.country_code = 'USA'\n" +
        "LEFT JOIN appstore_rating r on a.app_id = r.app_id and r.country_code = 'USA'\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "LEFT JOIN app_analysis aa ON a.app_id = aa.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "AND a.name is not null\n" +
        "AND a.date_deleted is null\n" +
        "AND p.date_deleted is null\n" +
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
                    releaseDate: item.release_date,
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
        "SELECT ca.category_id, ca.app_id, ca.position\n" +
        "FROM category_app ca\n" +
        "JOIN appstore_app a on ca.app_id = a.app_id\n" +
        "JOIN appstore_price p on a.app_id = p.app_id and p.country_code = 'USA'\n" +
        "JOIN category c on ca.category_id = c.id\n" +
        "WHERE a.date_deleted is null\n" +
        "AND c.date_deleted is null\n" +
        "AND p.date_deleted is null\n" +
        "AND a.name is not null\n" +
        "order by a.app_id, ca.position;";

    var queryFunc = function(conn, next) {
        conn.client.query(queryStr, function (err, result) {
            if (err) { return next(err); }

            var items = result.rows.map(function(item) {
                return {
                    categoryId: item.category_id,
                    appId: item.app_id,
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

exports.getCategories = function(next) {
    var queryStr =
        "SELECT c.id, c.ext_id, c.name, cp.popularity\n" +
        "FROM category c\n" +
        "LEFT JOIN category_popularity cp on c.id = cp.category_id\n" +
        "WHERE c.date_deleted is null\n" +
        "order by c.id;";

    var queryFunc = function(conn, next) {
        conn.client.query(queryStr, function (err, result) {
            if (err) { return next(err); }

            var items = result.rows.map(function(item) {
                return {
                    id: item.id,
                    extId: item.ext_id,
                    name: item.name,
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
