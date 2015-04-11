"use strict";
var async = require('async');
var connection = require('./connection');

var getAppByExtId = function (client, extId, next) {
    var queryStr =
        "SELECT a.app_id, ext_id, store_app_id, name, censored_name, description, store_url,\n" +
        "dev_id, dev_name, dev_url, features, supported_devices,\n" +
        "is_game_center_enabled, screenshot_urls, ipad_screenshot_urls,\n" +
        "artwork_small_url, artwork_medium_url, artwork_large_url, price,\n" +
        "currency, version, primary_genre, genres, release_date, bundle_id,\n" +
        "seller_name, release_notes, min_os_version, language_codes, file_size_bytes,\n" +
        "advisory_rating, content_rating, user_rating_current, rating_count_current, user_rating,\n" +
        "rating_count, is_iphone, is_ipad, a.date_created, a.date_modified,\n" +
        "aa.is_globally_ambiguous, aa.ambiguous_dev_terms, aa.can_use_short_name\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_ambiguity aa on a.app_id = aa.app_id\n" +
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
            isIphone: item.is_iphone,
            isIpad: item.is_ipad,
            excludeTerms: item.ambiguous_dev_terms,
            includeDevName: item.is_globally_ambiguous === true,
            canUseShortName: item.can_use_short_name === true,
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

var getCategoryApps = function(client, categoryId, filters, skip, take, next) {
    var queryStr =
        "SELECT a.ext_id, a.name, a.artwork_small_url, a.price, a.is_iphone, a.is_ipad,\n" +
        "substring(a.description from 0 for 300) as short_description, ca.position,\n" +
        "count(1) OVER() as total\n" +
        "FROM appstore_app a\n" +
        "JOIN category_app ca ON a.app_id = ca.app_id\n" +
        "WHERE ca.category_id = $1\n" +
        (filters.isFree === true ? "AND a.is_free\n" : "") +
        (filters.isIphone === true ? "AND a.is_iphone\n": "") +
        (filters.isIpad === true ? "AND a.is_ipad\n": "") +
        "ORDER BY ca.position\n" +
        "LIMIT $2 OFFSET $3;";

    var queryParams = [categoryId, take, skip];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length === 0) {
            return {
                total: 0,
                apps: []
            };
        }

        var apps = result.rows.map(function(item) {
            return {
                extId: item.ext_id,
                name: item.name,
                artworkSmallUrl: item.artwork_small_url,
                price: item.price,
                isIphone: item.is_iphone,
                isIpad: item.is_ipad,
                shortDescription: item.short_description,
                position: item.position
            };
        });

        var pageResult = {
            total: result.rows[0].total,
            apps: apps
        };

        next(null, pageResult);
    });
};

var getMultiCategoryApps = function(client, categoryIds, take, filters, next) {
    var queryParams = [ take ];
    var params = [];
    categoryIds.forEach(function(categoryId, i) {
        params.push('$'+ (i + 2));
        queryParams.push(categoryId);
    });

    var queryStr =
        "SELECT ca.category_id, a.ext_id, a.name, a.artwork_small_url, a.price,\n" +
        "substring(a.description from 0 for 200) as short_description, ca.position\n" +
        "FROM appstore_app a\n" +
        "JOIN category_app ca ON a.app_id = ca.app_id\n" +
        "WHERE ca.category_id in (" + params.join(',') + ")\n" +
        "AND ca.position <= $1\n" +
        (filters.isFree === true ? "AND a.is_free\n" : "") +
        (filters.isIphone === true ? "AND a.is_iphone\n" : "") +
        (filters.isIpad === true ? "AND a.is_ipad\n" : "") +
        "ORDER BY ca.category_id, ca.position;";

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        var results = result.rows.map(function(item) {
            return {
                categoryId: item.category_id,
                extId: item.ext_id,
                name: item.name,
                artworkSmallUrl: item.artwork_small_url,
                price: item.price,
                shortDescription: item.short_description,
                position: item.position
            };
        });

        next(null, results);
    });
};

