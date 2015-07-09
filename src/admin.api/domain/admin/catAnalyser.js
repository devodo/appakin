'use strict';

var appStoreAdminRepo = require('../../repos/appStoreAdminRepo');

var resetRelated = function(next) {
    appStoreAdminRepo.getCategoryApps(function(err, apps) {
        if (err) { return next(err); }

        var categories = [];
        var currentCategory = null;

        apps.forEach(function(app) {
            if (categories.length === 0 || categories[categories.length - 1].id !== app.categoryId) {
                console.log("test");
            }
        });

    });
};

exports.resetRelated = resetRelated;

