'use strict';

var config = require('../config');
var appConfig = require('./appConfig');
var esClient = require('./esClient');
var log = require('../logger');
var Q = require('q');
var request = require('request');
var appIndexAdmin = require('./appIndexAdmin');
var appIndexer = require('./appIndexer');

var aliasName = appConfig.constants.appIndex.alias;
var snapshotRepo = appConfig.constants.appIndex.snapshotRepo;

var createSnapshotPromise = function(indexName) {
    log.debug("Creating snapshot of index: " + indexName);

    var deferred = Q.defer();

    var timestamp = (new Date()).getTime();
    var snapshotName = aliasName + "_snapshot_" + timestamp;

    esClient.createSnapshotWithWait(indexName, snapshotRepo, snapshotName, function(err, resp) {
        if (err) { return deferred.reject(err); }

        if (!resp || !resp.snapshot) {
            return deferred.reject(new Error("Unexpected response from server"));
        }

        if (resp.snapshot.indices.length !== 1) {
            return deferred.reject(new Error("Created snapshot does not contain exactly one index: " + resp.snapshot.indices.length));
        }

        deferred.resolve(snapshotName);
    });

    return deferred.promise;
};

var deleteSnapshotPromise = function(snapshotName) {
    var deferred = Q.defer();

    esClient.deleteSnapshot(snapshotRepo, snapshotName, function(err, resp) {
        if (err) { return deferred.reject(err); }

        if (!resp || resp.acknowledged !== true) {
            return deferred.reject(new Error("Unexpected response from server"));
        }

        deferred.resolve();
    });

    return deferred.promise;
};

var notifySnapshotSubscriberPromise = function(subscriberUrl) {
    var deferred = Q.defer();

    request({url: subscriberUrl, pool: false, json: true}, function (err, resp, result) {
        if (err) {
            return deferred.reject(err);
        }

        if (resp.statusCode !== 200) {
            return deferred.reject(new Error("Subscriber: " + subscriberUrl + " status code: " + resp.statusCode));
        }

        deferred.resolve(result);
    });

    return deferred.promise;
};

var notifySnapshotSubscribersPromise = function() {
    var deferred = Q.defer();

    if (!config.snapshotSubscribers) {
        deferred.reject(new Error("No snapshot subscribers configured"));
    }

    var promises = config.snapshotSubscribers.map(function (subscriberUrl) {
        return notifySnapshotSubscriberPromise(subscriberUrl);
    });

    Q.allSettled(promises)
        .then(function (results) {
            var responses = [];
            results.forEach(function (result) {
                if (result.state === "fulfilled") {
                    responses.push(result.value);
                } else {
                    responses.push(result.reason);
                }
            });

            deferred.resolve(responses);
        });

    return deferred.promise;
};

exports.deleteOldSnapshotsPromise = function(numToKeep) {
    log.debug("Get list of snapshots");
    return appIndexAdmin.getSnapshotsPromise()
        .then(function(snapshotNames) {
            var deleteSnapshotsPromise = Q();
            var deletedSnapshots = [];
            snapshotNames.slice(numToKeep).forEach(function(snapShotName) {
                deleteSnapshotsPromise = deleteSnapshotsPromise.then(function() {
                    log.debug("Deleting snapshot: " + snapShotName);
                    deletedSnapshots.push(snapShotName);
                    return deleteSnapshotPromise(snapShotName);
                });
            });

            return deleteSnapshotsPromise.then(function() {
                return deletedSnapshots;
            });
        });
};

exports.createSnapshotPromise = function(batchSize) {
    log.debug("Creating app index snapshot");

    return appIndexer.rebuildPromise(batchSize)
        .then(function (indexName) {
            return createSnapshotPromise(indexName)
                .then(function (snapshotName) {
                    log.debug("Created app index snapshot: " + snapshotName);

                    log.debug("Deleting app index");
                    return appIndexAdmin.deleteSwapOutIndicesPromise()
                        .then(function() {
                            log.debug("Notify snapshot subscribers");
                            return notifySnapshotSubscribersPromise();
                        })
                        .then(function (subscriberResponses) {
                            return {
                                snapshot: snapshotName,
                                index: indexName,
                                subscribers: subscriberResponses
                            };
                        });
                });
        });
};