var getCategories = function(client, next) {
    var queryStr =
        "SELECT c.id, c.ext_id, c.name, c.description,\n" +
        "c.date_created, c.date_modified, c.date_deleted, cp.popularity\n" +
        "FROM category c\n" +
        "LEFT JOIN category_popularity cp\n" +
        "ON c.id = cp.category_id\n" +
        "WHERE date_deleted is null\n" +
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
        "ORDER BY ca.position, cp.popularity desc\n" +
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
                position: item.position
            };
        });

        next(null, categories);
    });
};

var getAppIndexBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, a.is_iphone, a.is_ipad, a.dev_name,\n" +
        "a.user_rating_current, a.rating_count_current, a.user_rating, a.rating_count,\n" +
        "ap.popularity\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "WHERE a.app_id > $1\n" +
        "AND a.name is not null\n" +
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
                description: item.description,
                supportedDevices: item.supported_devices,
                imageUrl: item.artwork_small_url,
                price: item.price,
                isIphone: item.is_iphone,
                isIpad: item.is_ipad,
                developerName: item.dev_name,
                userRatingCurrent: item.user_rating_current,
                ratingCountCurrent: item.rating_count_current,
                userRating: item.user_rating,
                ratingCount: item.rating_count,
                popularity: item.popularity
            };
        });

        next(null, items);
    });
};

var getAppIndexApp = function(client, appId, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, a.is_iphone, a.is_ipad, a.dev_name,\n" +
        "a.user_rating_current, a.rating_count_current, a.user_rating, a.rating_count,\n" +
        "ap.popularity\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "WHERE a.app_id = $1\n" +
        "AND a.name is not null\n" +
        "AND a.date_deleted is null;";

    client.query(queryStr, [appId], function (err, result) {
        if (err) { return next(err); }

        if (result.rows.length === 0) {
            return next(null, null);
        }

        var item = result.rows[0];
        var app = {
                id: item.app_id,
                extId: item.ext_id,
                name: item.name,
                description: item.description,
                supportedDevices: item.supported_devices,
                imageUrl: item.artwork_small_url,
                price: item.price,
                isIphone: item.is_iphone,
                isIpad: item.is_ipad,
                developerName: item.dev_name,
                userRatingCurrent: item.user_rating_current,
                ratingCountCurrent: item.rating_count_current,
                userRating: item.user_rating,
                ratingCount: item.rating_count,
                popularity: item.popularity
            };

        next(null, app);
    });
};

var getClusterIndexBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.genres," +
        "a.screenshot_urls, a.ipad_screenshot_urls, a.dev_id, " +
        "ap.popularity, aa.desc_is_english\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "LEFT JOIN app_popularity ap\n" +
        "ON a.app_id = ap.app_id\n" +
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
                extId: item.ext_id,
                name: item.name,
                devId: item.dev_id,
                description: item.description,
                genres: item.genres,
                screenShotUrls: item.screenshot_urls,
                iPadScreenShotUrls: item.ipad_screenshot_urls,
                popularity: item.popularity,
                isEnglish: item.desc_is_english
            };
        });

        next(null, items);
    });
};

var getClusterIndexApp = function(client, appId, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.genres," +
        "a.screenshot_urls, a.ipad_screenshot_urls, a.dev_id, " +
        "ap.popularity, aa.desc_is_english\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "LEFT JOIN app_popularity ap\n" +
        "ON a.app_id = ap.app_id\n" +
        "WHERE a.app_id = $1\n" +
        "AND a.date_deleted is null;";

    client.query(queryStr, [appId], function (err, result) {
        if (err) { return next(err); }

        if (result.rows.length === 0) {
            return next(null, null);
        }

        var item = result.rows[0];
        var app = {
            id: item.app_id,
            extId: item.ext_id,
            name: item.name,
            devId: item.dev_id,
            description: item.description,
            genres: item.genres,
            screenShotUrls: item.screenshot_urls,
            iPadScreenShotUrls: item.ipad_screenshot_urls,
            popularity: item.popularity,
            isEnglish: item.desc_is_english
        };

        next(null, app);
    });
};

