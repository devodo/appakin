"use strict";
var connection = require('./connection');

var APP_STORE_ID = 1;

var auditAppStoreReferral = function(client, audit, next) {
    var queryStr =
        "INSERT INTO referral_audit(store_id, app_id, category_id, category_app_id, ip, user_id,\n" +
        "store_url, country_code, user_agent, refer, campaign_tracking, date_created)\n" +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var queryParams = [
        APP_STORE_ID,
        audit.appId,
        audit.catId,
        audit.catAppId,
        audit.ip,
        audit.userId,
        audit.storeUrl,
        audit.countryCode,
        audit.userAgent,
        audit.refer,
        audit.campaignTracking
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var getLastAppStoreRefresh = function(client, next) {
    var queryStr =
        "select ara.id, ara.last_app_id, ara.is_success, ara.error_message, ara.date_created\n" +
        "from appstore_refresh_audit ara\n" +
        "join(\n" +
        "    select max(id) as id\n" +
        "FROM appstore_refresh_audit\n" +
        "where is_success\n" +
        ") t on ara.id = t.id;";

    client.query(queryStr, function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length === 0) {
            return next();
        }

        var item = result.rows[0];
        var audit = {
                id: item.id,
                lastAppId: item.last_app_id,
                dateCreated: item.date_created
            };

        next(null, audit);
    });
};

var auditAppStoreRefresh = function(client, audit, next) {
    var queryStr =
        "INSERT INTO appstore_refresh_audit(last_app_id, is_success, error_message, date_created)\n" +
        "VALUES ($1, $2, $3, NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var queryParams = [
        audit.lastAppId,
        audit.isSuccess,
        audit.errorMessage
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

var getLastAppStoreSourceRefresh = function(client, next) {
    var queryStr =
        "SELECT id, appstore_category_id, letter\n" +
        "FROM appstore_src_refresh_audit\n" +
        "where is_success\n" +
        "order by id desc\n" +
        "limit 1;";

    client.query(queryStr, function (err, result) {
        if (err) {
            return next(err);
        }

        if (result.rows.length === 0) {
            return next();
        }

        var item = result.rows[0];
        var audit = {
            id: item.id,
            appstoreCategoryId: item.appstore_category_id,
            letter: item.letter
        };

        next(null, audit);
    });
};

var auditAppStoreSourceRefresh = function(client, audit, next) {
    var queryStr =
        "INSERT INTO appstore_src_refresh_audit(appstore_category_id, letter, is_success, new_apps, error_message, date_created)\n" +
        "VALUES ($1, $2, $3, $4, $5, NOW() at time zone 'utc')\n" +
        "RETURNING id;";

    var queryParams = [
        audit.appstoreCategoryId,
        audit.letter,
        audit.isSuccess,
        audit.newApps,
        audit.errorMessage
    ];

    client.query(queryStr, queryParams, function (err, result) {
        if (err) {
            return next(err);
        }

        next(null, result.rows[0].id);
    });
};

exports.auditAppStoreReferral = function(audit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        auditAppStoreReferral(conn.client, audit, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};

exports.getLastAppStoreRefresh = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getLastAppStoreRefresh(conn.client, function(err, audit) {
            conn.close(err, function(err) {
                next(err, audit);
            });
        });
    });
};

exports.auditAppStoreRefresh = function(audit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        auditAppStoreRefresh(conn.client, audit, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};

exports.getLastAppStoreSourceRefresh = function(next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        getLastAppStoreSourceRefresh(conn.client, function(err, audit) {
            conn.close(err, function(err) {
                next(err, audit);
            });
        });
    });
};

exports.auditAppStoreSourceRefresh = function(audit, next) {
    connection.open(function(err, conn) {
        if (err) {
            return next(err);
        }

        auditAppStoreSourceRefresh(conn.client, audit, function(err, id) {
            conn.close(err, function(err) {
                next(err, id);
            });
        });
    });
};
