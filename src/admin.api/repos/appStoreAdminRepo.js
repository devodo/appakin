"use strict";
var uuid = require('node-uuid');
var async = require('async');
var connection = require('./connection');

var APP_STORE_ID = 1;

var insertApp = function(client, storeId, extId, app, next) {
    var queryStr =
        "INSERT INTO app(ext_id, store_id, name, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, NOW(), NOW())\n" +
        "RETURNING id;";

    var queryParams = [
        extId,
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

var insertAppStoreAppInternal = function (client, appId, extId, app, next) {
    var queryStr =
        "INSERT INTO appstore_app(" +
        "app_id, ext_id, store_app_id, name, censored_name, description, store_url,\n" +
        "dev_id, dev_name, dev_url, features, supported_devices,\n" +
        "is_game_center_enabled, screenshot_urls, ipad_screenshot_urls,\n" +
        "artwork_small_url, artwork_medium_url, artwork_large_url, price,\n" +
        "currency, version, primary_genre, genres, release_date, bundle_id,\n" +
        "seller_name, release_notes, min_os_version, language_codes, file_size_bytes,\n" +
        "advisory_rating, content_rating, user_rating_current, rating_count_current, user_rating,\n" +
        "rating_count, is_free, is_iphone, is_ipad, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, $4, $5, $6,\n" +
        "$7, $8, $9, $10, $11,\n" +
        "$12, $13, $14,\n" +
        "$15, $16, $17, $18,\n" +
        "$19, $20, $21, $22, $23, $24,\n" +
        "$25, $26, $27, $28, $29,\n" +
        "$30, $31, $32, $33, $34, $35, $36, $37, $38, $39,\n" +
        "NOW(), NOW());";

    var supportedDevicesString = app.supportedDevices.join().toLowerCase();
    var isIphone = supportedDevicesString.indexOf('iphone') !== -1;
    var isIpad = supportedDevicesString.indexOf('ipad') !== -1;

    var queryParams = [
        appId,
        extId,
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
        app.ratingCount,
        app.price === 0 || app.price === '0',
        isIphone,
        isIpad
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

        var extId = uuid.v4();

        insertApp(conn.client, APP_STORE_ID, extId, app, function(err, appId) {
            if (err) {
                return next(err);
            }

            insertAppStoreAppInternal(conn.client, appId, extId, app, function(err) {
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

var updateAppStoreApp = function(client, app, next) {
    var queryStr =
        "UPDATE appstore_app\n" +
        "SET censored_name=$3,\n" +
        "features=$9, is_game_center_enabled=$11,\n" +
        "bundle_id=$23, min_os_version=$26, content_rating=$30,\n" +
        "user_rating_current=$31, rating_count_current=$32, user_rating=$33, rating_count=$34,\n" +

        "date_modified=NOW() at time zone 'utc', date_deleted=NULL\n" +
        "WHERE store_app_id=$1;";

    var supportedDevicesString = app.supportedDevices.join().toLowerCase();
    var isIphone = supportedDevicesString.indexOf('iphone') !== -1;
    var isIpad = supportedDevicesString.indexOf('ipad') !== -1;

    var queryParams = [
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
        app.ratingCount,
        app.price === 0 || app.price === '0',
        isIphone,
        isIpad
    ];

    client.query(queryStr, queryParams, function (err) {
        if (err) {
            return next(err);
        }

        next();
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

var getAppStoreCategory = function(client, categoryId, next) {
    var queryStr =
        "SELECT id, store_category_id, name, store_url, parent_id, date_created, date_modified\n" +
        "FROM appstore_category\n" +
        "WHERE id = $1;";

    client.query(queryStr, [categoryId], function (err, result) {
        if (err) { return next(err); }

        if (result.rows.length === 0) {
            return next();
        }

        var item = result.rows[0];
        var category = {
                id: item.id,
                storeAppId: item.store_category_id,
                name: item.name,
                storeUrl: item.store_url,
                parentId: item.parent_id,
                dateCreated: item.date_created,
                dateModified: item.date_modified
            };

        next(null, category);
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

var getAppStoreIdBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.store_app_id\n" +
        "FROM appstore_app a\n" +
        "WHERE a.app_id > $1\n" +
        "AND a.date_deleted is null\n" +
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
                storeAppId: item.store_app_id
            };
        });

        next(null, items);
    });
};

var getMissingAppChartAppIds = function(client, next) {
    var queryStr =
        "SELECT distinct ap.store_app_id\n" +
        "FROM appstore_chart ap\n" +
        "LEFT JOIN appstore_app aa on ap.store_app_id = aa.store_app_id\n" +
        "WHERE aa.app_id is null";

    client.query(queryStr, function (err, result) {
        if (err) {
            return next(err);
        }

        var appIds = result.rows.map(function(item) {
            return item.store_app_id;
        });

        next(null, appIds);
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

var resetCategoryGenres = function(client, next) {
    var queryStr = "select reset_category_genre();";

    client.query(queryStr, function (err, result) {
        if (err) { return next(err); }

        next(null, result);
    });
};

exports.resetTrendingCategories = function(next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        var queryStr = "select reset_trending_categories();";

        conn.client.query(queryStr, function (err, result) {
            if (err) { return next(err); }

            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.resetGenreCategories = function(next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        var queryStr = "select reset_genre_categories();";

        conn.client.query(queryStr, function (err, result) {
            if (err) { return next(err); }

            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.resetFeaturedApps = function(next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        var queryStr = "select reset_featured_apps();";

        conn.client.query(queryStr, function (err, result) {
            if (err) { return next(err); }

            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

var resetCategoryPopularities = function(client, next) {
    var queryStr = "select reset_category_popularity();";

    client.query(queryStr, function (err, result) {
        if (err) { return next(err); }

        next(null, result);
    });
};

var resetCategoryPopularitiesOld = function(conn, appStoreBatchId, next) {
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

var resetAppPopularities = function(client, next) {
    var queryStr = "select reset_app_popularity();";

    client.query(queryStr, function (err, result) {
        if (err) { return next(err); }

        next();
    });
};

var resetAppRankings = function(client, next) {
    var queryStr = "select reset_app_ranking();";

    client.query(queryStr, function (err, result) {
        if (err) { return next(err); }

        next();
    });
};

var resetAppPopularitiesOld = function(conn, appStoreBatchId, next) {
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

var getMissingXyoCategories = function(client, next) {
    var queryStr =
        "SELECT xc.id, xc.name, xc.description\n" +
        "FROM xyo_category xc\n" +
        "LEFT JOIN xyo_category_map xm\n" +
        "ON xc.id = xm.xyo_category_id\n" +
        "WHERE xm.id IS NULL\n" +
        "ORDER BY xc.id";

    client.query(queryStr, function (err, result) {
        if (err) {
            return next(err);
        }

        var categories = result.rows.map(function(row) {
            return {
                id: row.id,
                name: row.name,
                description: row.description
            };
        });

        next(null, categories);
    });
};

var insertCategory = function(client, name, description, next) {
    var queryStr =
        "INSERT INTO category(ext_id, name, description, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, NOW(), NOW())\n" +
        "RETURNING id;";

    var queryParams = [
        uuid.v4(),
        name,
        description
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var insertXyoCategoryMap = function(client, categoryId, xyoCategoryId, next) {
    var queryStr =
        "INSERT INTO xyo_category_map(category_id, xyo_category_id)\n" +
        "VALUES ($1, $2)\n" +
        "RETURNING id;";

    var queryParams = [
        categoryId,
        xyoCategoryId
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var getAppAnalysisBatch = function(client, lastId, limit, forceAll, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, a.description, a.dev_name, a.language_codes, a.analysis_checksum,\n" +
        "aa.desc_md5_checksum, aa.desc_cleaned\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_analysis aa on a.app_id = aa.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "AND a.date_deleted is null\n" +
        (forceAll ? "" : "AND (aa.desc_md5_checksum is null OR aa.desc_md5_checksum != a.analysis_checksum)\n") +
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
                app_id: item.app_id,
                ext_id: item.ext_id,
                name: item.name,
                description: item.description,
                dev_name: item.dev_name,
                language_codes: item.language_codes,
                app_checksum: item.analysis_checksum,
                desc_md5_checksum: item.desc_md5_checksum,
                desc_cleaned: item.desc_cleaned
            };
        });

        next(null, items);
    });
};

var insertCategoryAppExclude = function(client, categoryExtId, appExtId, next) {
    var insertStr =
        "INSERT INTO category_app_exclude(category_id, app_id, date_created)\n" +
        "VALUES (\n" +
        "  (select id from category where ext_id = $1),\n" +
        "  (select id from app where ext_id = $2),\n" +
        "  NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var insertParams = [
        categoryExtId,
        appExtId
    ];

    client.query(insertStr, insertParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var upsertAppAnalysis = function(client, appAnalysis, next) {
    var queryStr =
        "WITH new_values (app_id, desc_english_score, desc_length, name_length, desc_valid_term_count, desc_english_term_count, desc_english_position, desc_is_english, desc_md5_checksum, desc_cleaned) AS (\n" +
        "    values ($1::integer, $2::double precision, $3::integer, $4::integer, $5::integer, $6::integer, $7::integer, $8::boolean, $9::text, $10::text)\n" +
        "),\n" +
        "upsert AS\n" +
        "( \n" +
        "    UPDATE app_analysis aa \n" +
        "    SET desc_english_score = nv.desc_english_score,\n" +
        "        desc_english_position = nv.desc_english_position,\n" +
        "        desc_is_english = nv.desc_is_english,\n" +
        "        desc_length = nv.desc_length,\n" +
        "        name_length = nv.name_length,\n" +
        "        desc_valid_term_count = nv.desc_valid_term_count,\n" +
        "        desc_english_term_count = nv.desc_english_term_count,\n" +
        "        desc_md5_checksum = nv.desc_md5_checksum,\n" +
        "        desc_cleaned = nv.desc_cleaned,\n" +
        "        date_modified = NOW() at time zone 'utc'\n" +
        "    FROM new_values nv\n" +
        "    WHERE aa.app_id = nv.app_id\n" +
        "    RETURNING aa.*\n" +
        ")\n" +
        "INSERT INTO app_analysis (\n" +
        "    app_id,\n" +
        "    desc_english_score,\n" +
        "    desc_english_position,\n" +
        "    desc_is_english,\n" +
        "    desc_length,\n" +
        "    name_length,\n" +
        "    desc_valid_term_count,\n" +
        "    desc_english_term_count,\n" +
        "    desc_md5_checksum,\n" +
        "    desc_cleaned,\n" +
        "    date_created,\n" +
        "    date_modified)\n" +
        "SELECT\n" +
        "    app_id,\n" +
        "    desc_english_score,\n" +
        "    desc_english_position,\n" +
        "    desc_is_english,\n" +
        "    desc_length,\n" +
        "    name_length,\n" +
        "    desc_valid_term_count,\n" +
        "    desc_english_term_count,\n" +
        "    desc_md5_checksum,\n" +
        "    desc_cleaned,\n" +
        "    NOW() at time zone 'utc',\n" +
        "    NOW() at time zone 'utc'\n" +
        "FROM new_values\n" +
        "WHERE NOT EXISTS (SELECT 1 FROM upsert up WHERE up.app_id = new_values.app_id);";

    var queryParams = [
        appAnalysis.app_id,
        appAnalysis.desc_english_score,
        appAnalysis.desc_length,
        appAnalysis.name_length,
        appAnalysis.desc_valid_term_count,
        appAnalysis.desc_english_term_count,
        appAnalysis.desc_english_position,
        appAnalysis.desc_is_english,
        appAnalysis.desc_md5_checksum,
        appAnalysis.desc_cleaned
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, appAnalysis.app_id);
    });
};

var getSeedSearch = function(client, seedId, next) {
    var queryStr =
        "SELECT id, seed_category_id, query, max_take\n" +
        "FROM seed_category_search\n" +
        "WHERE seed_category_id = $1;";

    client.query(queryStr, [seedId], function (err, result) {
        if (err) {
            return next(err);
        }

        var seedSearch = null;
        if (result.rows.length > 0) {
            var item = result.rows[0];
            seedSearch = {
                id: item.id,
                seedCategoryId: item.seed_category_id,
                query: item.query,
                maxTake: item.max_take
            };
        }

        next(null, seedSearch);
    });
};

var getExistingAppStoreIds = function(client, appStoreIds, next) {
    if (appStoreIds.length === 0) {
        return next(null, []);
    }

    var queryParams = [];
    var params = [];
    appStoreIds.forEach(function(id, i) {
        queryParams.push(id);
        params.push('$'+ (i + 1));
    });

    var queryStr =
        "select store_app_id\n" +
        "from appstore_app\n" +
        "where store_app_id in (" + params.join(',') + ");";

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return item.store_app_id;
        });

        next(null, items);
    });
};

var getExistingAppSourceIds = function(client, appSources, next) {
    var queryParams = [];
    var params = [];
    appSources.forEach(function(id, i) {
        queryParams.push(id);
        params.push('$'+ (i + 1));
    });

    var queryStr =
        "SELECT store_app_id\n" +
        "FROM appstore_app_src\n" +
        "where store_app_id in (" + params.join(',') + ");";

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return item.store_app_id;
        });

        next(null, items);
    });
};

var getSeedSearches = function(client, seedCategoryId, next) {
    var queryStr =
        "SELECT id, seed_category_id, query, max_take\n" +
        "FROM seed_category_search\n" +
        "WHERE seed_category_id = $1\n" +
        "ORDER BY id;";

    client.query(queryStr, [seedCategoryId], function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                seedCategoryId: item.seed_category_id,
                query: item.query,
                maxTake: item.max_take
            };
        });

        next(null, items);
    });
};

var getAppStoreApp = function(client, appId, next) {
    var queryStr =
        "SELECT app_id, name, description, dev_name\n" +
        "FROM appstore_app\n" +
        "WHERE app_id = $1;";

    client.query(queryStr, [appId], function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length === 0) {
            return next();
        }

        var item = result.rows[0];
        var app = {
            id: item.app_id,
            name: item.name,
            description: item.description,
            devName: item.dev_name
        };

        next(null, app);
    });
};

var getAppStoreSameDeveloperApps = function(client, appId, next) {
    var queryStr =
        "SELECT name\n" +
        "FROM appstore_app\n" +
        "WHERE app_id != $1 AND dev_id = (SELECT dev_id FROM appstore_app WHERE app_id = $1) AND name IS NOT NULL;";

    client.query(queryStr, [appId], function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                name: item.name
            };
        });

        next(null, items);
    });
};

var getAppStoreEnglishAppBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, a.description, a.dev_name\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_analysis aa on a.app_id = aa.app_id\n" +
        "WHERE a.app_id > $1 AND aa.desc_is_english\n" +
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
                extId: item.ext_id,
                name: item.name,
                description: item.description,
                devName: item.dev_name
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

exports.updateAppStoreApp = function(app, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        updateAppStoreApp(conn.client, app, function(err) {
            conn.close(err, function(err) {
                next(err);
            });
        });
    });
};

