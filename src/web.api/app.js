'use strict';

var express = require('express');
var path = require('path');
var logger = require('express-bunyan-logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var log = require('./logger');
var config = require('./config');

// ================================

var app = module.exports = express();
configureApp(app);
config.environment !== 'production' && app.use(logger({logger: log}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
initApiRoutes(app);
app.use(notFoundHandler);
app.use(logger.errorLogger({logger: log}));
app.use(notFoundErrorHandler);
app.use(serverErrorHandler);
log.info("Started Web site");

// ================================

function configureApp(app) {
	// TODO: test this on linux.
    process.on('SIGTERM', function() {
        console.log('Got SIGTERM.');
	    // TODO: add shutdown code.
        process.exit(0);
    });
}

function initApiRoutes(app) {
    var apiDir = path.resolve(__dirname, 'routes');
    var files = fs.readdirSync(apiDir);

    files.forEach(function (file) {
        var filePath = path.resolve(apiDir, file);
        var route = require(filePath);
        route.init(app);
    });
}

function notFoundHandler(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
}

function notFoundErrorHandler(err, req, res, next) {
    if (err.status !== 404) {
	    return next(err);
	}
	
	res.status(404);
	res.send(err.message || '404');
}

function serverErrorHandler(err, req, res, next) {
    res.send(err.status || 500, {error: err.message});
}
