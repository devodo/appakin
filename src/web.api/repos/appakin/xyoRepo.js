"use strict";
var connection = require('../connection');

var insertXyoCategory = function(client, category, next) {
    var queryStr =
        "INSERT INTO xyo_category(" +
        "name, link_text, description, url, date_created, date_modified) " +
        "VALUES ($1, $2, $3, $4, NOW(), NOW()) " +
        "RETURNING id;";

    var queryParams = [
        category.name,
        category.linkText,
        category.description,
        category.url
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var getXyoCategories = function(client, next) {
    var queryStr =
        "SELECT id, name, link_text, description, url, date_created, date_modified " +
        "FROM xyo_category " +
        "order by id;";

    client.query(queryStr, [], function (err, result) {
        if (err) {
            return next(err);
        }

        var categories = result.rows.map(function(item) {
            return {
                id: item.id,
                name: item.name,
                linkText: item.link_text,
                description: item.description,
                url: item.url,
                dateCreated: item.date_created,
                dateModified: item.date_modified
            };
        });

        next(null, categories);
    });
};

var insertXyoCategoryApp = function(client, xyoCategoryId, batchId, name, position, next) {
    var queryStr =
        "INSERT INTO xyo_category_app(" +
        "xyo_category_id, batch_id, name, position, date_created) " +
        "VALUES ($1, $2, $3, $4, NOW()) " +
        "RETURNING id;";

    var queryParams = [
        xyoCategoryId,
        batchId,
        name,
        position
    ];

    client.query(queryStr, queryParams, function (err, id) {
        if (err) {
            return next(err);
        }

        next(null, id);
    });
};

exports.insertXyoCategory = function(category, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertXyoCategory(conn.client, category, function(err, id) {
            conn.close(err, function(err) {
                if (connection.isUniqueViolation(err)) {
                    return next(null, -1);
                }

                next(err, id);
            });
        });
    });
};

exports.getXyoCategories = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getXyoCategories(conn.client, function(err, categories) {
            conn.close(function(closeErr) {
                next(closeErr, categories);
            });
        });
    });
};

exports.insertXyoCategoryApp = function(categoryId, batchId, name, position, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertXyoCategoryApp(conn.client, categoryId, batchId, name, position, function(err, id) {
            conn.close(function(closeErr) {
                next(closeErr, id);
            });
        });
    });
};
