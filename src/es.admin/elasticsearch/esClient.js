'use strict';

var config = require('../config');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: config.es.host + ':' + config.es.port,
    log: 'error',
    maxSockets: config.es.maxSockets
});

exports.bulkInsert = function (index, docType, docs, next) {
    var body = [];

    docs.forEach(function(doc) {
        var insertAction = { index:  { _type: docType, _id: doc.id } };
        var docBody = doc.body;
        body.push(insertAction);
        body.push(docBody);
    });

    client.bulk({
        body: body,
        index: index
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.optimize = function(index, next) {
    client.indices.optimize({
        index: index,
        max_num_segments: 1,
        requestTimeout: Infinity
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.getAliasIndexes = function(alias, next) {
    client.indices.getAlias({
        name: alias
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.existsAlias = function(alias, next) {
    client.indices.existsAlias({
        name: alias
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.updateAliases = function(body, next) {
    client.indices.updateAliases({
        body: body
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.putAlias = function(index, alias, next) {
    client.indices.putAlias({
        index: index,
        alias: alias
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.deleteIndex = function(index, next) {
    client.indices.delete({
        index: index
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.createIndex = function(index, settings, mappings, aliases, next) {
    var body = {
        settings: settings,
        mappings: mappings,
        aliases: aliases
    };

    client.indices.create({
        index: index,
        body: body
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.createSnapshotWithWait = function(index, repository, snapshot, next) {
    client.snapshot.create({
        body: {
            indices: index
        },
        repository: repository,
        snapshot: snapshot,
        waitForCompletion: true,
        requestTimeout: Infinity
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.restoreSnapshotWithWait = function(repository, snapshot, next) {
    client.snapshot.restore({
        repository: repository,
        snapshot: snapshot,
        waitForCompletion: true,
        requestTimeout: Infinity
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.getSnapshots = function(repository, next) {
    client.snapshot.get({
        repository: repository,
        snapshot: '_all'
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.getSnapshot = function(repository, snapshot, next) {
    client.snapshot.get({
        repository: repository,
        snapshot: snapshot
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.deleteSnapshot = function(repository, snapshot, next) {
    client.snapshot.delete({
        repository: repository,
        snapshot: snapshot
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.searchStoredTemplate = function(index, storedTemplate, params, next) {
    var body = {
        template: {
            file: storedTemplate
        },
        "params": params
    };

    client.searchTemplate({
        index: index,
        body: body
    }, function (err, resp) {
        next(err, resp);
    });
};

exports.suggest = function(index, body, next) {
    client.suggest({
        index: index,
        body: body
    }, function (err, resp) {
        next(err, resp);
    });
};