var getModifiedClusterIndexApps = function(client, modifiedSinceDate, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.genres," +
        "a.screenshot_urls, a.ipad_screenshot_urls, a.dev_id, " +
        "ap.popularity, aa.desc_is_english\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
        "LEFT JOIN app_popularity ap\n" +
        "ON a.app_id = ap.app_id\n" +
        "WHERE a.date_modified > $1\n" +
        "AND a.date_deleted is null\n" +
        "ORDER BY a.app_id;";

    client.query(queryStr, [modifiedSinceDate], function (err, result) {
        if (err) { return next(err); }

        var items = result.rows.map(function(item) {
            return {
                id: item.app_id,
                extId: item.ext_id,
                name: item.name,
                devId: item.dev_id,
                description: item.description,
                genres: item.genres,
                screenShotUrls: item.screenshot_urls,
                iPadScreenShotUrls: item.ipad_screenshot_urls,
                popularity: item.popularity,
                isEnglish: item.desc_is_english
            };
        });

        next(null, items);
    });
};

var getCategoryAppsIndexBatch = function(client, lastId, limit, next) {
    var queryStr =
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, ap.popularity\n" +
        "FROM appstore_app a\n" +
        "JOIN category_app ca on a.app_id = ca.app_id\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "LEFT JOIN app_analysis aa\n" +
        "ON a.app_id = aa.app_id\n" +
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
        "SELECT a.app_id, a.ext_id, a.name, COALESCE(aa.desc_cleaned, a.description) as description, a.store_url, a.supported_devices,\n" +
        "a.artwork_small_url, a.price, a.is_iphone, a.is_ipad, a.dev_name,\n" +
        "a.user_rating_current, a.rating_count_current, a.user_rating, a.rating_count,\n" +
        "ap.popularity, ca.position\n" +
        "FROM appstore_app a\n" +
        "JOIN category_app ca on a.app_id = ca.app_id\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "LEFT JOIN category_app_exclude ca_e on ca.category_id = ca_e.category_id AND ca.app_id = ca_e.app_id\n" +
        "LEFT JOIN app_analysis aa on a.app_id = aa.app_id\n" +
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
                isIphone: item.is_iphone,
                isIpad: item.is_ipad,
                developerName: item.dev_name,
                userRatingCurrent: item.user_rating_current,
                ratingCountCurrent: item.rating_count_current,
                userRating: item.user_rating,
                ratingCount: item.rating_count,
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

exports.getCategoryApps = function(categoryId, filters, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryApps(conn.client, categoryId, filters, skip, take, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.getMultiCategoryApps = function(categoryIds, take, filters, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getMultiCategoryApps(conn.client, categoryIds, take, filters, function(err, apps) {
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

var getRelatedCategoriesByExtId = function(client, extId, skip, take, next) {
    var queryStr =
        "select c.id, c.ext_id, c.name, c.description\n" +
        "from category c\n" +
        "join (\n" +
        "select related_category_id\n" +
        "from related_category\n" +
        "where category_id = (select id from category where ext_id = $1)\n" +
        "order by position\n" +
        "LIMIT $2 OFFSET $3\n" +
        ") rc on c.id = rc.related_category_id\n" +
        "where c.date_deleted is null;";

    var queryParams = [extId, take, skip];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        var cats = result.rows.map(function(item) {
            return {
                id: item.id,
                extId: item.ext_id,
                name: item.name,
                description: item.description
            };
        });

        next(null, cats);
    });
};

exports.getRelatedCategoriesByExtId = function(extId, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getRelatedCategoriesByExtId(conn.client, extId, skip, take, function(err, categories) {
            conn.close(err, function(err) {
                next(err, categories);
            });
        });
    });
};


var getPopularCategories = function(client, skip, take, next) {
    var queryStr =
        "select c.id, c.ext_id, c.name, cp.popularity\n" +
        "from category c\n" +
        "join category_popularity cp on c.id = cp.category_id\n" +
        "where c.date_deleted is null\n" +
        "order by cp.popularity desc\n" +
        "offset $1 limit $2;";

    var queryParams = [skip, take];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        var cats = result.rows.map(function(item) {
            return {
                id: item.id,
                extId: item.ext_id,
                name: item.name,
                total: item.total
            };
        });

        next(null, cats);
    });
};

