"use strict";
var uuid = require('node-uuid');
var async = require('async');
var connection = require('./connection');

var APP_STORE_ID = 1;

var insertApp = function(client, storeId, app, next) {
    var queryStr =
        "INSERT INTO app(ext_id, store_id, name, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, NOW(), NOW())\n" +
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
        "app_id, store_app_id, name, censored_name, description, store_url,\n" +
        "dev_id, dev_name, dev_url, features, supported_devices,\n" +
        "is_game_center_enabled, screenshot_urls, ipad_screenshot_urls,\n" +
        "artwork_small_url, artwork_medium_url, artwork_large_url, price,\n" +
        "currency, version, primary_genre, genres, release_date, bundle_id,\n" +
        "seller_name, release_notes, min_os_version, language_codes, file_size_bytes,\n" +
        "advisory_rating, content_rating, user_rating_current, rating_count_current, user_rating,\n" +
        "rating_count, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, $4, $5, $6,\n" +
        "$7, $8, $9, $10, $11,\n" +
        "$12, $13, $14,\n" +
        "$15, $16, $17, $18,\n" +
        "$19, $20, $21, $22, $23, $24,\n" +
        "$25, $26, $27, $28, $29,\n" +
        "$30, $31, $32, $33, $34, $35,\n" +
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
        "store_category_id, name, store_url, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, NOW(), NOW())\n" +
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
        "appstore_category_id, store_app_id, name, letter, page_number,\n" +
        "date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, $4, $5, NOW(), NOW())\n" +
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

var insertAppChartEntry = function(client, app, categoryId, position, batchId, next) {
    var queryStr =
        "INSERT INTO appstore_chart(\n" +
        "batch_id, appstore_category_id, store_app_id, name, position,\n" +
        "date_created)\n" +
        "VALUES ($1, $2, $3, $4, $5, NOW())\n" +
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
        "SELECT id, store_category_id, name, store_url, parent_id, date_created, date_modified\n" +
        "FROM appstore_category\n" +
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
        "SELECT c.id, c.ext_id, c.name, c.url_name, c.description,\n" +
        "c.date_created, c.date_modified, c.date_deleted, cp.popularity\n" +
        "FROM category c\n" +
        "LEFT JOIN category_popularity cp\n" +
        "ON c.id = cp.category_id\n" +
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
                dateDeleted: item.date_deleted,
                popularity: item.popularity
            };
        });

        next(null, categories);
    });
};

var getAppStoreSourceItemBatch = function(client, startId, batchSize, next) {
    var queryStr =
        "SELECT id, appstore_category_id, store_app_id, name, letter, page_number,\n" +
        "date_created, date_modified\n" +
        "FROM appstore_app_src\n" +
        "where id > $1\n" +
        "order by id\n" +
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
        "SELECT a.app_id, a.name, a.description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, ap.popularity\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "ORDER BY a.app_id\n" +
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
                popularity: item.popularity
            };
        });

        next(null, items);
    });
};

var getChartAppIndex = function(client, next) {
    var queryStr =
        "SELECT a.app_id, a.name, a.description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, ap.popularity\n" +
        "FROM appstore_app a\n" +
        "JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "ORDER BY a.app_id;";

    client.query(queryStr, function (err, result) {
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
                popularity: item.popularity
            };
        });

        next(null, items);
    });
};

