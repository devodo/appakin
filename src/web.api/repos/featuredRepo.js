"use strict";
var connection = require('./connection');

var getFeaturedCategories = function(client, bias, take, next) {
    var queryStr =
        "SELECT c.id, c.ext_id, c.name, c.description\n" +
        "from featured_category fc\n" +
        "join category c on fc.category_id = c.id\n" +
        "where c.date_deleted is null\n" +
        "and fc.date_deleted is null\n" +
        "and (fc.start_date is null or fc.start_date <= NOW() at time zone 'utc')\n" +
        "and (fc.end_date is null or fc.end_date >= NOW() at time zone 'utc')\n" +
        "order by fc.fixed_order is null, fc.fixed_order, (random() * power(fc.weight, $1)) desc\n" +
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
        "SELECT t.ext_id, t.name, t.artwork_small_url, t.price, t.cat_ext_id, t.cat_name\n" +
        "FROM (\n" +
        "	SELECT a.ext_id, a.name, a.artwork_small_url, a.price,\n" +
        "	fa.category_id, fa.app_id, c.ext_id as cat_ext_id, c.name as cat_name, c.cat_num,\n" +
        "	row_number() over(partition by c.id order by fa.fixed_order is null, fa.fixed_order, random() * power(fa.weight, $3)) as num\n" +
        "	FROM featured_homepage_app fa\n" +
        "	JOIN (\n" +
        "		select id, ext_id, name, cat_num\n" +
        "		from (\n" +
        "			SELECT c.id, c.ext_id, c.name,\n" +
        "			row_number() over(order by fc.fixed_order is null, fc.fixed_order, random() * power(fc.weight, $1)) as cat_num\n" +
        "			from featured_homepage_category fc\n" +
        "			join category c on fc.category_id = c.id\n" +
        "			where c.date_deleted is null\n" +
        "			and fc.date_deleted is null\n" +
        "			and (fc.start_date is null or fc.start_date <= NOW() at time zone 'utc')\n" +
        "			and (fc.end_date is null or fc.end_date >= NOW() at time zone 'utc')\n" +
        "		) c\n" +
        "		where c.cat_num <= $2\n" +
        "	) c\n" +
        "	on fa.category_id = c.id\n" +
        "	JOIN appstore_app a on fa.app_id = a.app_id\n" +
        "	where a.date_deleted is null\n" +
        "	and fa.date_deleted is null\n" +
        "	and (fa.start_date is null or fa.start_date <= NOW() at time zone 'utc')\n" +
        "	and (fa.end_date is null or fa.end_date >= NOW() at time zone 'utc')\n" +
        ") t\n" +
        "where t.num <= $4\n" +
        "order by t.cat_num, t.num;";

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
                appPrice: item.price,
                catExtId: item.cat_ext_id,
                catName: item.cat_name
            };
        });

        return next(null, items);
    });
};

var getFeaturedApps = function(client, category_id, app_bias, app_take, filters, next) {
    var queryStr =
        "SELECT a.ext_id, a.name, a.artwork_small_url, a.price\n" +
        "FROM appstore_app a\n" +
        "JOIN featured_category_app fa on a.app_id = fa.app_id\n" +
        "where fa.category_id = $1\n" +
        "and fa.date_deleted is null\n" +
        "and (fa.start_date is null or fa.start_date <= NOW() at time zone 'utc')\n" +
        "and (fa.end_date is null or fa.end_date >= NOW() at time zone 'utc')\n" +
        "and a.date_deleted is null\n" +
        (filters.isFree === true ? "AND a.is_free\n" : "") +
        (filters.isIphone === true ? "AND a.is_iphone\n": "") +
        (filters.isIpad === true ? "AND a.is_ipad\n": "") +
        "order by fa.fixed_order is null, fa.fixed_order, (random() * power(fa.weight, $2)) desc\n" +
        "limit $3";

    var queryParams = [ category_id, app_bias, app_take ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                extId: item.ext_id,
                name: item.name,
                artworkSmallUrl: item.artwork_small_url,
                price: item.price
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

exports.getFeaturedApps = function(category_id, app_bias, app_take, filters, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getFeaturedApps(conn.client, category_id, app_bias, app_take, filters, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};
