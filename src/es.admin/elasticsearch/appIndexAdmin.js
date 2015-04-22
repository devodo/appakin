'use strict';

var appConfig = require('./appConfig');
var esClient = require('./esClient');
var log = require('../logger');
var Q = require('q');

var aliasName = appConfig.constants.appIndex.alias;
var swapOutAliasName = appConfig.constants.appIndex.swapOutAlias;
var restoreRepo = appConfig.constants.appIndex.restoreRepo;
var snapshotRepo = appConfig.constants.appIndex.snapshotRepo;

exports.createAppIndexPromise = function() {
    var deferred = Q.defer();
    var timestamp = (new Date()).getTime();
    var newIndexName = aliasName + "_idx_" + timestamp;
    var aliases = {};
    aliases[swapOutAliasName] = {};

    esClient.createIndex(newIndexName, appConfig.settings, appConfig.mappings, aliases, function(err, resp) {
        if (err) { return deferred.reject(err); }

        if (!resp || resp.acknowledged !== true) {
            return deferred.reject(new Error('Unexpected response from server'));
        }

        deferred.resolve(newIndexName);
    });

    return deferred.promise;
};

exports.getCurrentIndexPromise = function() {
    var deferred = Q.defer();

    log.debug("Check alias exists");
    esClient.existsAlias(aliasName, function(err, resp) {
        if (err) { return deferred.reject(err); }

        if (resp === false) {
            deferred.resolve(null);
        }

        log.debug("Retrieving alias indexes");
        esClient.getAliasIndexes(aliasName, function(err, resp) {
            if (err) { return deferred.reject(err); }

            if (!resp) {
                return deferred.reject(new Error('No indexes found with alias: ' + aliasName));
            }

            var indexes = [];

            Object.keys(resp).forEach(function(key) {
                if (key.indexOf(aliasName) === 0) {
                    indexes.push(key);
                }
            });

            if (indexes.length === 0) {
                return deferred.reject(new Error('No indexes returned with alias: ' + aliasName));
            }

            if (indexes.length > 1) {
                return deferred.reject(new Error('Multiple indexes found with alias: ' + aliasName));
            }

            deferred.resolve(indexes[0]);
        });
    });

    return deferred.promise;
};

exports.getSnapshotIndexPromise = function(snapshotName) {
    var deferred = Q.defer();

    esClient.getSnapshot(restoreRepo, snapshotName, function(err, resp) {
        if (err) { return deferred.reject(err); }

        if (!resp || !resp.snapshots || resp.snapshots.length !== 1) {
            return deferred.reject(new Error("Unexpected response from server"));
        }

        var snapshot = resp.snapshots[0];

        if (snapshot.snapshot !== snapshotName) {
            return deferred.reject(new Error("Got an unexpected snapshot: " + snapshot.snapshot));
        }

        if (!snapshot.indices) {
            return deferred.reject(new Error("Snapshot does not contain any indixes"));
        }

        if (snapshot.indices.length !== 1) {
            return deferred.reject(new Error("Snapshot does not contain exactly one index: " + snapshot.indices.length));
        }

        deferred.resolve(snapshot.indices[0]);
    });

    return deferred.promise;
};

var deleteIndexPromise = function(indexName) {
    log.debug("Deleting index: " + indexName);
    var deferred = Q.defer();

    esClient.deleteIndex(indexName, function(err, resp) {
        if (err) { return deferred.reject(err); }

        if (!resp || resp.acknowledged !== true) {
            return deferred.reject(new Error('Unexpected response from server'));
        }

        deferred.resolve();
    });

    return deferred.promise;
};

exports.swapInNewIndexPromise = function(currentIndex, newIndex) {
    log.debug("Swapping in new index: " + newIndex);

    var deferred = Q.defer();

    var body = { actions: [
        { add: { index: newIndex, alias: aliasName } },
        { remove: { index: newIndex, alias: swapOutAliasName } }
    ]};

    if (currentIndex) {
        body.actions.push({ remove: { index: currentIndex, alias: aliasName } });
        body.actions.push({ add: { index: currentIndex, alias: swapOutAliasName } });
    }

    esClient.updateAliases(body, function(err, resp) {
        if (err) { return deferred.reject(err); }

        deferred.resolve(newIndex);
    });

    if (currentIndex) {
        return deferred.promise.then(function(newIndex) {
            return deleteIndexPromise(swapOutAliasName).then(function() {
               return newIndex;
            });
        });
    } else {
        return deferred.promise;
    }
};

exports.deleteSwapOutIndicesPromise = function() {
    return deleteIndexPromise(swapOutAliasName);
};

var getSnapshotsInternalPromise = function(repo) {
    var deferred = Q.defer();

    esClient.getSnapshots(repo, function(err, resp) {
        if (err) { return deferred.reject(err); }

        if (!resp || !resp.snapshots) {
            return deferred.reject(new Error("Unexpected response from server"));
        }

        resp.snapshots.sort(function(a, b) {
            return b.start_time_in_millis - a.start_time_in_millis;
        });

        var snapshotNames = resp.snapshots.map(function(snapshot) {
            return snapshot.snapshot;
        });

        deferred.resolve(snapshotNames);
    });

    return deferred.promise;
};

exports.getSnapshotsPromise = function() {
    return getSnapshotsInternalPromise(snapshotRepo);
};

exports.getRestoreSnapshotsPromise = function() {
    return getSnapshotsInternalPromise(restoreRepo);
};
