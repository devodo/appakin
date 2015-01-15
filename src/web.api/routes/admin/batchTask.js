'use strict';

var prettyHrtime = require('pretty-hrtime');
var log = require('../../logger');
var batchTask = require('../../domain/admin/batchTask');

exports.init = function init(app) {
    app.post('/admin/task/rebuild_all', function (req, res, next) {
        log.info("Starting rebuild all batch task");
        var start = process.hrtime();
        batchTask.rebuildAll(function(err) {
            if (err) { return next(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild all batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "rebuild all task started" });
    });
};

