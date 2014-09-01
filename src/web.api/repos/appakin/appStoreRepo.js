"use strict";
var uuid = require('node-uuid');
var connection = require('../connection');

var APP_STORE_ID = 1;

var insertApp = function(client, storeId, app, next) {
    var queryStr =
        "INSERT INTO app(ext_id, store_id, name, date_created, date_modified) " +
        "VALUES ($1, $2, $3, NOW(), NOW()) " +
        "RETURNING id;";

    var queryParams = [
        uuid.v4(),
        storeId,
        app.name
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var insertAppStoreAppInternal = function (client, appId, app, next) {
    var queryStr =
        "INSERT INTO appstore_app(" +
        "app_id, store_app_id, name, censored_name, description, store_url, " +
        "dev_id, dev_name, dev_url, features, supported_devices, " +
        "is_game_center_enabled, screenshot_urls, ipad_screenshot_urls, " +
        "artwork_small_url, artwork_medium_url, artwork_large_url, price, " +
        "currency, version, primary_genre, genres, release_date, bundle_id, " +
        "seller_name, release_notes, min_os_version, language_codes, file_size_bytes, " +
        "advisory_rating, content_rating, user_rating_current, rating_count_current, user_rating, " +
        "rating_count, date_created, date_modified) " +
        "VALUES ($1, $2, $3, $4, $5, $6, " +
        "$7, $8, $9, $10, $11, " +
        "$12, $13, $14, " +
        "$15, $16, $17, $18, " +
        "$19, $20, $21, $22, $23, $24, " +
        "$25, $26, $27, $28, $29, " +
        "$30, $31, $32, $33, $34, $35, " +
        "NOW(), NOW());";

    var queryParams = [
        appId,
        app.storeAppId,
        app.name,
        app.censoredName,
        app.description,
        app.appStoreUrl,
        app.devId,
        app.devName,
        app.devUrl,
        app.features,
        app.supportedDevices,
        app.isGameCenterEnabled,
        app.screenShotUrls,
        app.ipadScreenShotUrls,
        app.artworkSmallUrl,
        app.artworkMediumUrl,
        app.artworkLargeUrl,
        app.price,
        app.currency,
        app.version,
        app.primaryGenre,
        app.genres,
        app.releaseDate,
        app.bundleId,
        app.sellerName,
        app.releaseNotes,
        app.minOsVersion,
        app.languageCodes,
        app.fileSizeBytes,
        app.advisoryRating,
        app.contentRating,
        app.userRatingCurrent,
        app.ratingCountCurrent,
        app.userRating,
        app.ratingCount
    ];

    client.query(queryStr, queryParams, function (err) {
        if (err) {
            return next(err);
        }

        next();
    });
};

var insertAppStoreApp = function(conn, app, next) {
    conn.beginTran(function(err) {
        if (err) {
            return next(err);
        }

        insertApp(conn.client, APP_STORE_ID, app, function(err, appId) {
            if (err) {
                return next(err);
            }

            insertAppStoreAppInternal(conn.client, appId, app, function(err) {
                if (err) {
                    return next(err);
                }

                conn.commitTran(function(err) {
                    if (err) {
                        return next(err);
                    }

                    next(null, appId);
                });
            });
        });
    });
};

var insertAppStoreCategory = function(client, category, next) {
    var queryStr =
        "INSERT INTO appstore_category(" +
        "store_category_id, name, store_url, date_created, date_modified) " +
        "VALUES ($1, $2, $3, NOW(), NOW()) " +
        "RETURNING id;";

    var queryParams = [
        category.id,
        category.name,
        category.url
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var insertAppStoreAppSrc = function(client, app, categoryId, letter, pageNumber, next) {
    var queryStr =
        "INSERT INTO appstore_app_src(" +
        "appstore_category_id, store_app_id, name, letter, page_number, " +
        "date_created, date_modified) " +
        "VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) " +
        "RETURNING id;";

    var queryParams = [
        categoryId,
        app.storeAppId,
        app.name,
        letter,
        pageNumber
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var insertAppStorePopular = function(client, app, categoryId, position, batchId, next) {
    var queryStr =
        "INSERT INTO appstore_popular( " +
        "batch, appstore_category_id, store_app_id, name, position, " +
        "date_created) " +
        "VALUES ($1, $2, $3, $4, $5, NOW()) " +
        "RETURNING id;";

    var queryParams = [
        batchId,
        categoryId,
        app.storeAppId,
        app.name,
        position
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var getAppStoreCategories = function(client, next) {
    var queryStr =
        "SELECT id, store_category_id, name, store_url, parent_id, date_created, date_modified " +
        "FROM appstore_category " +
        "order by id";

    client.query(queryStr, [], function (err, result) {
        if (err) {
            return next(err);
        }

        var categories = result.rows.map(function(item) {
            return {
                id: item.id,
                storeAppId: item.store_category_id,
                name: item.name,
                storeUrl: item.store_url,
                parentId: item.parent_id,
                dateCreated: item.date_created,
                dateModified: item.date_modified
            };
        });

        next(null, categories);
    });
};

var getAppStoreSourceItemBatch = function(client, startId, batchSize, next) {
    var queryStr =
        "SELECT id, appstore_category_id, store_app_id, name, letter, page_number, " +
        "date_created, date_modified " +
        "FROM appstore_app_src " +
        "where id > $1 " +
        "order by id " +
        "limit $2;";

    var queryParams = [
        startId,
        batchSize
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                appStoreCategoryId: item.appstore_category_id,
                storeAppId: item.store_app_id,
                name: item.name,
                letter: item.letter,
                pageNumber: item.page_number,
                dateCreated: item.date_created,
                dateModified: item.date_modified
            };
        });

        next(null, items);
    });
};

var getMissingAppStorePopularApps = function(client, next) {
    var queryStr =
        "SELECT ap.id, ap.batch, ap.appstore_category_id, ap.store_app_id, ap.name, ap.position, ap.date_created " +
        "FROM appstore_popular ap " +
        "LEFT JOIN appstore_app aa on ap.store_app_id = aa.store_app_id " +
        "WHERE aa.app_id is null " +
        "ORDER BY ap.id;";

    client.query(queryStr, [], function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                batchId: item.batch,
                appStoreCategoryId: item.appstore_category_id,
                storeAppId: item.store_app_id,
                name: item.name,
                position: item.position,
                dateCreated: item.date_created
            };
        });

        next(null, items);
    });
};

