"use strict";

var config = require('../config');

var isWin = /^win/.test(process.platform);
var pg = isWin ? require("pg") : require("pg").native;

var Connection = function(client, done) {
    this.client = client;
    this.done = done;
};

Connection.prototype.close = function (err, next) {
    var me = this;

    if (err) {
        return me.rollback(err, next);
    }

    this.done();
    next();
};

Connection.prototype.beginTran = function (next) {
    this.client.query('BEGIN', [], next);
};

Connection.prototype.commitTran = function (next) {
    this.client.query('COMMIT', [], next);
};

Connection.prototype.rollback = function (err, next) {
    var me = this;
    me.client.query('ROLLBACK', [], function (rbErr) {
        //if there was a problem rolling back the query
        //something is seriously messed up.  Return the error
        //to the done function to close & remove this client from
        //the pool.  If you leave a client in the pool with an unaborted
        //transaction __very bad things__ will happen.
        me.done(rbErr);
        if (rbErr) {
            next(rbErr);
        }
        else {
            next(err);
        }
    });
};

var createConnection = function(settings, next) {
    var connStr = "postgres://" +
        settings.username +
        (settings.password ? ":" + settings.password : "") + "@" +
        settings.host + ":" +
        settings.port +'/' +
        settings.database;

    pg.connect(connStr, function(err, client, done) {
        if(err) {
            return next(err);
        }

        var connection = new Connection(client, done);
        next(null, connection);
    });
};

exports.open = function(settings, next) {
    createConnection(settings, function(err, connection) {
        if(err) {
            return next(err);
        }

        next(null, connection);
    });
};

exports.end = function() {
    pg.end();
};

exports.isUniqueViolation = function(err) {
    var UNIQUE_VIOLATION_CODE = '23505';

    return err && err.code === UNIQUE_VIOLATION_CODE;
};
