"use strict";
var async = require('async');
var connection = require('./connection');

var PRICE_DROP_AGE_FACTOR = 0.6;

var nullFilterArray = function(array) {
    if (!array) {
        return null;
    }

    return array.filter(function(item) {
        return item;
    });
};

var getAppByExtId = function (client, extId, next) {
    var queryStr =
        "SELECT a.app_id, ext_id, name, description,\n" +
        "screenshot_urls, screenshot_dimensions, ipad_screenshot_urls, ipad_screenshot_dimensions,\n" +
        "artwork_small_url, artwork_large_url," +
        "p.price,\n" +
        "version, release_date,\n" +
        "min_os_version, file_size_bytes,\n" +
        "advisory_rating, dev_name," +
        "r.user_rating_current, r.rating_count_current, r.user_rating, r.rating_count," +
        "is_iphone, is_ipad, a.date_modified,\n" +
        "ar.popularity,\n" +
        "aa.is_globally_ambiguous, aa.ambiguous_dev_terms, aa.can_use_short_name\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_ambiguity aa on a.app_id = aa.app_id\n" +
        "LEFT JOIN appstore_price p on a.app_id = p.app_id and p.country_code = 'USA'\n" +
        "LEFT JOIN appstore_rating r on a.app_id = r.app_id and r.country_code = 'USA'\n" +
        "LEFT JOIN app_ranking ar on a.app_id = ar.app_id and ar.country_code = 'USA'\n" +
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
            name: item.name,
            description: item.description,
            devName: item.dev_name,
            screenShotUrls: nullFilterArray(item.screenshot_urls),
            screenShotDimensions: nullFilterArray(item.screenshot_dimensions),
            ipadScreenShotUrls: nullFilterArray(item.ipad_screenshot_urls),
            ipadScreenShotDimensions: nullFilterArray(item.ipad_screenshot_dimensions),
            artworkSmallUrl: item.artwork_small_url,
            artworkLargeUrl: item.artwork_large_url,
            price: Math.floor(item.price * 100),
            version: item.version,
            releaseDate: item.release_date,
            minOsVersion: item.min_os_version,
            fileSizeBytes: item.file_size_bytes,
            advisoryRating: item.advisory_rating,
            userRatingCurrent: item.user_rating_current,
            ratingCountCurrent: item.rating_count_current,
            userRating: item.user_rating,
            ratingCount: item.rating_count,
            popularity: item.popularity,
            isIphone: item.is_iphone,
            isIpad: item.is_ipad,
            excludeTerms: item.ambiguous_dev_terms,
            includeDevName: item.is_globally_ambiguous === true,
            canUseShortName: item.can_use_short_name === true,
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
        "SELECT id, ext_id, name, description, date_created, date_modified\n" +
        "FROM category\n" +
        "WHERE ext_id = $1";

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
            name: item.name
        };

        next(null, category);
    });
};

