'use strict';

var log = require('../../logger');
var appStoreAdminRepo = require("../../repos/appStoreAdminRepo");

exports.init = function init(app) {
    //app.post('/admin/search/cat/exclude_app', function (req, res) {
    //    var categoryExtId = req.body.categoryExtId;
    //    var appExtId = req.body.appExtId;
    //
    //    log.debug("Excluding app " + appExtId + " from category " + categoryExtId);
    //
    //    appStoreAdminRepo.insertCategoryAppExclude(categoryExtId, appExtId, function(err) {
    //        if (err) {
    //            return res.status(500).json(err);
    //        }
    //
    //        res.json({status: 'success'});
    //    });
    //});
};
