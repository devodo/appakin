"use strict";
var connection = require('./connection');

var getFeaturedCategories = function(client, bias, take, next) {
    var queryStr =
        "SELECT c.id, c.ext_id, c.name, c.description\n" +
        "from featured_category fc\n" +
        "join category c on fc.category_id = c.id\n" +
        "where c.date_deleted is null\n" +
        "order by (random() * power(fc.weight, $1)) desc\n" +
        "limit $2";

    var queryParams = [ bias, take ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                extId: item.ext_id,
                name: item.name,
                description: item.description
            };
        });

        return next(null, items);
    });
};

var getFeaturedCategoriesAndApps = function(client, cat_bias, cat_take, app_bias, app_take, next) {
    var queryStr =
        "SELECT a.ext_id, a.name, a.artwork_small_url, t.cat_ext_id, t.cat_name\n" +
        "FROM appstore_app a\n" +
        "JOIN(\n" +
        "SELECT category_id, app_id, cat_ext_id, cat_name, num\n" +
        "from (\n" +
        "SELECT fa.category_id, fa.app_id, c.ext_id as cat_ext_id, c.name as cat_name,\n" +
        "row_number() over(partition by c.id order by random() * power(fa.weight, $3)) as num\n" +
        "FROM featured_app fa\n" +
        "JOIN (\n" +
        "SELECT c.id, c.ext_id, c.name\n" +
        "from featured_category fc\n" +
        "join category c on fc.category_id = c.id\n" +
        "order by random() * power(fc.weight, $1) desc\n" +
        "limit $2\n" +
        ") c\n" +
        "on fa.category_id = c.id\n" +
        ") t\n" +
        "where num <= $4\n" +
        ") t on a.app_id = t.app_id\n" +
        "order by t.category_id, t.num";

    var queryParams = [ cat_bias, cat_take, app_bias, app_take ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                appExtId: item.ext_id,
                appName: item.name,
                appArtworkSmallUrl: item.artwork_small_url,
                catExtId: item.cat_ext_id,
                catName: item.cat_name
            };
        });

        return next(null, items);
    });
};

exports.getFeaturedCategories = function(bias, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getFeaturedCategories(conn.client, bias, take, function(err, categories) {
            conn.close(err, function(err) {
                next(err, categories);
            });
        });
    });
};

exports.getFeaturedCategoriesAndApps = function(cat_bias, cat_take, app_bias, app_take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getFeaturedCategoriesAndApps(conn.client, cat_bias, cat_take, app_bias, app_take, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};
