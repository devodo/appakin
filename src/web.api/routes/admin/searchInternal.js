'use strict';

var log = require('../../logger');
var autoIndexer = require('../../domain/search/autoIndexer');
var catIndexer = require('../../domain/search/categoryIndexer');
var appIndexer = require('../../domain/search/appIndexer');

var issueResponseHeaders = function(response) {
    response.setHeader('Connection', 'Transfer-Encoding');
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Transfer-Encoding', 'chunked');
};

var writeResponse = function(response, message) {
    log.debug(message);
    response.write(message + '<br/>');
};

exports.init = function init(app) {
    app.get('/admin/search/auto/rebuild', function (req, res) {
        var appBatchSize = 10000;
        var lastId = 0;

        var outputHandler = function(msg) {
            writeResponse(res, msg);
        };

        issueResponseHeaders(res);
        outputHandler("Starting rebuild of auto complete index");

        autoIndexer.rebuild(lastId, appBatchSize, outputHandler, function(err) {
            if (err) {
                log.err(err);
                outputHandler(JSON.stringify(err));
            }
            else {
                outputHandler("Rebuild completed successfully");
            }

            res.end();
        });
    });

    app.get('/admin/search/cat/rebuild', function (req, res) {
        var numAppDescriptions = 20;

        var outputHandler = function(msg) {
            writeResponse(res, msg);
        };

        issueResponseHeaders(res);
        outputHandler("Starting rebuild of category index");

        catIndexer.rebuild(numAppDescriptions, outputHandler, function(err) {
            if (err) {
                log.err(err);
                outputHandler(JSON.stringify(err));
            }
            else {
                outputHandler("Rebuild completed successfully");
            }

            res.end();
        });
    });

    app.get('/admin/search/app/rebuild', function (req, res) {
        var batchSize = 10000;

        var outputHandler = function(msg) {
            writeResponse(res, msg);
        };

        issueResponseHeaders(res);
        outputHandler("Starting rebuild of app index");

        appIndexer.rebuild(batchSize, outputHandler, function(err) {
            if (err) {
                log.err(err);
                outputHandler(JSON.stringify(err));
            }
            else {
                outputHandler("Rebuild completed successfully");
            }

            res.end();
        });
    });
};
