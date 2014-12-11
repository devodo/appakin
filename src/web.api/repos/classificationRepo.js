"use strict";
var async = require('async');
var connection = require('./connection');

var getTrainingSet = function(client, seedCategoryId, next) {
    var queryStr =
        "SELECT id, app_ext_id, include\n" +
        "FROM seed_training\n" +
        "WHERE seed_category_id = $1\n" +
        "ORDER BY id";

    var queryParams = [ seedCategoryId ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                appExtId: item.app_ext_id,
                include: item.include
            };
        });

        return next(null, items);
    });
};

var getCategoryAppsAsTrainingSet = function(client, categoryId, next) {
    var queryStr =
        "SELECT ca.id, a.ext_id, true as include\n" +
        "FROM category_app ca\n" +
        "JOIN appstore_app a on ca.app_id = a.app_id\n" +
        "where ca.category_id = $1\n" +
        "and a.date_deleted is null\n" +
        "order by ca.position;";

    var queryParams = [ categoryId ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                appExtId: item.ext_id,
                include: item.include
            };
        });

        return next(null, items);
    });
};

var deleteClassificationApps = function(client, seedCategoryId, next) {
    var queryStr =
        "DELETE FROM seed_classification_app\n" +
        "WHERE seed_category_id = $1";

    client.query(queryStr, [seedCategoryId], function (err) {
        if (err) {
            return next(err);
        }

        return next(null);
    });
};

var insertClassificationApp = function(client, seedCategoryId, classificationResult, next) {
    var queryStr =
        "INSERT INTO seed_classification_app(seed_category_id, app_ext_id, include, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, NOW() at time zone 'utc', NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var queryParams = [
        seedCategoryId,
        classificationResult.id,
        classificationResult.result
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var setClassificationApps = function(conn, classificationResults, seedCategoryId, next) {
    var insertResult = function(classificationResult, callback) {
        insertClassificationApp(conn.client, seedCategoryId, classificationResult, function(err) {
            return callback(err);
        });
    };

    conn.beginTran(function(err) {
        if (err) {
            return next(err);
        }

        deleteClassificationApps(conn.client, seedCategoryId, function(err) {
            if (err) { return next(err); }

            async.eachSeries(classificationResults, insertResult, function(err) {
                if (err) { return next(err); }

                conn.commitTran(function(err) {
                    if (err) { return next(err); }

                    return next(null);
                });
            });
        });
    });
};

var getClassificationApps = function(client, seedCategoryId, isInclude, skip, take, next) {
    var queryStr =
        "SELECT a.ext_id, a.name, a.description, a.dev_name, a.store_url, a.release_date, a.genres,\n" +
        "a.user_rating_current, a.rating_count_current, a.user_rating,\n" +
        "a.rating_count, a.screenshot_urls, a.ipad_screenshot_urls, ap.popularity, sca.include\n" +
        "from appstore_app a\n" +
        "join seed_classification_app sca on a.ext_id = sca.app_ext_id\n" +
        "left join app_popularity ap on a.app_id = ap.app_id\n" +
        "left join seed_training st on sca.seed_category_id = st.seed_category_id and a.ext_id = st.app_ext_id\n" +
        "where sca.seed_category_id = $1\n" +
        "and st.id is null\n" +
        "and sca.include = $2\n" +
        "order by coalesce(ap.popularity,0) desc\n" +
        "offset $3 limit $4;";

    var queryParams = [
        seedCategoryId,
        isInclude,
        skip,
        take
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                extId: item.ext_id.replace(/\-/g, ''),
                name: item.name,
                description: item.description,
                devName: item.dev_name,
                storeUrl: item.store_url,
                releaseDate: item.release_date,
                genres: item.genres,
                userRatingCurrent: item.user_rating_current,
                ratingCountCurrent: item.rating_count_current,
                userRating: item.user_rating,
                ratingCount: item.rating_count,
                screenshotUrls: item.screenshot_urls,
                ipadScreenshotUrls: item.ipad_screenshot_urls,
                popularity: item.popularity,
                include: item.include
            };
        });

        return next(null, items);
    });
};

