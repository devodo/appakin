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

Repository.prototype.testArray = function(next) {
    var me = this;
    var queryStr = "INSERT INTO test(name) VALUES($1) RETURNING id";
    var queryParams = [['this', 'is','test']];

    me.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

Repository.prototype.insertItem = function(storeId, item, next) {
    var me = this;
    var queryStr =
        "INSERT INTO item(ext_id, store_id, store_item_id, name, date_created, date_modified) " +
        "VALUES ($1, $2, $3, $4, NOW(), NOW()) " +
        "RETURNING id;";

    var queryParams = [
        uuid.v4(),
        storeId,
        item.storeItemId,
        item.name
    ];

    me.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

Repository.prototype.insertAppStoreItemInternal = function (itemId, app, next) {
    var me = this;
    var queryStr =
        "INSERT INTO appstore_item(" +
        "item_id, name, censored_name, description, appstore_url, " +
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
        "$30, $31, $32, $33, $34, " +
        "NOW(), NOW());";

    var queryParams = [
        itemId,
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

Repository.prototype.insertAppStoreItem = function(app, next) {
    var me = this;
    me.beginTran(function(err) {
        if (err) {
            return next(err);
        }

        me.insertItem(APP_STORE_ID, app, function(err, itemId) {
            if (err) {
                if (err.code === UNIQUE_VIOLATION_CODE) {
                    return next(null, -1);
                }

                return next(err);
            }

            me.insertAppStoreItemInternal(itemId, app, function(err) {
                if (err) {
                    return next(err);
                }

                me.commitTran(function(err) {
                    if (err) {
                        return next(err);
                    }

                    next(null, itemId);
                });
            });
        });
    });
};

Repository.prototype.insertAppStoreCategory = function(category, next) {
    var me = this;
    var queryStr =
        "INSERT INTO appstore_category(" +
        "appstore_id, name, store_url, date_created, date_modified) " +
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

Repository.prototype.insertAppStoreItemSrc = function(item, next) {
    var me = this;
    var queryStr =
        "INSERT INTO appstore_item_src(" +
        "appstore_category_id, appstore_id, name, letter, page_number, " +
        "date_created, date_modified) " +
        "VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) " +
        "RETURNING id;";

    var queryParams = [
        item.categoryId,
        item.appStoreId,
        item.name,
        item.letter,
        item.pageNumber
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

Repository.prototype.getAppStoreCategories = function(next) {
    var me = this;
    var queryStr =
        "SELECT id, appstore_id, name, store_url, parent_id, date_created, date_modified " +
        "FROM appstore_category where id = 69" +
        "order by id";

    me.query(queryStr, [], function (err, result) {
        if (err) {
            return next(err);
        }

        var categories = result.rows.map(function(item) {
            return {
                id: item.id,
                appStoreId: item.appstore_id,
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
        "SELECT id, appstore_category_id, appstore_id, name, letter, page_number, " +
        "date_created, date_modified " +
        "FROM appstore_item_src " +
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
                appStoreId: item.appstore_id,
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

Repository.prototype.getAppMonstaBatch = function(startId, batchSize, next) {
    var me = this;
    var queryStr =
        "SELECT appstore_id " +
        "FROM appmonsta_item " +
        "where appstore_id > $1 " +
        "order by appstore_id " +
        "limit $2;";

    var queryParams = [
        startId,
        batchSize
    ];

    me.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var ids = result.rows.map(function(item) {
            return item.appstore_id;
        });

        next(null, ids);
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

Repository.prototype.insertAppMonstaItem = function(appId, next) {
    var me = this;
    var queryStr =
        "INSERT INTO appmonsta_item(appstore_id) " +
        "VALUES ($1);";

    var queryParams = [appId];

    me.query(queryStr, queryParams, function (err) {
        if (err) {
            return next(err);
        }

        next();
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

Repository.prototype.insertXyoCategoryItem = function(categoryId, name, position, next) {
    var me = this;
    var queryStr =
        "INSERT INTO xyo_category_item(" +
        "category_id, name, position, max_position, min_position, " +
        "date_created, date_modified) " +
        "VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) " +
        "RETURNING id;";

    var queryParams = [
        categoryId,
        name,
        position,
        position,
        position
    ];

    me.query(queryStr, queryParams, function (err, id) {
        if (err) {
            if (err.code === UNIQUE_VIOLATION_CODE) {
                return next(null, -1);
            }
            
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

exports.testArray = function(next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.testArray(function(err, result) {
            repo.close(function() {
                next(err, result);
            });
        });
    });
};

exports.insertAppStoreItem = function(app, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertAppStoreItem(app, function(err, itemId) {
            repo.close(function() {
                next(err, itemId);
            });
        });
    });
};

exports.insertAppStoreCategory = function(category, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertAppStoreCategory(category, function(err, itemId) {
            repo.close(function() {
                next(err, itemId);
            });
        });
    });
};

exports.insertAppStoreItemSrc = function(item, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertAppStoreItemSrc(item, function(err, id) {
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

exports.getAppMonstaBatch = function(startId, batchSize, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.getAppMonstaBatch(startId, batchSize, function(err, ids) {
            repo.close(function() {
                next(err, ids);
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

exports.insertAppMonstaItem = function(appId, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertAppMonstaItem(appId, function(err) {
            repo.close(function() {
                next(err);
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

exports.insertXyoCategoryItem = function(categoryId, name, position, next) {
    connectRepo(function(err, repo) {
        if (err) {
            return next(err);
        }

        repo.insertXyoCategoryItem(categoryId, name, position, function(err, id) {
            repo.close(function() {
                next(err, id);
            });
        });
    });
};