exports.getPopularCategories = function(skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getPopularCategories(conn.client, skip, take, function(err, categories) {
            conn.close(err, function(err) {
                next(err, categories);
            });
        });
    });
};

var getAppsCategories = function(client, skip, take, next) {
    var queryStr =
        "select c.id, c.ext_id, c.name, cp.popularity\n" +
        "from category c\n" +
        "join category_popularity cp on c.id = cp.category_id\n" +
        "left join (\n" +
        "select category_id\n" +
        "from category_genre cg\n" +
        "join appstore_category ac on cg.appstore_category_id = ac.id\n" +
        "where ac.url_name = 'games'\n" +
        ") t on c.id = t.category_id\n" +
        "where t.category_id is null\n" +
        "and c.date_deleted is null\n" +
        "order by cp.popularity desc\n" +
        "offset $1 limit $2;";

    var queryParams = [skip, take];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        var cats = result.rows.map(function(item) {
            return {
                id: item.id,
                extId: item.ext_id,
                name: item.name,
                total: item.total
            };
        });

        next(null, cats);
    });
};

exports.getAppsCategories = function(skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getAppsCategories(conn.client, skip, take, function(err, categories) {
            conn.close(err, function(err) {
                next(err, categories);
            });
        });
    });
};

var getPopularCategoriesByGenre = function(client, genre, skip, take, next) {
    var queryStr =
        "select c.id, c.ext_id, c.name, count(1) OVER() as total\n" +
        "from category_genre cg\n" +
        "join appstore_category ac on cg.appstore_category_id = ac.id\n" +
        "join category c on cg.category_id = c.id\n" +
        "join category_popularity cp on c.id = cp.category_id\n" +
        "where ac.url_name = $1\n" +
        "and c.date_deleted is null\n" +
        "order by cp.popularity * cg.percent desc\n" +
        "offset $2 limit $3;";

    var queryParams = [genre, skip, take];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        if (result.rows.length === 0) {
            return next(null, {
                total: 0,
                categories: []
            });
        }

        var cats = result.rows.map(function(item) {
            return {
                id: item.id,
                extId: item.ext_id,
                name: item.name,
                total: item.total
            };
        });

        var pageResult = {
            total: result.rows[0].total,
            categories: cats
        };

        next(null, pageResult);
    });
};

exports.getPopularCategoriesByGenre = function(genre, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getPopularCategoriesByGenre(conn.client, genre, skip, take, function(err, pageResult) {
            conn.close(err, function(err) {
                next(err, pageResult);
            });
        });
    });
};

var getActiveAppStoreGenres = function(client, next) {
    var queryStr =
        "select ac.name, ac.url_name as id, ac2.url_name as parent_id\n" +
        "from appstore_category ac\n" +
        "left join appstore_category ac2 on ac.parent_id = ac2.id\n" +
        "join (\n" +
        "select distinct appstore_category_id\n" +
        "from category_genre\n" +
        ") t\n" +
        "on ac.id = t.appstore_category_id\n" +
        "order by parent_id desc, name";

    client.query(queryStr, function (err, result) {
        if (err) { return next(err); }

        var genres = result.rows.map(function(item) {

            var genre = {
                id: item.id,
                name: item.name
            };

            if (item.parent_id) {
                genre.parentId = item.parent_id;
            }

            return genre;
        });

        next(null, genres);
    });
};

exports.getActiveAppStoreGenres = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getActiveAppStoreGenres(conn.client, function(err, genres) {
            conn.close(err, function(err) {
                next(err, genres);
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

exports.getAppIndexApp = function(appId, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getAppIndexApp(conn.client, appId, function(err, app) {
            conn.close(err, function(err) {
                next(err, app);
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

exports.getClusterIndexApp = function(appId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getClusterIndexApp(conn.client, appId, function(err, app) {
            conn.close(err, function(err) {
                next(err, app);
            });
        });
    });
};


exports.getModifiedClusterIndexApps = function(modifiedSinceDate, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getModifiedClusterIndexApps(conn.client, modifiedSinceDate, function(err, apps) {
            conn.close(err, function(err) {
                next(err, apps);
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
