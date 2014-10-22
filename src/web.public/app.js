'use strict';

var express = require('express');
var path = require('path');
var logger = require('express-bunyan-logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var log = require('./logger');
var routes = require('./routes/index');
var config = require('./config');

// ================================

var app = module.exports = express();
configureApp(app);
config.environment !== 'production' && app.use(logger({logger: log}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
initStaticRoutes(app);
app.use(notFoundHandler);
app.use(logger.errorLogger({logger: log}));
app.use(notFoundErrorHandler);
app.use(serverErrorHandler);

log.info("Started web.public site");

// ================================

function configureApp(app) {
    app.disable('etag'); // TODO: why is this not working?
	app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');
	
	// TODO: test this on linux.
    process.on('SIGTERM', function() {
        console.log('Got SIGTERM.');
	    // TODO: add shutdown code.
        process.exit(0);
    });
}

function initStaticRoutes(app) {
    if (config.environment !== 'development') { 
	    return;
    }

	app.use('/images', express.static(path.join(__dirname, 'public/images')));
	app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));

    app.use('/scripts', express.static(path.join(__dirname, 'public-generated/public/scripts')));
    app.use('/scripts', express.static(path.join(__dirname, 'public/scripts')));

    app.use('/stylesheets',express.static(path.join(__dirname, 'public-generated/public/stylesheets')));
    app.use('/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')));

    app.use('/templates', express.static(path.join(__dirname, 'public/templates')));
    app.use('/templates', express.static(path.join(__dirname, 'public/scripts')));
    app.use('/bower_components', express.static(path.join(__dirname, 'bower_components')));
	app.use('*', routes);
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
	
	if (req.xhr) {
		res.send(err.message || '404');
	} else {
        res.send(err.message || '404'); // TODO: change to page.
	}
}

function serverErrorHandler(err, req, res, next) {
    if (req.xhr) {
		res.send(err.status || 500, {error: err.message});
	} else {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: config.environment === 'production' ? {} : err
        });
	}
}