var getCategoryApps = function(client, categoryId, filters, skip, take, next) {
    var queryStr =
        "SELECT t.ext_id, t.name, t.artwork_small_url, t.price, t.is_iphone, t.is_ipad,\n" +
        "        substring(t.description from 0 for 300) as short_description, t.position,\n" +
        "        count(1) OVER() as total\n" +
        "FROM (\n" +
        "	select a.ext_id, a.name, a.artwork_small_url, p.price, a.is_iphone," +
        "          a.is_ipad, a.description, ca.position\n" +
        "	FROM appstore_app a\n" +
        "	JOIN category_app ca ON a.app_id = ca.app_id\n" +
        "	JOIN appstore_price p ON a.app_id = p.app_id and p.country_code = 'USA'\n" +
        "	WHERE ca.category_id = $1\n" +
        (filters.isFree === true ? "AND p.price = 0\n" : "") +
        (filters.isIphone === true ? "AND a.is_iphone\n": "") +
        (filters.isIpad === true ? "AND a.is_ipad\n": "") +
        "	ORDER BY ca.position\n" +
        "	limit 200\n" +
        ") t\n" +
        "ORDER BY t.position\n" +
        "LIMIT $2 OFFSET $3";

    var queryParams = [categoryId, take, skip];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length === 0) {
            return next(null, {
                total: 0,
                apps: []
            });
        }

        var apps = result.rows.map(function(item) {
            return {
                extId: item.ext_id,
                name: item.name,
                artworkSmallUrl: item.artwork_small_url,
                price: Math.floor(item.price * 100),
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

var getCategoryAppsByExtId = function(client, categoryExtId, filters, skip, take, next) {
    var queryStr =
        "SELECT t.ext_id, t.name, t.artwork_small_url, t.price, t.is_iphone, t.is_ipad,\n" +
        "        substring(t.description from 0 for 300) as short_description, t.position,\n" +
        "        count(1) OVER() as total\n" +
        "FROM (\n" +
        "	select a.ext_id, a.name, a.artwork_small_url, p.price, a.is_iphone," +
        "          a.is_ipad, a.description, ca.position\n" +
        "	FROM appstore_app a\n" +
        "	JOIN category_app ca ON a.app_id = ca.app_id\n" +
        "	JOIN appstore_price p ON a.app_id = p.app_id and p.country_code = 'USA'\n" +
        "	WHERE ca.category_id = (select id from category where ext_id = $1)\n" +
        (filters.isFree === true ? "AND p.price = 0\n" : "") +
        (filters.isIphone === true ? "AND a.is_iphone\n": "") +
        (filters.isIpad === true ? "AND a.is_ipad\n": "") +
        "	ORDER BY ca.position\n" +
        "	limit 200\n" +
        ") t\n" +
        "ORDER BY t.position\n" +
        "LIMIT $2 OFFSET $3";

    var queryParams = [categoryExtId, take, skip];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length === 0) {
            return next(null);
        }

        var apps = result.rows.map(function(item) {
            return {
                extId: item.ext_id,
                name: item.name,
                artworkSmallUrl: item.artwork_small_url,
                price: Math.floor(item.price * 100),
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

var getCategoryPriceDropAppsByExtId = function(client, categoryExtId, minPopularity, maxDays, filters, skip, take, next) {
    var queryStr =
        "SELECT *\n" +
        "FROM (\n" +
        "	SELECT a.ext_id, a.name, a.artwork_small_url, a.is_iphone, a.is_ipad, a.release_date,\n" +
        "	       r.user_rating, r.rating_count, r.user_rating_current, r.rating_count_current,\n" +
        "          substring(a.description from 0 for 300) as short_description, pc.price, pc.old_price, pc.change_date,\n" +
        "          coalesce(ar.popularity, 0) as popularity,\n" +
        "          trunc(extract(epoch from now() at time zone 'UTC' - pc.change_date) / 86400) as age_days,\n" +
        "          count(1) OVER() as total\n" +
        "        FROM appstore_app a\n" +
        "        JOIN category_app ca ON a.app_id = ca.app_id\n" +
        "        JOIN category c ON ca.category_id = c.id\n" +
        "        JOIN appstore_price_change pc ON a.app_id = pc.app_id and pc.country_code = 'USA'\n" +
        "        LEFT JOIN app_ranking ar on a.app_id = ar.app_id and ar.country_code = 'USA'\n" +
        "        LEFT JOIN appstore_rating r on a.app_id = r.app_id and r.country_code = 'USA'\n" +
        "        WHERE c.ext_id = $1\n" +
        "        AND pc.price < pc.old_price\n" +
        "        AND coalesce(ar.popularity, 0) >= $2\n" +
        (filters.isFree === true ? "AND pc.price = 0\n" : "") +
        (filters.isIphone === true ? "AND a.is_iphone\n": "") +
        (filters.isIpad === true ? "AND a.is_ipad\n": "") +
        "	     and pc.change_date > now() at time zone 'UTC' - interval '" + maxDays + "' day\n" +
        ") t\n" +
        "ORDER BY log(1 + t.popularity) / power(t.age_days + 1, " + PRICE_DROP_AGE_FACTOR + ") desc, t.release_date desc\n" +
        "LIMIT $3 OFFSET $4";

    var queryParams = [categoryExtId, minPopularity, take, skip];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length === 0) {
            return next(null);
        }

        var apps = result.rows.map(function(item) {
            return {
                extId: item.ext_id,
                name: item.name,
                artworkSmallUrl: item.artwork_small_url,
                price: Math.floor(item.price * 100),
                oldPrice: Math.floor(item.old_price * 100),
                priceChangeDate: item.change_date,
                isIphone: item.is_iphone,
                isIpad: item.is_ipad,
                shortDescription: item.short_description,
                releaseDate: item.release_date,
                userRatingCurrent: item.user_rating_current,
                ratingCountCurrent: item.rating_count_current,
                userRating: item.user_rating,
                ratingCount: item.rating_count,
                popularity: item.popularity,
                ageDays: item.age_days
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
    var queryStr =
        "select t.*\n" +
        "FROM (SELECT unnest(ARRAY[" + categoryIds.join(',') + "]) as id) c\n" +
        "JOIN LATERAL (\n" +
        "SELECT ca.category_id, a.ext_id, a.name, a.artwork_small_url, p.price,\n" +
        "substring(a.description from 0 for 2) as short_description, ca.position\n" +
        "FROM appstore_app a\n" +
        "JOIN appstore_price p ON a.app_id = p.app_id and p.country_code = 'USA'\n" +
        "JOIN category_app ca ON a.app_id = ca.app_id\n" +
        "WHERE ca.category_id = c.id\n" +
        (filters.isFree === true ? "AND p.price = 0\n" : "") +
        (filters.isIphone === true ? "AND a.is_iphone\n" : "") +
        (filters.isIpad === true ? "AND a.is_ipad\n" : "") +
        "ORDER BY ca.category_id, ca.position\n" +
        "limit $1\n" +
        ") t on true;";

    var queryParams = [ take ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        var results = result.rows.map(function(item) {
            return {
                categoryId: item.category_id,
                extId: item.ext_id,
                name: item.name,
                artworkSmallUrl: item.artwork_small_url,
                price: Math.floor(item.price * 100),
                shortDescription: item.short_description,
                position: item.position
            };
        });

        next(null, results);
    });
};

var getCategories = function(client, categoryIds, next) {
    var queryParams = [];
    var params = [];
    categoryIds.forEach(function(categoryId, i) {
        params.push('$'+ (i + 1));
        queryParams.push(categoryId);
    });

    var queryStr =
        "SELECT c.id, c.ext_id, c.name, c.description\n" +
        "FROM category c\n" +
        "WHERE c.id in (" + params.join(',') + ")\n" +
        "ORDER BY c.id;";

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var categories = result.rows.map(function(item) {
            return {
                id: item.id,
                extId: item.ext_id,
                name: item.name,
                description: item.description
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

exports.getCategoryAppsByExtId = function(categoryExtId, filters, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryAppsByExtId(conn.client, categoryExtId, filters, skip, take, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.getCategoryPriceDropAppsByExtId = function(categoryExtId, minPopularity, maxDays, filters, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryPriceDropAppsByExtId(conn.client, categoryExtId, minPopularity, maxDays, filters, skip, take, function(err, result) {
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

exports.getCategories = function(categoryIds, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategories(conn.client, categoryIds, function(err, results) {
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
        "select c.id, c.ext_id, c.name, count(1) OVER() as total\n" +
        "from category c1\n" +
        "join related_category rc on c1.id = rc.category_id\n" +
        "join category c on rc.related_category_id = c.id\n" +
        "where c1.ext_id = $1\n" +
        "and c.date_deleted is null\n" +
        "order by rc.position\n" +
        "LIMIT $2 OFFSET $3";

    var queryParams = [extId, take, skip];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        if (result.rows.length === 0) {
            return next(null);
        }

        var cats = result.rows.map(function(item) {
            return {
                id: item.id,
                extId: item.ext_id,
                name: item.name,
                description: item.description
            };
        });

        var pageResult = {
            total: result.rows[0].total,
            categories: cats
        };

        next(null, pageResult);
    });
};

exports.getRelatedCategoriesByExtId = function(extId, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getRelatedCategoriesByExtId(conn.client, extId, skip, take, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
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

var getPopularPriceDrops = function(client, maxDays, minPopularity, filters, next) {
    var queryStr =
        "select *\n" +
        "from (\n" +
        "	select a.ext_id, a.name, a.artwork_small_url, a.is_iphone, a.is_ipad, a.release_date,\n" +
        "	pc.price, pc.old_price, pc.change_date,\n" +
        "	ar.popularity, r.user_rating, r.rating_count, r.user_rating_current, r.rating_count_current,\n" +
        "   ARRAY(\n" +
        "     select ca.category_id\n" +
        "     from category_app ca\n" +
        "     join category c on ca.category_id = c.id\n" +
        "     where ca.app_id = pc.app_id\n" +
        "     and c.date_deleted is null\n" +
        "   ) as categories,\n" +
        "	trunc(extract(epoch from now() at time zone 'UTC' - pc.change_date) / 86400) as age_days\n" +
        "	FROM appstore_price_change pc\n" +
        "	join app_ranking ar on pc.app_id = ar.app_id and pc.country_code = ar.country_code\n" +
        "	join appstore_rating r on pc.app_id = r.app_id and pc.country_code = r.country_code\n" +
        "	join appstore_app a on pc.app_id = a.app_id\n" +
        "	where pc.country_code = 'USA'\n" +
        (filters.isFree === true ? "AND pc.price = 0\n" : "") +
        (filters.isIphone === true ? "AND a.is_iphone\n": "") +
        (filters.isIpad === true ? "AND a.is_ipad\n": "") +
        "	and pc.price < pc.old_price\n" +
        "	and pc.change_date > now() at time zone 'UTC' - interval '" + maxDays + "' day\n" +
        "	and ar.popularity >= $1\n" +
        ") t\n" +
        "ORDER BY log(1 + t.popularity) / power(t.age_days + 1, " + PRICE_DROP_AGE_FACTOR + ") desc, t.release_date desc";

    var queryParams = [minPopularity];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        var priceDrops = result.rows.map(function(item) {
            return {
                extId: item.ext_id,
                name: item.name,
                artworkSmall: item.artwork_small_url,
                isIphone: item.is_iphone,
                isIpad: item.is_ipad,
                price: item.price,
                oldPrice: item.old_price,
                changeDate: item.change_date,
                ageDays: item.age_days,
                popularity: item.popularity,
                userRating: item.user_rating,
                ratingCount: item.rating_count,
                userRatingCurrent: item.user_rating_current,
                ratingCountCurrent: item.rating_count_current,
                categories: item.categories
            };
        });

        next(null, priceDrops);
    });
};

exports.getPopularPriceDrops = function(maxDays, minPopularity, filters, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getPopularPriceDrops(conn.client, maxDays, minPopularity, filters, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};