var getMissingAppStoreSourceApps = function(client, next) {
    var queryStr =
        "SELECT asa.id, asa.appstore_category_id, asa.store_app_id, asa.name, asa.letter, asa.page_number, " +
        "asa.date_created, asa.date_modified " +
        "FROM appstore_app_src asa " +
        "LEFT JOIN appstore_app aa on asa.store_app_id = aa.store_app_id " +
        "WHERE aa.app_id is null " +
        "ORDER BY asa.id;";

    client.query(queryStr, [], function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                appStoreCategoryId: item.appstore_category_id,
                storeAppId: item.store_app_id,
                name: item.name,
                letter: item.letter,
                pageNumber: item.page_number,
                dateCreated: item.date_created,
                dateModified: item.date_modified
            };
        });

        next(null, items);
    });
};

exports.insertAppStoreApp = function(app, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertAppStoreApp(conn, app, function(err, appId) {
            conn.close(err, function(err) {
                next(err, appId);
            });
        });
    });
};

exports.insertAppStoreCategory = function(category, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertAppStoreCategory(conn.client, category, function(err, appId) {
            conn.close(err, function(err) {
                next(err, appId);
            });
        });
    });
};

exports.insertAppStoreAppSrc = function(app, categoryId, letter, pageNumber, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertAppStoreAppSrc(conn.client, app, categoryId, letter, pageNumber, function(err, id) {
            conn.close(err, function(err) {
                if (connection.isUniqueViolation(err)) {
                    return next(null, -1);
                }

                next(err, id);
            });
        });
    });
};

exports.getAppStoreCategories = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreCategories(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.getAppStoreSourceItemBatch = function(startId, batchSize, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreSourceItemBatch(conn.client, startId, batchSize, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.insertAppStorePopular = function(app, categoryId, position, batchId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertAppStorePopular(conn.client, app, categoryId, position, batchId, function(err, id) {
            conn.close(err, function(closeErr) {
                next(err, id);
            });
        });
    });
};

exports.getMissingAppStorePopularApps = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getMissingAppStorePopularApps(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.getMissingAppStoreSourceApps = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getMissingAppStoreSourceApps(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};
