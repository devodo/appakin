"use strict";
var connection = require('../connection');

var getCategories = function(client, next) {
    var queryStr =
        "SELECT id, ext_id, name, url_name, description, date_created, date_modified, date_deleted " +
        "FROM category " +
        "ORDER BY name;";

    client.query(queryStr, [], function (err, result) {
        if (err) {
            return next(err);
        }

        var categories = result.rows.map(function(item) {
            return {
                id: item.id,
                externalId: item.ext_ud,
                name: item.name,
                urlName: item.url_name,
                description: item.description,
                dateCreated: item.date_created,
                dateModified: item.date_modified,
                dateDeleted: item.date_deleted
            };
        });

        next(null, categories);
    });
};

exports.getCategories = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategories(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};
