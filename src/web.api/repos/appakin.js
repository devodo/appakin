"use strict";
var isWin = /^win/.test(process.platform);

var config = require('../config');
var pg = isWin ? require("pg") : require("pg").native;
var uuid = require('node-uuid');

var UNIQUE_VIOLATION_CODE = '23505';
var APP_STORE_ID = 1;

var connect = function(next) {
    var connStr = config.connectionString.appakin;
    pg.connect(connStr, function(err, client, done) {
        if(err) {
            next(err);
        }

        var repo = new Repository(client, done);
        next(null, repo);
    });
};

var Repository = function(client, done) {
    var repo = this;
    this.close = function (next) {
        done();
        if (next) {
            next();
        }
    };

    this.beginTran = function (next) {
        client.query('BEGIN', function (err) {
            if (err) {
                return repo.rollback(next, err);
            }

            next();
        });
    };

    this.commitTran = function (next) {
        client.query('COMMIT', function (err) {
            if (err) {
                return repo.rollback(next, err);
            }
            next();
        });
    };

    this.rollback = function (next, err) {
        client.query('ROLLBACK', function (rbErr) {
            //if there was a problem rolling back the query
            //something is seriously messed up.  Return the error
            //to the done function to close & remove this client from
            //the pool.  If you leave a client in the pool with an unaborted
            //transaction __very bad things__ will happen.
            done(rbErr);
            if (rbErr) {
                next(rbErr);
            }
            else {
                next(err);
            }
        });
    };

    this.testArray = function(next) {
        var queryStr = "INSERT INTO test(name) VALUES($1) RETURNING id";
        var queryParams = [['this', 'is','test']];

        client.query(queryStr, queryParams, function (err, result) {
            if (err) {
                return repo.rollback(next, err);
            }

            next(null, result.rows[0].id);
        });
    };

    this.insertItem = function(storeId, item, next) {
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

        client.query(queryStr, queryParams, function (err, result) {
            if (err) {
                return repo.rollback(next, err);
            }

            next(null, result.rows[0].id);
        });
    };

    this.insertAppStoreItemInternal = function (itemId, app, next) {

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

        client.query(queryStr, queryParams, function (err, result) {
            if (err) {
                return repo.rollback(next, err);
            }

            next(null);
        });
    };

    this.insertAppStoreItem = function(app, next) {
        repo.beginTran(function(err) {
            if (err) {
                return next(err);
            }

            repo.insertItem(APP_STORE_ID, app, function(err, itemId) {
                if (err) {
                    return next(err);
                }

                repo.insertAppStoreItemInternal(itemId, app, function(err) {
                    if (err) {
                        return next(err);
                    }

                    repo.commitTran(function(err) {
                        if (err) {
                            return next(err);
                        }

                        next(null, itemId);
                    });
                });
            });
        });
    };

    this.insertAppStoreCategory = function(category, next) {
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

        client.query(queryStr, queryParams, function (err, result) {
            if (err) {
                return repo.rollback(next, err);
            }

            next(null, result.rows[0].id);
        });
    };

    this.insertAppStoreItemSrc = function(item, next) {
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

        client.query(queryStr, queryParams, function (err, result) {
            if (err) {
                if (err.code === UNIQUE_VIOLATION_CODE) {
                    return next(null, -1);
                }

                return repo.rollback(next, err);
            }

            next(null, result.rows[0].id);
        });
    };
};

exports.connect = connect;

exports.end = function() {
    pg.end();
};

exports.testArray = function(next) {
    connect(function(err, repo) {
        if (err) {
            next(err);
        }

        repo.testArray(function(err, result) {
            repo.close(function() {
                next(err, result);
            });
        });
    });
};

exports.insertAppStoreItem = function(app, next) {
    connect(function(err, repo) {
        if (err) {
            next(err);
        }

        repo.insertAppStoreItem(app, function(err, itemId) {
            if (err) {
                next(err);
            }

            repo.close(function() {
                next(err, itemId);
            });
        });
    });
};

exports.insertAppStoreCategory = function(category, next) {
    connect(function(err, repo) {
        if (err) {
            next(err);
        }

        repo.insertAppStoreCategory(category, function(err, itemId) {
            if (err) {
                next(err);
            }

            repo.close(function() {
                next(err, itemId);
            });
        });
    });
};

exports.insertAppStoreItemSrc = function(item, next) {
    connect(function(err, repo) {
        if (err) {
            next(err);
        }

        repo.insertAppStoreItemSrc(item, function(err, id) {
            if (err) {
                next(err);
            }

            repo.close(function() {
                next(err, id);
            });
        });
    });
};