var insertSeedTraining = function(client, seedCategoryId, appExtId, isIncluded, next) {
    var queryStr =
        "INSERT INTO seed_training(seed_category_id, app_ext_id, include, date_created)\n" +
        "VALUES ($1, $2, $3, NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var queryParams = [
        seedCategoryId,
        appExtId,
        isIncluded
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var deleteSeedTraining = function(client, seedCategoryId, appExtId, next) {
    var queryStr =
        "DELETE FROM seed_training\n" +
        "WHERE seed_category_id = $1\n" +
        "AND app_ext_id = $2;";

    var queryParams = [
        seedCategoryId,
        appExtId
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        next(null);
    });
};

var getActiveSeedCategories = function(client, next) {
    var queryStr =
        "SELECT id, ext_id, name, description, build_version, date_created, date_modified\n" +
        "FROM seed_category\n" +
        "WHERE date_deleted is null\n" +
        "AND is_active\n" +
        "ORDER BY id;";

    client.query(queryStr, function (err, result) {
        if (err) {
            return next(err);
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                extId: item.ext_id,
                name: item.name,
                description: item.description,
                dateCreated: item.date_created,
                dateModified: item.date_modified,
                buildVersion: item.build_version
            };
        });

        next(null, items);
    });
};

var getSeedCategory = function(client, seedCategoryId, next) {
    var queryStr =
        "SELECT id, ext_id, name, description, is_active, build_version, date_created, date_modified, date_deleted\n" +
        "FROM seed_category\n" +
        "WHERE id = $1;";

    client.query(queryStr, [seedCategoryId], function (err, result) {
        if (err) { return next(err); }

        if (result.rows.length === 0) {
            return next(null, null);
        }

        var item = result.rows[0];
        var seedCategory = {
            id: item.id,
            extId: item.ext_id,
            name: item.name,
            description: item.description,
            isActive: item.is_active,
            buildVersion: item.build_version,
            dateCreated: item.date_created,
            dateModified: item.date_modified,
            dateDeleted: item.date_deleted
        };

        next(null, seedCategory);
    });
};

var deleteSeedCategoryApps = function(client, seedCategoryId, next) {
    var queryStr =
        "DELETE FROM seed_category_app\n" +
        "WHERE seed_category_id = $1;";

    client.query(queryStr, [seedCategoryId], function (err) {
        if (err) { return next(err); }

        return next();
    });
};

var insertSeedCategoryApps = function(client, seedCategoryId, appExtIds, next) {
    var params = [];
    for(var i = 2; i <= appExtIds.length + 1; i++) {
        params.push('$'+i);
    }

    var queryStr =
        "INSERT INTO seed_category_app(seed_category_id, app_id, position, date_created)\n" +
        "SELECT $1, a.app_id, row_number() OVER (ORDER BY coalesce(ap.popularity, 0) DESC, a.release_date DESC), NOW() at time zone 'utc'\n" +
        "FROM appstore_app a\n" +
        "LEFT JOIN app_popularity ap on a.app_id = ap.app_id\n" +
        "WHERE a.ext_id in (" + params.join(',') + ");";

    var queryParams = [seedCategoryId];
    appExtIds.forEach(function(extId) {
        queryParams.push(extId);
    });

    client.query(queryStr, queryParams, function (err) {
        if (err) { return next(err); }

        return next();
    });
};

var getSeedCategoryApps = function(client, seedCategoryId, next) {
    var queryStr =
        "SELECT id, seed_category_id, app_id, position, date_created\n" +
        "FROM seed_category_app\n" +
        "WHERE seed_category_id = $1\n" +
        "ORDER BY position;";

    client.query(queryStr, [seedCategoryId], function (err, result) {
        if (err) { return next(err); }

        if (result.rows.length === 0) {
            return (next(null));
        }

        var items = result.rows.map(function(item) {
            return {
                id: item.id,
                seedCategoryId: item.seed_category_id,
                appId: item.app_id,
                position: item.position,
                dateCreated: item.date_created
            };
        });

        next(null, items);
    });
};

