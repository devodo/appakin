"use strict";
var uuid = require('node-uuid');
var connection = require('./connection');

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

var getAppIndexBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT app_id, name, description, store_url, supported_devices, " +
        "artwork_small_url, price, currency " +
        "FROM appstore_app " +
        "WHERE app_id > $1 " +
        "ORDER BY app_id " +
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
                name: item.name,
                description: item.description,
                urlName: item.store_url,
                supportedDevices: item.supported_devices,
                imageUrl: item.artwork_small_url,
                price: item.price,
                currency: item.currency
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

var getCategoryAppDescriptions = function(client, categoryId, next) {
    var queryStr =
        "SELECT ca.position, a.app_id, a.description " +
        "FROM category_app ca " +
        "JOIN appstore_app a on ca.app_id = a.app_id " +
        "WHERE ca.category_id = $1 " +
        "ORDER BY ca.position;";

    client.query(queryStr, [categoryId], function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                position: item.position,
                appId: item.app_id,
                description: item.description
            };
        });

        next(null, items);
    });
};

var getCategoryPopularities = function(client, batchId, next) {
    var queryStr =
        "select c.id, sum(1.0/as_p.position) as popularity " +
        "from ( " +
            "select store_app_id, min(position) as position " +
            "from appstore_popular as_p " +
            "where batch = $1 " +
            "group by store_app_id " +
        ") as_p " +
        "join appstore_app as_a on as_p.store_app_id = as_a.store_app_id " +
        "join category_app c_a on as_a.app_id = c_a.app_id " +
        "join category c on c_a.category_id = c.id " +
        "group by c.id;";

    client.query(queryStr, [batchId], function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                popularity: item.popularity
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

exports.getAppIndexBatch = function(lastId, limit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppIndexBatch(conn.client, lastId, limit, function(err, results) {
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

exports.getCategoryAppDescriptions = function(categoryId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryAppDescriptions(conn.client, categoryId, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};
