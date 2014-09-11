'use strict';

var autoIndexer = require('../../domain/search/autoIndexer');
var catIndexer = require('../../domain/search/categoryIndexer');

exports.init = function init(app) {
    app.get('/admin/search/rebuild_auto', function (req, res) {
        var appBatchSize = 10000;
        var lastId = 0;

        res.contentType("text/plain; charset=UTF-8");
        res.write("Starting rebuild of auto complete index\n");

        var outputHandler = function(msg) {
            res.write(msg + '\n');
        };

        autoIndexer.rebuild(lastId, appBatchSize, outputHandler, function(err) {
            if (err) {
                res.write(JSON.stringify(err));
            }
            else {
                res.write("Rebuild completed successfully\n");
            }

            res.end();
        });
    });

    app.get('/admin/search/rebuild_cat', function (req, res) {
        var numAppDescriptions = 20;

        res.contentType("text/plain; charset=UTF-8");
        res.write("Starting rebuild of category index\n");

        var outputHandler = function(msg) {
            res.write(msg + '\n');
        };

        catIndexer.rebuild(numAppDescriptions, outputHandler, function(err) {
            if (err) {
                res.write(JSON.stringify(err));
            }
            else {
                res.write("Rebuild completed successfully\n");
            }

            res.end();
        });
    });
};
