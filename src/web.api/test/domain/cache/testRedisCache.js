"use strict";

var redis = require("redis");
var redisCacheFactory = require("../../../domain/cache/redisCache");

var redisCache;

exports.group = {
    setUp: function (callback) {
        redisCache = redisCacheFactory.createRedisCache(redisCacheFactory.dbPartitions.test);
        redisCache.getClient(function(err, client) {
            if (err) { return callback(err); }

            client.flushdb(function(err) {
                callback(err);
            });
        });
    },

    tearDown: function (callback) {
        redisCache.end(function(err) {
            callback(err);
        });
    },

    testSetString: function (test) {
        var testkey = "test1";
        var testString = new Date().toString();
        redisCache.set(testkey, testString, function(setErr, setReply) {
            redisCache.getClient(function(err, client) {
                client.get(testkey, function(err, result) {
                    test.expect(4);
                    test.ok(setErr === null, setErr);
                    test.ok(setReply, "No set reply");
                    test.ok(err === null, err);
                    test.equal(result, testString);
                    test.done();
                });
            });
        });
    },

    testSetObject: function (test) {
        var testkey = "test2";
        var testObj = {
            name: "test obj",
            val: new Date().toString()
        };
        redisCache.set(testkey, testObj, function(setErr, setReply) {
            redisCache.getClient(function(err, client) {
                client.get(testkey, function(err, result) {
                    test.expect(4);
                    test.ok(setErr === null, setErr);
                    test.ok(setReply, "No set reply");
                    test.ok(err === null, err);
                    test.deepEqual(JSON.parse(result), testObj);
                    test.done();
                });
            });
        });
    },

    testMultiSetString: function (test) {
        var testData = [];
        for (var i = 0; i < 10; i++) {
            testData.push({
                key: "mtest" + i,
                value: "mval" + i
            });
        }
        var keys = testData.map(function(item) {
            return item.key;
        });
        var values = testData.map(function(item) {
            return item.value;
        });

        redisCache.mset(testData, function(setErr, setReply) {
            redisCache.getClient(function(err, client) {

                client.mget(keys, function(err, results) {
                    test.expect(3 + testData.length);
                    test.ok(setErr === null, setErr);
                    test.ok(setReply, "No set reply");
                    test.ok(err === null, err);
                    results.forEach(function(result, i) {
                        test.equal(result, values[i]);
                    });
                    test.done();
                });
            });
        });
    },

    testMultiSetGetObject: function (test) {
        var testData = [];
        for (var i = 0; i < 10; i++) {
            testData.push({
                key: "mtest" + i,
                value: { test: "mval" + i }
            });
        }
        var keys = testData.map(function(item) {
            return item.key;
        });
        var values = testData.map(function(item) {
            return item.value;
        });

        redisCache.mset(testData, function(setErr, setReply) {
            redisCache.getObjects(keys, function(getErr, results) {
                test.expect(4 + testData.length);
                test.ok(setErr === null, setErr);
                test.ok(getErr === null, getErr);
                test.ok(setReply, "No set reply");
                test.ok(results, "No get results");
                results.forEach(function(result, i) {
                    test.deepEqual(result, values[i]);
                });
                test.done();
            });
        });
    },

    testScriptEval: function (test) {
        var script =
            "local current\n" +
            "current = redis.call(\"incr\",KEYS[1])\n" +
            "if tonumber(current) == 1 then\n" +
            "  redis.call(\"expire\",KEYS[1], ARGV[1])\n" +
            "end\n" +
            "return current";

        redisCache.scriptEval(script, ['script_test'], [10], function(err, res) {
            test.expect(3);
            test.ok(err === null, err);
            test.ok(res, "No reply");
            test.ok(res === 1);

            test.done();
        });
    }
};