var getMissingAppChartApps = function(client, next) {
    var queryStr =
        "SELECT ap.id, ap.batch_id, ap.appstore_category_id, ap.store_app_id, ap.name, ap.position, ap.date_created\n" +
        "FROM appstore_chart ap\n" +
        "LEFT JOIN appstore_app aa on ap.store_app_id = aa.store_app_id\n" +
        "WHERE aa.app_id is null\n" +
        "ORDER BY ap.id;";

    client.query(queryStr, [], function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                batchId: item.batch_id,
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
        "SELECT asa.id, asa.appstore_category_id, asa.store_app_id, asa.name, asa.letter, asa.page_number,\n" +
        "asa.date_created, asa.date_modified\n" +
        "FROM appstore_app_src asa\n" +
        "LEFT JOIN appstore_app aa on asa.store_app_id = aa.store_app_id\n" +
        "WHERE aa.app_id is null\n" +
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

var getCategoryAppDescriptions = function(client, categoryId, limit, next) {
    var queryStr =
        "SELECT ca.position, a.app_id, a.description\n" +
        "FROM category_app ca\n" +
        "JOIN appstore_app a on ca.app_id = a.app_id\n" +
        "WHERE ca.category_id = $1\n" +
        "ORDER BY ca.position\n" +
        "LIMIT $2;";

    var queryParams = [categoryId, limit];

    client.query(queryStr, queryParams, function (err, result) {
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

var getCalculatedCategoryPopularities = function(client, appStoreBatchId, next) {
    var queryStr =
        "select c.id, log(1 + sum(1.0/as_p.position)) as popularity\n" +
        "from (\n" +
            "select store_app_id, min(position) as position\n" +
            "from appstore_chart\n" +
            "where batch_id = $1\n" +
            "group by store_app_id\n" +
        ") as_p\n" +
        "join appstore_app as_a on as_p.store_app_id = as_a.store_app_id\n" +
        "join category_app c_a on as_a.app_id = c_a.app_id\n" +
        "join category c on c_a.category_id = c.id\n" +
        "group by c.id";

    client.query(queryStr, [appStoreBatchId], function (err, result) {
        if (err) { return next(err); }

        var maxPopularity = 0.0;
        var items = result.rows.map(function(item) {
            var popularity = parseFloat(item.popularity);
            if (Number.isNaN(popularity) || !Number.isFinite(popularity)) {
                return next("Error parsing float: " + item.popularity);
            }

            if (popularity > maxPopularity) {
                maxPopularity = popularity;
            }

            return {
                id: item.id,
                popularity: item.popularity
            };
        });

        items.forEach(function(x) {
            x.popularity = x.popularity / maxPopularity;
        });

        next(null, items);
    });
};

var deleteCategoryPopularities = function(client, next) {
    var queryStr = "delete from category_popularity;";

    client.query(queryStr, function(err) {
        next(err);
    });
};


var insertCategoryPopularity = function(client, categoryPopularity, next) {
    var queryStr =
        "INSERT INTO category_popularity(category_id, popularity)\n" +
        "VALUES ($1, $2);";

    var queryParams = [categoryPopularity.id, categoryPopularity.popularity];

    client.query(queryStr, queryParams, function(err) {
        next(err);
    });
};

var resetCategoryPopularities = function(conn, appStoreBatchId, next) {
    conn.beginTran(function(err) {
        if (err) { return next(err); }

        getCalculatedCategoryPopularities(conn.client, appStoreBatchId, function(err, categoryPopularities) {
            if (err) { return next(err); }

            deleteCategoryPopularities(conn.client, function(err) {
                if (err) { return next(err); }

                var processCategoryPopularity = function(categoryPopularity, callback) {
                    insertCategoryPopularity(conn.client, categoryPopularity, function(err) {
                        callback(err);
                    });
                };

                async.eachSeries(categoryPopularities, processCategoryPopularity, function(err) {
                    if (err) { return next(err); }

                    conn.commitTran(function(err) {
                        next(err);
                    });
                });
            });
        });
    });
};

var getCalculatedAppPopularities = function(client, appStoreBatchId, next) {
    var queryStr =
        "select as_a.app_id, as_c.position\n" +
        "from (\n" +
            "select store_app_id, min(position) as position\n" +
            "from appstore_chart\n" +
            "where batch_id = $1\n" +
            "group by store_app_id\n" +
        ") as_c\n" +
        "join appstore_app as_a on as_c.store_app_id = as_a.store_app_id;";

    client.query(queryStr, [appStoreBatchId], function (err, result) {
        if (err) { return next(err); }

        var items = result.rows.map(function(item) {
            var popularity = parseFloat(item.position);
            if (Number.isNaN(popularity) || !Number.isFinite(popularity)) {
                return next("Error parsing float: " + item.position);
            }

            return {
                appId: item.app_id,
                popularity: 1.0 / (Math.pow(item.position,0.3))
            };
        });

        next(null, items);
    });
};

var deleteAppPopularities = function(client, next) {
    var queryStr = "delete from app_popularity;";

    client.query(queryStr, function(err) {
        next(err);
    });
};


var insertAppPopularity = function(client, appPopularity, next) {
    var queryStr =
        "INSERT INTO app_popularity(app_id, popularity)\n" +
        "VALUES ($1, $2);";

    var queryParams = [appPopularity.appId, appPopularity.popularity];

    client.query(queryStr, queryParams, function(err) {
        next(err);
    });
};

var resetAppPopularities = function(conn, appStoreBatchId, next) {
    conn.beginTran(function(err) {
        if (err) { return next(err); }

        getCalculatedAppPopularities(conn.client, appStoreBatchId, function(err, appPopularities) {
            if (err) { return next(err); }

            deleteAppPopularities(conn.client, function(err) {
                if (err) { return next(err); }

                var processAppPopularity = function(appPopularity, callback) {
                    insertAppPopularity(conn.client, appPopularity, function(err) {
                        callback(err);
                    });
                };

                async.eachSeries(appPopularities, processAppPopularity, function(err) {
                    if (err) { return next(err); }

                    conn.commitTran(function(err) {
                        next(err);
                    });
                });
            });
        });
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

exports.getChartAppIndex = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getChartAppIndex(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.insertAppChartEntry = function(app, categoryId, position, batchId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertAppChartEntry(conn.client, app, categoryId, position, batchId, function(err, id) {
            conn.close(err, function(err) {
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

        getMissingAppChartApps(conn.client, function(err, results) {
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

exports.getCategoryAppDescriptions = function(categoryId, limit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryAppDescriptions(conn.client, categoryId, limit, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.resetCategoryPopularities = function(appStoreBatchId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        resetCategoryPopularities(conn, appStoreBatchId, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.resetAppPopularities = function(appStoreBatchId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        resetAppPopularities(conn, appStoreBatchId, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};
