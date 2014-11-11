"use strict";
var connection = require('./connection');

var getTrainingSet = function(client, seedCategoryId, next) {
    var queryStr =
        "SELECT id, app_ext_id, include\n" +
        "FROM seed_training\n" +
        "WHERE seed_category_id = $1\n" +
        "ORDER BY id";

    var queryParams = [ seedCategoryId ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                appExtId: item.app_ext_id,
                include: item.include
            };
        });

        return next(null, items);
    });
};

exports.getTrainingSet = function(seedCategoryId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getTrainingSet(conn.client, seedCategoryId, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};
