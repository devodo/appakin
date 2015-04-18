'use strict';

var express = require('express');
var path = require('path');
var expressWinston = require('express-winston');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('cors');
var http = require('http');
var fs = require('fs');
var log = require('./logger');
var config = require('./config');
var S = require('string');
var argv = require('yargs').argv;

// ================================

var app = module.exports = express();
configureApp(app);

if (config.environment !== 'production') {
    app.use(expressWinston.logger({
        winstonInstance: log,
        meta: true, // optional: control whether you want to log the meta data about the request (default to true)
        msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
        expressFormat: true, // Use the default Express/morgan request formatting, with the same colors. Enabling this will override any msg and colorStatus if true. Will only output colors on transports with colorize set to true
        colorStatus: true // Color the status code, using the Express/morgan color palette (default green, 3XX cyan, 4XX yellow, 5XX red). Will not be recognized if expressFormat is true
    }));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
configureCors(app);
initApiRoutes(app);
app.use(notFoundHandler);

app.use(expressWinston.errorLogger({
    winstonInstance: log,
    level: "error"
}));

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

    http.globalAgent.maxSockets = 500; // set this high, if you use httpClient or request anywhere (defaults to 5)

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

    app.set('trust proxy', function (ip) {
        // trusted IPs
        if (ip === '127.0.0.1') {
            return true;
        }

        return false;
    });

    app.set('etag', false);
    app.set('x-powered-by', false);
}

function configureCors(app) {
    var corsOptions = {
        origin: config.environment === 'production' && !argv.no-cors ? 'http://www.appakin.com' : true
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

    res.status(404).json({error: err.message || '404'});
}

function serverErrorHandler(err, req, res, next) {
    log.error(err);

    var error = {
      error: "server error"
    };

    if (config.server.returnErrorDetail) {
        error.detail = err;
    }

    res.status(err.status || 500).json(error);
}
