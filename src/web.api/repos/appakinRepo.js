"use strict";
var isWin = /^win/.test(process.platform);

var config = require('../config');
var pg = isWin ? require("pg") : require("pg").native;
var uuid = require('node-uuid');

var UNIQUE_VIOLATION_CODE = '23505';
var APP_STORE_ID = 1;

var Repository = function() {
};

var createClient = function(next) {
    var connStr = config.connectionString.appakin;
    pg.connect(connStr, function(err, client, done) {
        if(err) {
            next(err);
        }

        next(null, client, done);
    });
};

Repository.prototype.connect = function(next) {
    var me = this;
    createClient(function(err, client, done) {
        if(err) {
            next(err);
        }

        me.client = client;
        me.done = done;
        next();
    });
};

Repository.prototype.query = function(queryStr, queryParams, next) {
    var me = this;

    me.client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return me.rollback(next, err);
        }

        next(null, result);
    });
};

Repository.prototype.close = function (next) {
    this.done();
    if (next) {
        next();
    }
};

Repository.prototype.beginTran = function (next) {
    this.query('BEGIN', [], next);
};

Repository.prototype.commitTran = function (next) {
    this.query('COMMIT', [], next);
};

Repository.prototype.rollback = function (next, err) {
    var me = this;
    me.query('ROLLBACK', [], function (rbErr) {
        //if there was a problem rolling back the query
        //something is seriously messed up.  Return the error
        //to the done function to close & remove this client from
        //the pool.  If you leave a client in the pool with an unaborted
        //transaction __very bad things__ will happen.
        me.done(rbErr);
        if (rbErr) {
            next(rbErr);
        }
        else {
            next(err);
        }
    });
};

