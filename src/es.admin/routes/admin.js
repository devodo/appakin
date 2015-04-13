'use strict';

var prettyHrtime = require('pretty-hrtime');
var appIndexer = require('../elasticsearch/appIndexer');
var log = require('../logger');

exports.init = function init(app) {
    app.post('/index/app/rebuild', function (req, res, next) {
        var batchSize = req.body.batchSize;
        if (!batchSize || isNaN(batchSize)) {
            return res.status(400).send('Bad seedCategoryId parameter');
        }

        log.info("Starting rebuild app index batch task");
        var start = process.hrtime();
        appIndexer.rebuild(batchSize, function(err) {
            if (err) { return log.error(err); }

            var end = process.hrtime(start);
            log.info("Completed rebuild app index batch task in: " + prettyHrtime(end));
        });

        res.json({ "status": "Rebuild app index task started" });
    });
};