var refreshAppStoreApp = function(client, app, next) {
    var queryStr = "SELECT refresh_appstore_app(" +
        "$1, $2, $3, $4, $5, $6," +
        "$7, $8, $9, $10, $11, $12, $13, $14);";

    var queryParams = [
        app.storeAppId,
        'USA',
        app.name,
        app.censoredName,
        app.features,
        app.isGameCenterEnabled,
        app.bundleId,
        app.minOsVersion,
        app.contentRating,
        app.userRatingCurrent,
        app.ratingCountCurrent,
        app.userRating,
        app.ratingCount,
        app.price
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        var ratingUpdated = result.rows[0].refresh_appstore_app;

        next(null, ratingUpdated);
    });
};

exports.refreshAppStoreApp = function(app, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        refreshAppStoreApp(conn.client, app, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
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

exports.getAppStoreCategory = function(categoryId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreCategory(conn.client, categoryId, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.getAppStoreSourceItemBatch = function(lastId, batchSize, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreSourceItemBatch(conn.client, lastId, batchSize, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.getAppStoreIdBatch = function(lastId, batchSize, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreIdBatch(conn.client, lastId, batchSize, function(err, results) {
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

exports.getMissingChartAppIds = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getMissingAppChartAppIds(conn.client, function(err, results) {
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

exports.resetCategoryGenres = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        resetCategoryGenres(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.resetCategoryPopularities = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        resetCategoryPopularities(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.resetAppPopularities = function(next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        resetAppPopularities(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.resetAppRankings = function(next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        resetAppRankings(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

var resetRelatedCategories = function(client, positionFactor, relatedPositionFactor, maxRelated, next) {
    var queryStr = "select reset_related_categories($1, $2, $3);";

    client.query(queryStr, [positionFactor, relatedPositionFactor, maxRelated], function (err, result) {
        if (err) { return next(err); }

        next(null, result);
    });
};

exports.resetRelatedCategories = function(positionFactor, relatedPositionFactor, maxRelated, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        resetRelatedCategories(conn.client, positionFactor, relatedPositionFactor, maxRelated, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

var resetRelatedCategory = function(client, categoryId, positionFactor, relatedPositionFactor, maxRelated, next) {
    var queryStr = "select reset_related_category($1, $2, $3, $4);";

    var queryParams = [
        categoryId,
        positionFactor,
        relatedPositionFactor,
        maxRelated
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        next(null, result);
    });
};

exports.resetRelatedCategory = function(categoryId, positionFactor, relatedPositionFactor, maxRelated, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        resetRelatedCategory(conn.client, categoryId, positionFactor, relatedPositionFactor, maxRelated, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

var insertCategoryAppExclude = function(client, categoryExtId, appExtId, next) {
    var insertStr =
        "INSERT INTO category_app_exclude(category_id, app_id, date_created)\n" +
        "VALUES (\n" +
        "  (select id from category where ext_id = $1),\n" +
        "  (select id from app where ext_id = $2),\n" +
        "  NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var insertParams = [
        categoryExtId,
        appExtId
    ];

    client.query(insertStr, insertParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

exports.getMissingXyoCategories = getMissingXyoCategories;
exports.insertCategory = insertCategory;
exports.insertXyoCategoryMap = insertXyoCategoryMap;

exports.insertCategoryAppExclude = function(categoryExtId, appExtId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertCategoryAppExclude(conn.client, categoryExtId, appExtId, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.getAppAnalysisBatch = function(lastId, limit, forceAll, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppAnalysisBatch(conn.client, lastId, limit, forceAll, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.upsertAppAnalysis = function(appAnalysis, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        upsertAppAnalysis(conn.client, appAnalysis, function(err, appId) {
            conn.close(err, function(err) {
                next(err, appId);
            });
        });
    });
};

exports.getSeedSearches = function(seedCategoryId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getSeedSearches(conn.client, seedCategoryId, function(err, seedSearches) {
            conn.close(err, function(err) {
                next(err, seedSearches);
            });
        });
    });
};

exports.getSeedSearch = function(seedId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getSeedSearch(conn.client, seedId, function(err, seedSearch) {
            conn.close(err, function(err) {
                next(err, seedSearch);
            });
        });
    });
};

exports.getExistingAppStoreIds = function(appStoreIds, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getExistingAppStoreIds(conn.client, appStoreIds, function(err, ids) {
            conn.close(err, function(err) {
                next(err, ids);
            });
        });
    });
};

exports.getExistingAppSourceIds = function(appSources, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getExistingAppSourceIds(conn.client, appSources, function(err, ids) {
            conn.close(err, function(err) {
                next(err, ids);
            });
        });
    });
};

var insertAppAmbiguity = function(client, appAmbiguity, next) {
    var queryStr =
        "INSERT INTO app_ambiguity(" +
        "app_id, is_dev_ambiguous, is_globally_ambiguous, top_ambiguous_app_ext_id," +
        "can_use_short_name, ambiguous_dev_terms, error_msg, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() at time zone 'utc', NOW() at time zone 'utc');";

    var queryParams = [
        appAmbiguity.appId,
        appAmbiguity.isDevAmbiguous,
        appAmbiguity.isGloballyAmbiguous,
        appAmbiguity.topAmbiguousAppExtId,
        appAmbiguity.canUseShortName,
        appAmbiguity.ambiguousDevTerms,
        appAmbiguity.errorMsg
    ];

    client.query(queryStr, queryParams, function (err) {
        return next(err);
    });
};

exports.insertAppAmbiguity = function(appAmbiguity, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        insertAppAmbiguity(conn.client, appAmbiguity, function(err) {
            conn.close(err, function(err) {
                next(err);
            });
        });
    });
};

var getMissingAppAmbiguityBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, a.dev_id, ap.popularity\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "LEFT JOIN app_ambiguity aa on a.app_id = aa.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "AND aa.app_id is null\n" +
        "AND a.date_deleted is null\n" +
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
                extId: item.ext_id,
                name: item.name,
                devId: item.dev_id,
                popularity: item.popularity
            };
        });

        next(null, items);
    });
};

exports.getMissingAppAmbiguityBatch = function(lastId, limit, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getMissingAppAmbiguityBatch(conn.client, lastId, limit, function(err, items) {
            conn.close(err, function(err) {
                next(err, items);
            });
        });
    });
};

exports.getAppStoreApp = function(appId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreApp(conn.client, appId, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.getAppStoreEnglishAppBatch = function(lastId, limit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreEnglishAppBatch(conn.client, lastId, limit, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.getAppStoreSameDeveloperApps = function(appId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreSameDeveloperApps(conn.client, appId, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

var getCategoryApps = function(client, next) {
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
        "order by ca.category_id, ca.position;";

    client.query(queryStr, function (err, result) {
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

exports.getCategoryApps = function(next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getCategoryApps(conn.client, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};



