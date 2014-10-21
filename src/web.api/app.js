'use strict';

var express = require('express');
var path = require('path');
var logger = require('express-bunyan-logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var fs = require('fs');
var log = require('./logger');
var config = require('./config');
var S = require('string');

// ================================

var app = module.exports = express();
configureApp(app);

if (config.environment !== 'production') {
    app.use(logger({logger: log}));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
configureCors(app);
initApiRoutes(app);
app.use(notFoundHandler);
app.use(logger.errorLogger({logger: log}));
app.use(notFoundErrorHandler);
app.use(serverErrorHandler);

// ================================

function configureApp(app) {
    // Allow error types to be json stringified
    var config = {
        configurable: true,
        value: function() {
            var alt = {};
            var storeKey = function(key) {
                alt[key] = this[key];
            };
            Object.getOwnPropertyNames(this).forEach(storeKey, this);
            return alt;
        }
    };
    Object.defineProperty(Error.prototype, 'toJSON', config);

    // TODO: test this on linux.
    process.on('SIGTERM', function() {
        console.log('Got SIGTERM.');
        // TODO: add shutdown code.
        process.exit(0);
    });

    app.use(function(req, res, next) {
        res.contentType("application/json; charset=UTF-8");
        next();
    });
}

function configureCors(app) {
    var corsOptions = {
        origin: config.environment === 'production' ? 'http://www.appakin.com' : true
    };

    app.use(cors(corsOptions));          // for regular requests
    app.options('*', cors(corsOptions)); // for preflight requests
}

function initApiRoutes(app) {
    var getFilesSync = function(dir, recurse) {
        var results = [];
        var list = fs.readdirSync(dir);

        list.forEach(function(file) {
            file = dir + '/' + file;
            var stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                if (recurse) {
                    var res = getFilesSync(file, recurse);
                    results = results.concat(res);
                }
            } else {
                results.push(file);
            }
        });

        return results;
    };

    var isRouteFile = function(filePath) {
        var isValid = S(filePath.toLowerCase()).endsWith('.js');
        return isValid;
    };

    var apiDir = path.resolve(__dirname, 'routes');
    var files = getFilesSync(apiDir, true);

    files.forEach(function (file) {
        var filePath = path.resolve(apiDir, file);
        if (isRouteFile(filePath)) {
            var route = require(filePath);
            route.init(app);
        }
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