var getSeedCategoryMap = function(client, seedCategoryId, next) {
    var queryStr =
        "SELECT id, category_id, seed_category_id, build_version\n" +
        "FROM seed_category_map\n" +
        "WHERE seed_category_id = $1;";

    client.query(queryStr, [seedCategoryId], function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length === 0) {
            return (next(null));
        }

        var item = result.rows[0];
        var seedCateogoryMap = {
            id: item.id,
            categoryId: item.category_id,
            seedCategoryId: item.seed_category_id,
            buildVersion: item.build_version
        };

        next(null, seedCateogoryMap);
    });
};

var insertCategoryFromSeed = function(client, seedCategory, next) {
    var queryStr =
        "INSERT INTO category(ext_id, name, description, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, NOW() at time zone 'utc', NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var queryParams = [
        seedCategory.extId,
        seedCategory.name,
        seedCategory.description
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        next(null, result.rows[0].id);
    });
};

var insertCategoryApp = function(client, categoryId, seedCategoryApp, next) {
    var queryStr =
        "INSERT INTO category_app(category_id, app_id, position, date_created, old_position)\n" +
        "VALUES ($1, $2, $3, NOW() at time zone 'utc', $3)\n" +
        "RETURNING id;";

    var queryParams = [
        categoryId,
        seedCategoryApp.appId,
        seedCategoryApp.position
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        next(null, result.rows[0].id);
    });
};

var insertSeedCategoryMap = function(client, categoryId, seedCategoryId, buildVersion, next) {
    var queryStr =
        "INSERT INTO seed_category_map(category_id, seed_category_id, build_version)\n" +
        "VALUES ($1, $2, $3)\n" +
        "RETURNING id;";

    var queryParams = [
        categoryId,
        seedCategoryId,
        buildVersion
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) { return next(err); }

        next(null, result.rows[0].id);
    });
};

var createCategoryFromSeed = function(conn, seedCategory, seedCategoryApps, next) {
    conn.beginTran(function(err) {
        if (err) { return next(err); }

        insertCategoryFromSeed(conn.client, seedCategory, function(err, categoryId) {
            if (err) { return next(err); }

            insertSeedCategoryMap(conn.client, categoryId, seedCategory.id, seedCategory.buildVersion, function(err) {
                if (err) { return next(err); }

                async.eachSeries(seedCategoryApps, function(seedCategoryApp, callback) {
                    insertCategoryApp(conn.client, categoryId, seedCategoryApp, function(err) {
                        return callback(err);
                    });
                }, function(err) {
                    if (err) { return next(err); }

                    conn.commitTran(function(err) {
                        if (err) {return next(err);}

                        return next();
                    });
                });
            });
        });
    });
};

var deleteCategoryApps = function(client, categoryId, next) {
    var queryStr =
        "DELETE FROM category_app\n" +
        "WHERE category_id = $1;";

    client.query(queryStr, [categoryId], function (err) {
        if (err) { return next(err); }

        return next();
    });
};

var updateSeedCategoryMapBuildVersion = function(client, seedCategoryMapId, buildVersion, next) {
    var queryStr =
        "UPDATE seed_category_map\n" +
        "SET build_version = $2" +
        "WHERE id = $1;";

    client.query(queryStr, [seedCategoryMapId, buildVersion], function (err) {
        if (err) { return next(err); }

        return next();
    });
};

var resetCategoryFromSeed = function(conn, seedCategory, seedCategoryMap, seedCategoryApps, next) {
    conn.beginTran(function(err) {
        if (err) { return next(err); }

        updateSeedCategoryMapBuildVersion(conn.client, seedCategoryMap.id, seedCategory.buildVersion, function(err) {
            if (err) { return next(err); }

            deleteCategoryApps(conn.client, seedCategoryMap.categoryId, function(err) {
                if (err) { return next(err); }

                async.eachSeries(seedCategoryApps, function(seedCategoryApp, callback) {
                    insertCategoryApp(conn.client, seedCategoryMap.categoryId, seedCategoryApp, function(err) {
                        return callback(err);
                    });
                }, function(err) {
                    if (err) { return next(err); }

                    conn.commitTran(function(err) {
                        if (err) {return next(err);}

                        return next();
                    });
                });
            });
        });
    });
};

