'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var wrench = require('wrench');
var solr = require('solr-client');
var config = require('../config');
var log = require('../logger');

var ROOT_PATH = config.solr.rootPath;
var TEMP_CORE_PREFIX = config.solr.tempCorePrefix;
var CORES_DIR = "cores";
var TEMPLATE_DIR = "templates";

var solrAdminClient = solr.createClient(config.solr.host, config.solr.port, 'admin');

var createCore = function (coreName, instanceDir, next) {
    log.info("Creating core: " + coreName);

    var endpoint = "action=CREATE&name=" + coreName + "&instanceDir=" + instanceDir;
    solrAdminClient.get('cores', endpoint, function (err, obj) {
        if (err) { return next(err); }

        next(null, obj);
    });
};

var unloadCore = function(deleteInstance, coreName, next) {
    log.info("Unloading core: " + coreName + " (" + deleteInstance + ")");

    var endpoint = "action=UNLOAD&core=" + coreName + (deleteInstance ? "&deleteInstanceDir=true" : "");
    solrAdminClient.get('cores', endpoint, function (err, obj) {
        if (err) { return next(err); }

        next(null, obj);
    });
};

exports.init = function init(app) {
    app.post('/solr/admin/create_temp_core', function (req, res, next) {
        var coreName = req.body.coreName;

        if (!coreName || coreName === '') {
            return res.status(400).send('Must supply coreName parameter');
        }

        var timestamp = (new Date()).getTime();
        var templateDir = ROOT_PATH + path.sep + TEMPLATE_DIR + path.sep + coreName;
        var coreDir = ROOT_PATH + path.sep + CORES_DIR + path.sep + coreName;
        var tempInstanceDir = coreDir + path.sep + timestamp;

        fs.exists(coreDir, function(exists) {
            if (!exists) {
                wrench.mkdirSyncRecursive(coreDir);
            }

            wrench.copyDirRecursive(templateDir, tempInstanceDir, function(err) {
                if (err) { return next(err); }

                var tempCoreName = TEMP_CORE_PREFIX + coreName + "_" + timestamp;
                createCore(tempCoreName, tempInstanceDir, function(err) {
                    if (err) { return next(err); }

                    res.json({ tempCoreName: tempCoreName });
                });
            });
        });
    });

    app.post('/solr/admin/clean_temp_cores', function (req, res, next) {
        var endpoint = "action=STATUS";
        solrAdminClient.get('cores', endpoint, function (err, obj) {
            if (err) { return next(err); }

            var cores = Object.keys(obj.status).filter(function(core) {
                return core.indexOf(TEMP_CORE_PREFIX) === 0;
            });

            var processCore = function(core, callback) {
                unloadCore(true, core, function(err) {
                    callback(err);
                });
            };

            async.eachSeries(cores, processCore, function(err) {
                if (err) { return next(err); }

                res.json({ unloadedCores: cores });
            });
        });
    });
};
