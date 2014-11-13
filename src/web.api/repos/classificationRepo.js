"use strict";
var async = require('async');
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

var deleteClassificationApps = function(client, seedCategoryId, next) {
    var queryStr =
        "DELETE FROM seed_classification_app\n" +
        "WHERE seed_category_id = $1";

    client.query(queryStr, [seedCategoryId], function (err) {
        if (err) {
            return next(err);
        }

        return next(null);
    });
};

var insertClassificationApp = function(client, seedCategoryId, classificationResult, next) {
    var queryStr =
        "INSERT INTO seed_classification_app(seed_category_id, app_ext_id, include, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, NOW() at time zone 'utc', NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var queryParams = [
        seedCategoryId,
        classificationResult.id,
        classificationResult.result
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var setClassificationApps = function(conn, classificationResults, seedCategoryId, next) {
    var insertResult = function(classificationResult, callback) {
        insertClassificationApp(conn.client, seedCategoryId, classificationResult, function(err) {
            return callback(err);
        });
    };

    conn.beginTran(function(err) {
        if (err) {
            return next(err);
        }

        deleteClassificationApps(conn.client, seedCategoryId, function(err) {
            if (err) { return next(err); }

            async.eachSeries(classificationResults, insertResult, function(err) {
                if (err) { return next(err); }

                conn.commitTran(function(err) {
                    if (err) { return next(err); }

                    return next(null);
                });
            });
        });
    });
};

var getClassificationApps = function(client, seedCategoryId, isInclude, skip, take, next) {
    var queryStr =
        "SELECT a.ext_id, a.name, a.description, a.dev_name, a.store_url, a.release_date, a.genres,\n" +
        "a.user_rating_current, a.rating_count_current, a.user_rating,\n" +
        "a.rating_count, a.screenshot_urls, a.ipad_screenshot_urls, ap.popularity, sca.include\n" +
        "from appstore_app a\n" +
        "join seed_classification_app sca on a.ext_id = sca.app_ext_id\n" +
        "left join app_popularity ap on a.app_id = ap.app_id\n" +
        "where sca.seed_category_id = $1\n" +
        "and sca.include = $2\n" +
        "order by coalesce(ap.popularity,0) desc\n" +
        "offset $3 limit $4;";

    var queryParams = [
        seedCategoryId,
        isInclude,
        skip,
        take
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                extId: item.ext_id.replace(/\-/g, ''),
                name: item.name,
                description: item.description,
                devName: item.dev_name,
                storeUrl: item.store_url,
                releaseDate: item.release_date,
                genres: item.genres,
                userRatingCurrent: item.user_rating_current,
                ratingCountCurrent: item.rating_count_current,
                userRating: item.user_rating,
                ratingCount: item.rating_count,
                screenshotUrls: item.screenshot_urls,
                ipadScreenshotUrls: item.ipad_screenshot_urls,
                popularity: item.popularity,
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

exports.setClassificationApps = function(classificationResults, seedCategoryId, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        setClassificationApps(conn, classificationResults, seedCategoryId, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};

exports.getClassificationApps = function(seedCategoryId, isInclude, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getClassificationApps(conn.client, seedCategoryId, isInclude, skip, take, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};