var setSeedCategorySuccessfulBuild = function(client, seedCategoryId, next) {
    var queryStr =
        "UPDATE seed_category\n" +
        "SET build_version = coalesce(build_version, 0) + 1,\n" +
        "build_message = 'success'\n" +
        "WHERE id = $1;";

    client.query(queryStr, [seedCategoryId], function (err) {
        if (err) { return next(err); }

        next();
    });
};

var updateSeedCategoryBuildMessage = function(client, seedCategoryId, message, next) {
    var queryStr =
        "UPDATE seed_category\n" +
        "SET build_message = $2\n" +
        "WHERE id = $1;";

    client.query(queryStr, [seedCategoryId, message], function (err) {
        if (err) { return next(err); }

        next();
    });
};

var resetSeedCategoryApps = function(conn, seedCategoryId, appExtIds, next) {
    conn.beginTran(function(err) {
        if (err) { return next(err); }

        deleteSeedCategoryApps(conn.client, seedCategoryId, function(err) {
            if (err) { return next(err); }

            insertSeedCategoryApps(conn.client, seedCategoryId, appExtIds, function(err) {
                if (err) { return next(err); }

                setSeedCategorySuccessfulBuild(conn.client, seedCategoryId, function(err) {
                    if (err) { return next(err); }

                    conn.commitTran(function(err) {
                        if (err) {return next(err);}

                        return next();
                    });
                });
            });
        });
    });
};

exports.getTrainingSet = function(seedCategoryId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getTrainingSet(conn.client, seedCategoryId, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};

exports.getCategoryAppsAsTrainingSet = function(categoryId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getCategoryAppsAsTrainingSet(conn.client, categoryId, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};

exports.setClassificationApps = function(classificationResults, seedCategoryId, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        setClassificationApps(conn, classificationResults, seedCategoryId, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};

exports.getClassificationApps = function(seedCategoryId, isInclude, skip, take, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getClassificationApps(conn.client, seedCategoryId, isInclude, skip, take, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};

exports.insertSeedTraining = function(seedCategoryId, appExtId, isIncluded, next)  {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        insertSeedTraining(conn.client, seedCategoryId, appExtId, isIncluded, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};

exports.deleteSeedTraining = function(seedCategoryId, appExtId, next)  {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        deleteSeedTraining(conn.client, seedCategoryId, appExtId, function(err) {
            conn.close(err, function(err) {
                next(err);
            });
        });
    });
};

exports.getActiveSeedCategories = function(next)  {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getActiveSeedCategories(conn.client, function(err, items) {
            conn.close(err, function(err) {
                next(err, items);
            });
        });
    });
};

exports.getSeedCategory = function(seedCategoryId, next)  {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getSeedCategory(conn.client, seedCategoryId, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.resetSeedCategoryApps = function(seedCategoryId, appExtIds, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        resetSeedCategoryApps(conn, seedCategoryId, appExtIds, function(err) {
            conn.close(err, function(err) {
                next(err);
            });
        });
    });
};

exports.getSeedCategoryApps = function(seedCategoryId, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getSeedCategoryApps(conn.client, seedCategoryId, function(err, results) {
            conn.close(err, function(err) {
                next(err, results);
            });
        });
    });
};

exports.getSeedCategoryMap = function(seedCategoryId, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        getSeedCategoryMap(conn.client, seedCategoryId, function(err, result) {
            conn.close(err, function(err) {
                next(err, result);
            });
        });
    });
};

exports.createCategoryFromSeed = function(seedCategory, seedCategoryApps, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        createCategoryFromSeed(conn, seedCategory, seedCategoryApps, function(err) {
            conn.close(err, function(err) {
                next(err);
            });
        });
    });
};

exports.resetCategoryFromSeed = function(seedCategory, seedCategoryMap, seedCategoryApps, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        resetCategoryFromSeed(conn, seedCategory, seedCategoryMap, seedCategoryApps, function(err) {
            conn.close(err, function(err) {
                next(err);
            });
        });
    });
};

exports.updateSeedCategoryBuildMessage = function(seedCategoryId, message, next) {
    connection.open(function(err, conn) {
        if (err) { return next(err); }

        updateSeedCategoryBuildMessage(conn.client, seedCategoryId, message, function(err) {
            conn.close(err, function(err) {
                next(err);
            });
        });
    });
};




