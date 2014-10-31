"use strict";
var async = require('async');
var connection = require('./connection');

var getAppByExtId = function (client, extId, next) {
    var queryStr =
        "SELECT app_id, ext_id, store_app_id, name, censored_name, description, store_url,\n" +
        "dev_id, dev_name, dev_url, features, supported_devices,\n" +
        "is_game_center_enabled, screenshot_urls, ipad_screenshot_urls,\n" +
        "artwork_small_url, artwork_medium_url, artwork_large_url, price,\n" +
        "currency, version, primary_genre, genres, release_date, bundle_id,\n" +
        "seller_name, release_notes, min_os_version, language_codes, file_size_bytes,\n" +
        "advisory_rating, content_rating, user_rating_current, rating_count_current, user_rating,\n" +
        "rating_count, date_created, date_modified\n" +
        "FROM appstore_app\n" +
        "WHERE ext_id = $1;";

    client.query(queryStr, [extId], function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length !== 1) {
            return next(null, null);
        }

        var item = result.rows[0];

        var app = {
            id: item.app_id,
            extId: item.ext_id,
            storeAppId: item.store_app_id,
            name: item.name,
            censoredName: item.censored_name,
            description: item.description,
            storeUrl: item.store_url,
            devId: item.dev_id,
            devName: item.dev_name,
            devUrl: item.dev_url,
            features: item.features,
            supportedDevices: item.supported_devices,
            isGameCenterEnabled: item.is_game_center_enabled,
            screenShotUrls: item.screenshot_urls,
            ipadScreenShotUrls: item.ipad_screenshot_urls,
            artworkSmallUrl: item.artwork_small_url,
            artworkMediumUrl: item.artwork_medium_url,
            artworkLargeUrl: item.artwork_large_url,
            price: item.price,
            currency: item.currency,
            version: item.version,
            primaryGenre: item.primary_genre,
            genres: item.genres,
            releaseDate: item.release_date,
            bundleId: item.bundle_id,
            sellerName: item.seller_name,
            releaseNotes: item.release_notes,
            minOsVersion: item.min_os_version,
            languageCodes: item.language_codes,
            fileSizeBytes: item.file_size_bytes,
            advisoryRating: item.advisory_rating,
            contentRating: item.content_rating,
            userRatingCurrent: item.user_rating_current,
            ratingCountCurrent: item.rating_count_current,
            userRating: item.user_rating,
            ratingCount: item.rating_count,
            dateCreated: item.date_created,
            dateModified: item.date_modified
        };

        next(null, app);
    });
};

var getAppStoreLink = function (client, extAppId, extCatId, next) {
    var queryStr =
        "select a.app_id, a.store_url, c.id as cat_id, ca.id as cat_app_id\n" +
        "from appstore_app a\n" +
        "left join category c on c.ext_id = $1\n" +
        "left join category_app ca on c.id = ca.category_id and a.app_id = ca.app_id\n" +
        "where a.ext_id = $2";

    var queryParams = [
        extCatId,
        extAppId
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length !== 1) {
            return next(null, null);
        }

        var item = result.rows[0];

        var appLink = {
            appId: item.app_id,
            storeUrl: item.store_url,
            catId: item.cat_id,
            catAppId: item.cat_app_id
        };

        next(null, appLink);
    });
};

var getCategoryByExtId = function (client, extId, next) {
    var queryStr =
        "SELECT id, ext_id, name, description, date_created, date_modified,\n" +
        "date_deleted\n" +
        "FROM category\n" +
        "WHERE ext_id = $1\n" +
        "AND date_deleted is null;";

    client.query(queryStr, [extId], function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length !== 1) {
            return next(null, null);
        }

        var item = result.rows[0];

        var category = {
            id: item.id,
            extId: item.ext_id,
            name: item.name,
            description: item.description,
            dateCreated: item.date_created,
            dateModified: item.date_modified
        };

        next(null, category);
    });
};

var getCategoryApps = function(client, categoryId, skip, take, next) {
    var queryStr =
        "SELECT a.ext_id, a.name, a.artwork_small_url, a.price,\n" +
        "substring(a.description from 0 for 200) as short_description, ca.position\n" +
        "FROM appstore_app a\n" +
        "JOIN category_app ca ON a.app_id = ca.app_id\n" +
        "LEFT JOIN category_app_exclude ca_e on ca.category_id = ca_e.category_id AND ca.app_id = ca_e.app_id\n" +
        "WHERE ca.category_id = $1\n" +
        "AND ca_e.id IS NULL\n" +
        "ORDER BY ca.position\n" +
        "LIMIT $2 OFFSET $3;";

    var queryParams = [categoryId, take, skip];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var apps = result.rows.map(function(item) {
            return {
                extId: item.ext_id,
                name: item.name,
                artworkSmallUrl: item.artwork_small_url,
                price: item.price,
                shortDescription: item.short_description,
                position: item.position
            };
        });

        next(null, apps);
    });
};

