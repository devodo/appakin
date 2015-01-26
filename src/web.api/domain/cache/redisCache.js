'use strict';

var redis = require("redis");
var config = require('../../config');
var log = require('../../logger');
var redisCacheMap = Object.create(null);

var RedisCache = function(db) {
    this.db = db;
    this.client = null;
    this.enabled = config.cache.redis.enabled;
};

RedisCache.prototype.onError = function(err) {
    var self = this;
    log.error(err, "Redis error occured on db: " + self.db);
    self.enabled = false;
    self.client.end();
    self.client = null;

    setTimeout(function() {
        self.createClient(function(err) {
            if (err) {
                log.error(err, "Redis error reconnecting to db: " + self.db);
                // self.createClient should register error handler again for retry loop so can just return here
                return;
            }

            self.enabled = true;
        });
    }, config.cache.redis.retryConnectionMs);
};

RedisCache.prototype.createClient = function(next) {
    var self = this;
    log.info("Opening Redis connection to db: " + self.db);

    self.client = redis.createClient(config.cache.redis.port, config.cache.redis.host);
    self.client.on("error", function(err) { self.onError(err); });
    self.client.select(self.db, function(err) {
        if (err) { return next(err); }

        return next(null, self.client);
    });
};

RedisCache.prototype.getClient = function(next) {
    var self = this;
    if (!self.enabled) {
        return next();
    }

    if (self.client !== null) {
        next(null, self.client);
    } else {
        self.createClient(next);
    }
};

RedisCache.prototype.get = function(key, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(null, null); }

        client.get(key, function(err, res) {
            if (err) { return next(err); }

            return next(null, res);
        });
    });
};

RedisCache.prototype.mget = function(keys, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(null, null); }

        client.mget(keys, function(err, res) {
            if (err) { return next(err); }

            return next(null, res);
        });
    });
};

RedisCache.prototype.getObject = function(key, next) {
    var self = this;
    self.get(key, function(err, res) {
        if (err) { return next(err); }

        if (res === null) {
            return next(null, null);
        }

        try {
            var result = JSON.parse(res);
            return next(null, result);
        } catch (ex) {
            log.error(ex, 'Error parsing redis string on key: %s in db: %d', key, self.db);
            return next(ex);
        }
    });
};

RedisCache.prototype.getObjects = function(keys, next) {
    var self = this;
    self.mget(keys, function(err, res) {
        if (err) { return next(err); }

        if (res === null) {
            return next(null, null);
        }

        var results = [];

        var currentIndex = null;
        try {
            res.forEach(function(reply, i) {
                currentIndex = i;
                if (reply === null) {
                    results.push(null);
                } else {
                    var result = JSON.parse(reply);
                    results.push(result);
                }
            });

            return next(null, results);
        } catch (ex) {
            log.error(ex, 'Error parsing redis string on key: %s in db: %d', keys[currentIndex], self.db);
            return next(ex);
        }
    });
};

RedisCache.prototype.setEx = function(key, value, expirySeconds, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        var val = typeof value === 'object' ? JSON.stringify(value) : value;
        var args = [key, val];

        if (expirySeconds) {
            args.push('EX');
            args.push(expirySeconds);
        }

        client.set(args, function(err, res) {
            if (err) { return next(err); }

            next(null, res);
        });
    });
};

RedisCache.prototype.msetEx = function(keyValuePairs, expirySeconds, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        var multi = client.multi();

        keyValuePairs.forEach(function(keyValuePair) {
            var val = typeof keyValuePair.value === 'object' ? JSON.stringify(keyValuePair.value) : keyValuePair.value;
            var args = [keyValuePair.key, val];

            if (expirySeconds) {
                args.push('EX');
                args.push(expirySeconds);
            }

            multi.set(args);
        });

        // drains multi queue and runs atomically
        multi.exec(function (err, replies) {
            if (err) { return next(err); }

            next(null, replies);
        });
    });
};

RedisCache.prototype.set = function(key, obj, next) {
    this.setEx(key, obj, null, next);
};

RedisCache.prototype.mset = function(keyValuePairs, next) {
    this.msetEx(keyValuePairs, null, next);
};

RedisCache.prototype.deleteKey = function(key, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        client.del(key, function(err, res) {
            if (err) { return next(err); }

            next(null, res);
        });
    });
};

RedisCache.prototype.deleteKeys = function(keys, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        var multi = client.multi();

        keys.forEach(function(key) {
            multi.del(key);
        });

        // drains multi queue and runs atomically
        multi.exec(function (err, replies) {
            if (err) { return next(err); }

            next(null, replies);
        });
    });
};

RedisCache.prototype.end = function(next) {
    var self = this;
    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        delete redisCacheMap[self.db];
        client.end();
        next();
    });
};

exports.createRedisCache = function(db) {
    if (!db || isNaN(db)) {
        throw "Invalid redis db: " + db;
    }
    var redisCache = redisCacheMap[db];

    if (!redisCache) {
        redisCache = new RedisCache(db);
        redisCacheMap[db] = redisCache;
    }

    return redisCache;
};

exports.dbPartitions = {
    test: 15,
    chart: 1,
    category: 2,
    search: 4
};
















