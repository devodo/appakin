'use strict';

var config = require('../config');
var appConfig = require('./appConfig');
var esClient = require('./esClient');
var log = require('../logger');
var Q = require('q');
var appIndexAdmin = require('./appIndexAdmin');
var appSearcher = require('./appSearcher');

var restoreRepo = appConfig.constants.appIndex.restoreRepo;

var restoreSnapshotPromise = function(snapshotName) {
    log.debug("Restoring snapshot: " + snapshotName);

    var deferred = Q.defer();

    esClient.restoreSnapshotWithWait(restoreRepo, snapshotName, function(err, resp) {
        if (err) { return deferred.reject(err); }

        if (!resp || !resp.snapshot) {
            return deferred.reject(new Error("Unexpected response from server"));
        }

        if (!resp.snapshot.indices) {
            return deferred.reject(new Error("Snapshot does not contain any indixes"));
        }

        if (resp.snapshot.indices.length !== 1) {
            return deferred.reject(new Error("Snapshot does not contain exactly one index: " + resp.snapshot.indices.length));
        }

        deferred.resolve(resp.snapshot.indices[0]);
    });

    return deferred.promise;
};

var warmupMainSearchPromise = function(indexName, query) {
    var deferred = Q.defer();

    appSearcher.warmupMain(indexName, query, function(err, resp) {
        if (err) { return deferred.reject(err); }

        deferred.resolve(resp);
    });

    return deferred.promise;
};

var warmupCompleteSearchPromise = function(indexName, query) {
    var deferred = Q.defer();

    appSearcher.warmupComplete(indexName, query, function(err, resp) {
        if (err) { return deferred.reject(err); }

        deferred.resolve(resp);
    });

    return deferred.promise;
};

var warmupSearchPromise = function(indexName) {
    var mainQueries = ['racing game', 'listen to music', 'all the apps', 'kids apps', 'the', 'and'];
    var completeQueries = ['a', 't', 'b', 'ab', 'th', 'ap'];

    var promise = Q();

    mainQueries.forEach(function(query) {
        promise = promise.then(function() {
            return warmupMainSearchPromise(indexName, query);
        });
    });

    completeQueries.forEach(function(query) {
        promise = promise.then(function() {
            return warmupCompleteSearchPromise(indexName, query);
        });
    });

    return promise;
};

exports.restoreSnapshotPromise = function(snapshotName) {
    log.debug("Restoring snapshot: " + snapshotName);

    return restoreSnapshotPromise(snapshotName)
        .then(function (restoreIndex) {
            log.debug("Warming up searches");
            return warmupSearchPromise(restoreIndex)
                .then(appIndexAdmin.getCurrentIndexPromise)
                .then(function (currentIndex) {
                    log.debug("Swapping in new index");
                    return appIndexAdmin.swapInNewIndexPromise(currentIndex, restoreIndex);
                });
        });
};

exports.restoreLatestSnapshotPromise = function() {
    log.debug("Restoring latest snapshot");

    log.debug("Getting snapshots list");
    return appIndexAdmin.getRestoreSnapshotsPromise()
        .then(function (snapshotNames) {
            if (snapshotNames.length === 0) {
                throw new Error("No snapshots found");
            }

            return restoreSnapshotPromise(snapshotNames[0])
                .then(function (restoreIndex) {
                    log.debug("Warming up searches");
                    return warmupSearchPromise(restoreIndex)
                        .then(appIndexAdmin.getCurrentIndexPromise)
                        .then(function (currentIndex) {
                            log.debug("Swapping in new index");
                            return appIndexAdmin.swapInNewIndexPromise(currentIndex, restoreIndex);
                        });
                });
        });
};
