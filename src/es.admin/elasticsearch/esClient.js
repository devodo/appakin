'use strict';

var config = require('../config');
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
        host: config.es.host + ':' + config.es.port,
        log: 'error'
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
        index: index
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

exports.activateIndex = function(currentIndex, newIndex, alias, swapAlias, next) {
    var body = { actions: [
        { add: { index: newIndex, alias:alias } },
        { remove: { index: newIndex, alias:swapAlias } }
    ]};

    if (currentIndex) {
        body.actions.push({ remove: { index: currentIndex, alias:alias } });
        body.actions.push({ add: { index: currentIndex, alias:swapAlias } });
    }

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