Repository.prototype.insertApp = function(storeId, app, next) {
    var me = this;
    var queryStr =
        "INSERT INTO app(ext_id, store_id, name, date_created, date_modified) " +
        "VALUES ($1, $2, $3, NOW(), NOW()) " +
        "RETURNING id;";

    var queryParams = [
        uuid.v4(),
        storeId,
        app.name
    ];

    me.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

Repository.prototype.insertAppStoreAppInternal = function (appId, app, next) {
    var me = this;
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

    me.query(queryStr, queryParams, function (err) {
        if (err) {
            return next(err);
        }

        next();
    });
};

Repository.prototype.insertAppStoreApp = function(app, next) {
    var me = this;
    me.beginTran(function(err) {
        if (err) {
            return next(err);
        }

        me.insertApp(APP_STORE_ID, app, function(err, appId) {
            if (err) {
                if (err.code === UNIQUE_VIOLATION_CODE) {
                    return next(null, -1);
                }

                return next(err);
            }

            me.insertAppStoreAppInternal(appId, app, function(err) {
                if (err) {
                    return next(err);
                }

                me.commitTran(function(err) {
                    if (err) {
                        return next(err);
                    }

                    next(null, appId);
                });
            });
        });
    });
};

Repository.prototype.insertAppStoreCategory = function(category, next) {
    var me = this;
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

    me.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

Repository.prototype.insertAppStoreAppSrc = function(app, categoryId, letter, pageNumber, next) {
    var me = this;
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

    me.query(queryStr, queryParams, function (err, result) {
        if (err) {
            if (err.code === UNIQUE_VIOLATION_CODE) {
                return next(null, -1);
            }

            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

Repository.prototype.insertAppStorePopular = function(app, categoryId, position, batchId, next) {
    var me = this;
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

    me.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

Repository.prototype.getAppStoreCategories = function(next) {
    var me = this;
    var queryStr =
        "SELECT id, store_category_id, name, store_url, parent_id, date_created, date_modified " +
        "FROM appstore_category where id > 30 " +
        "order by id";

    me.query(queryStr, [], function (err, result) {
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

Repository.prototype.getAppStoreSourceItemBatch = function(startId, batchSize, next) {
    var me = this;
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

    me.query(queryStr, queryParams, function (err, result) {
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

Repository.prototype.getMissingAppStorePopularApps = function(next) {
    var me = this;
    var queryStr =
        "SELECT ap.id, ap.batch, ap.appstore_category_id, ap.store_app_id, ap.name, ap.position, ap.date_created " +
        "FROM appstore_popular ap " +
        "LEFT JOIN appstore_app aa on ap.store_app_id = aa.store_app_id " +
        "WHERE aa.app_id is null " +
        "ORDER BY ap.id;";

    me.query(queryStr, [], function (err, result) {
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

Repository.prototype.getMissingAppStoreSourceApps = function(next) {
    var me = this;
    var queryStr =
        "SELECT asa.id, asa.appstore_category_id, asa.store_app_id, asa.name, asa.letter, asa.page_number, " +
        "asa.date_created, asa.date_modified " +
        "FROM appstore_app_src asa " +
        "LEFT JOIN appstore_app aa on asa.store_app_id = aa.store_app_id " +
        "WHERE aa.app_id is null " +
        "ORDER BY asa.id;";

    me.query(queryStr, [], function (err, result) {
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

Repository.prototype.insertXyoCategory = function(category, next) {
    var me = this;
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

    me.query(queryStr, queryParams, function (err, result) {
        if (err) {
            if (err.code === UNIQUE_VIOLATION_CODE) {
                return next(null, -1);
            }

            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

Repository.prototype.getXyoCategories = function(next) {
    var me = this;
    var queryStr =
        "SELECT id, name, link_text, description, url, date_created, date_modified " +
        "FROM xyo_category " +
        "order by id;";

    me.query(queryStr, [], function (err, result) {
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

Repository.prototype.insertXyoCategoryApp = function(xyoCategoryId, batchId, name, position, next) {
    var me = this;
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

    me.query(queryStr, queryParams, function (err, id) {
        if (err) {
            return next(err);
        }

        next(null, id);
    });
};

exports.end = function() {
    pg.end();
};

var connectRepo = function(next) {
    var repo = new Repository();
    repo.connect(function(err) {
        if (err) {
            return next(err);
        }

        next(null, repo);
    });
};

exports.insertAppStoreApp = function(app, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertAppStoreApp(app, function(err, appId) {
            repo.close(function() {
                next(err, appId);
            });
        });
    });
};

exports.insertAppStoreCategory = function(category, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertAppStoreCategory(category, function(err, appId) {
            repo.close(function() {
                next(err, appId);
            });
        });
    });
};

exports.insertAppStoreAppSrc = function(app, categoryId, letter, pageNumber, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertAppStoreAppSrc(app, categoryId, letter, pageNumber, function(err, id) {
            repo.close(function() {
                next(err, id);
            });
        });
    });
};

exports.getAppStoreCategories = function(next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.getAppStoreCategories(function(err, results) {
            repo.close(function() {
                next(err, results);
            });
        });
    });
};

exports.getAppStoreSourceItemBatch = function(startId, batchSize, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.getAppStoreSourceItemBatch(startId, batchSize, function(err, results) {
            repo.close(function() {
                next(err, results);
            });
        });
    });
};

exports.insertXyoCategory = function(category, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertXyoCategory(category, function(err, id) {
            repo.close(function() {
                next(err, id);
            });
        });
    });
};

exports.getXyoCategories = function(next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.getXyoCategories(function(err, categories) {
            repo.close(function() {
                next(err, categories);
            });
        });
    });
};

exports.insertXyoCategoryApp = function(categoryId, batchId, name, position, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertXyoCategoryApp(categoryId, batchId, name, position, function(err, id) {
            repo.close(function() {
                next(err, id);
            });
        });
    });
};

exports.insertAppStorePopular = function(app, categoryId, position, batchId, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertAppStorePopular(app, categoryId, position, batchId, function(err, id) {
            repo.close(function() {
                next(err, id);
            });
        });
    });
};

exports.getMissingAppStorePopularApps = function(next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.getMissingAppStorePopularApps(function(err, results) {
            repo.close(function() {
                next(err, results);
            });
        });
    });
};

exports.getMissingAppStoreSourceApps = function(next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.getMissingAppStoreSourceApps(function(err, results) {
            repo.close(function() {
                next(err, results);
            });
        });
    });
};