var getCategories = function(client, next) {
    var queryStr =
        "SELECT c.id, c.ext_id, c.name, c.description,\n" +
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
                extId: item.ext_id,
                name: item.name,
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

var getCategory = function(client, categoryId, next) {
    var queryStr =
        "SELECT c.id, c.ext_id, c.name, c.description,\n" +
        "c.date_created, c.date_modified, c.date_deleted, cp.popularity\n" +
        "FROM category c\n" +
        "LEFT JOIN category_popularity cp\n" +
        "ON c.id = cp.category_id\n" +
        "WHERE c.id = $1;";

    client.query(queryStr, [categoryId], function (err, result) {
        if (err) {
            return next(err);
        }

        var category = null;

        if (result.rows.length > 0) {
            var item = result.rows[0];
            category = {
                    id: item.id,
                    extId: item.ext_id,
                    name: item.name,
                    description: item.description,
                    dateCreated: item.date_created,
                    dateModified: item.date_modified,
                    dateDeleted: item.date_deleted,
                    popularity: item.popularity
            };
        }

        next(null, category);
    });
};

var getAppCategories = function(client, appId, skip, take, next) {
    var queryStr =
        "SELECT c.id, c.ext_id, c.name,\n" +
        "c.date_created, c.date_modified, c.date_deleted, cp.popularity, ca.position\n" +
        "FROM category c\n" +
        "JOIN category_app ca ON c.id = ca.category_id\n" +
        "LEFT JOIN category_popularity cp ON c.id = cp.category_id\n" +
        "LEFT JOIN category_app_exclude ca_e on ca.category_id = ca_e.category_id\n" +
        "AND ca.app_id = ca_e.app_id\n" +
        "WHERE ca.app_id = $1\n" +
        "AND c.date_deleted is null\n" +
        "AND ca_e.id is null\n" +
        "ORDER BY ca.position, ca.id\n" +
        "LIMIT $2 OFFSET $3";

    var queryParams = [appId, take, skip];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var categories = result.rows.map(function(item) {
            return {
                extId: item.ext_id,
                name: item.name,
                popularity: item.popularity,
                position: item.position
            };
        });

        next(null, categories);
    });
};

var getAppIndexBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, a.description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, ap.popularity\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "AND a.name is not null\n" +
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
                supportedDevices: item.supported_devices,
                imageUrl: item.artwork_small_url,
                price: item.price,
                popularity: item.popularity
            };
        });

        next(null, items);
    });
};

var getClusterIndexBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, a.description, t.is_cat_app\n" +
        "FROM appstore_app a\n" +
        "JOIN (\n" +
        "  SELECT a.app_id, bool_or(ca.id is not null) as is_cat_app\n" +
        "  FROM appstore_app a\n" +
        "  LEFT JOIN category_app ca on a.app_id = ca.app_id\n" +
        "  WHERE a.app_id > $1\n" +
        "  GROUP BY a.app_id\n" +
        "  ORDER BY a.app_id\n" +
        "  LIMIT $2\n" +
        ") t ON a.app_id = t.app_id;";

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
                isCategoryApp: item.is_cat_app
            };
        });

        next(null, items);
    });
};

var getCategoryAppsIndexBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, a.description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, ap.popularity\n" +
        "FROM appstore_app a\n" +
        "JOIN category_app ca on a.app_id = ca.app_id\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "AND a.name is not null\n" +
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
        "SELECT a.app_id, a.ext_id, a.name, a.description, a.store_url, a.supported_devices,\n" +
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
                extId: item.ext_id,
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

var getCategoryAppsForIndex = function(client, categoryId, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, a.description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, ap.popularity, ca.position\n" +
        "FROM appstore_app a\n" +
        "JOIN category_app ca on a.app_id = ca.app_id\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "LEFT JOIN category_app_exclude ca_e on ca.category_id = ca_e.category_id AND ca.app_id = ca_e.app_id\n" +
        "WHERE ca.category_id = $1\n" +
        "AND ca_e.id IS NULL\n" +
        "ORDER BY ca.position;";

    client.query(queryStr, [categoryId], function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.app_id,
                extId: item.ext_id,
                name: item.name,
                description: item.description,
                urlName: item.store_url,
                supportedDevices: item.supported_devices,
                imageUrl: item.artwork_small_url,
                price: item.price,
                popularity: item.popularity,
                position: item.position
            };
        });

        next(null, items);
    });
};

exports.getAppByExtId = function(extId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppByExtId(conn.client, extId, function(err, app) {
            conn.close(err, function(err) {
                next(err, app);
            });
        });
    });
};

exports.getAppStoreLink = function(extAppId, extCatId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppStoreLink(conn.client, extAppId, extCatId, function(err, appLink) {
            conn.close(err, function(err) {
                next(err, appLink);
            });
        });
    });
};

exports.getCategoryByExtId = function(extId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryByExtId(conn.client, extId, function(err, category) {
            conn.close(err, function(err) {
                next(err, category);
            });
        });
    });
};

exports.getCategoryApps = function(categoryId, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryApps(conn.client, categoryId, skip, take, function(err, apps) {
            conn.close(err, function(err) {
                next(err, apps);
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

exports.getCategory = function(categoryId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategory(conn.client, categoryId, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.getAppCategories = function(appId, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppCategories(conn.client, appId, skip, take, function(err, results) {
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

exports.getClusterIndexBatch = function(lastId, limit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getClusterIndexBatch(conn.client, lastId, limit, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.getCategoryAppsIndexBatch = function(lastId, limit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryAppsIndexBatch(conn.client, lastId, limit, function(err, results) {
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

exports.getCategoryAppsForIndex = function(categoryId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryAppsForIndex(conn.client, categoryId, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};
