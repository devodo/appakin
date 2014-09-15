"use strict";
var connection = require('./connection');

var insertXyoCategory = function(client, category, next) {
    var queryStr =
        "INSERT INTO xyo_category(" +
        "name, link_text, description, url, date_created, date_modified)\n" +
        "VALUES ($1, $2, $3, $4, NOW(), NOW())\n" +
        "RETURNING id;";

    var queryParams = [
        category.name,
        category.linkText,
        category.description,
        category.url
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var insertXyoCategoryLink = function(client, batchId, categoryId, linkUrl, position, next) {
    var queryStr =
        "INSERT INTO xyo_category_link(xyo_category_id, batch_id, link_url, position, date_created)\n" +
        "VALUES ($1, $2, $3, $4, NOW())\n" +
        "RETURNING id;";

    var queryParams = [
        categoryId,
        batchId,
        linkUrl,
        position
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var getXyoCategories = function(client, next) {
    var queryStr =
        "SELECT id, name, link_text, description, url, date_created, date_modified\n" +
        "FROM xyo_category\n" +
        "order by id;";

    client.query(queryStr, function (err, result) {
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

var getXyoCategoriesMissingApps = function(client, batchId, next) {
    var queryStr =
        "SELECT xc.id, xc.name, xc.link_text, xc.description, xc.url, xc.date_created, xc.date_modified\n" +
        "FROM xyo_category xc\n" +
        "WHERE xc.id NOT IN(\n" +
        "SELECT DISTINCT xyo_category_id\n" +
        "FROM xyo_category_app\n" +
        "WHERE batch_id = $1)\n" +
        "order by xc.id;";

    client.query(queryStr, [batchId], function (err, result) {
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

var insertXyoCategoryApp = function(client, xyoCategoryId, batchId, name, position, next) {
    var queryStr =
        "INSERT INTO xyo_category_app(" +
        "xyo_category_id, batch_id, name, position, date_created)\n" +
        "VALUES ($1, $2, $3, $4, NOW())\n" +
        "RETURNING id;";

    var queryParams = [
        xyoCategoryId,
        batchId,
        name,
        position
    ];

    client.query(queryStr, queryParams, function (err, id) {
        if (err) {
            return next(err);
        }

        next(null, id);
    });
};

exports.insertXyoCategory = function(category, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertXyoCategory(conn.client, category, function(err, id) {
            conn.close(err, function(err) {
                if (connection.isUniqueViolation(err)) {
                    return next(null, -1);
                }

                next(err, id);
            });
        });
    });
};

exports.insertXyoCategoryLink = function(batchId, categoryId, linkUrl, position, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertXyoCategoryLink(conn.client, batchId, categoryId, linkUrl, position, function(err, id) {
            conn.close(err, function(err) {
                conn.close(err, function(err) {
                    next(err, id);
                });
            });
        });
    });
};

exports.getXyoCategories = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getXyoCategories(conn.client, function(err, categories) {
            conn.close(err, function(err) {
                next(err, categories);
            });
        });
    });
};

exports.getXyoCategoriesMissingApps = function(batchId, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getXyoCategoriesMissingApps(conn.client, batchId, function(err, categories) {
            conn.close(err, function(err) {
                next(err, categories);
            });
        });
    });
};

exports.insertXyoCategoryApp = function(categoryId, batchId, name, position, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        insertXyoCategoryApp(conn.client, categoryId, batchId, name, position, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};
