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
        if (err) {
            log.error(err);
            return next(null, null);
        }

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
            log.error(ex, 'Error parsing redis string on key: ' + key + ' in db: ' + self.db);
            ex.isParseError = true;

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
        var parseError = null;

        res.forEach(function(reply, i) {
            if (reply === null) {
                results.push(null);
            } else {
                try {
                    var result = JSON.parse(reply);
                    results.push(result);
                } catch (ex) {
                    log.error(ex, 'Error parsing redis string on key: ' + keys[i] + ' in db: ' + self.db);

                    if (!parseError) {
                        parseError = {
                            isParseError: true,
                            keys: []
                        };
                    }

                    parseError.keys.push(keys[i]);
                }
            }
        });

        return next(parseError, results);
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

RedisCache.prototype.setExNx = function(key, value, expirySeconds, next) {
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

        args.push('NX');

        client.set(args, function(err, res) {
            if (err) { return next(err); }

            if (res === 'OK') {
                next(null, true);
            } else if (res === null) {
                next(null, false);
            } else {
                next("Unexpected response from Redis: " + res);
            }
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

RedisCache.prototype.createList = function(key, items, expirySeconds, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        var multi = client.multi();

        multi.del(key);

        if (items && items.length > 0) {
            items.forEach(function(item) {
                var redisValue;
                if (typeof item === 'object') {
                    redisValue = JSON.stringify(item);
                } else {
                    redisValue = item;
                }

                multi.rpush(key, redisValue);
            });
        }

        multi.expire(key, expirySeconds);

        multi.exec(function (err, replies) {
            if (err) { return next(err); }

            next(null, replies);
        });
    });
};

RedisCache.prototype.lRange = function(key, skip, take, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        client.lrange(key, skip, skip + take - 1, function(err, res) {
            if (err) { return next(err); }

            next(null, res);
        });
    });
};

RedisCache.prototype.lRangeObjects = function(key, skip, take, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        var multi = client.multi();

        multi.lrange(key, skip, skip + take - 1);
        multi.llen(key);

        multi.exec(function(err, replies) {
            if (err) { return next(err); }

            if (replies === null || replies.length !== 2) {
                return next(null, null);
            }

            var items = [];

            try {
                replies[0].forEach(function(reply, i) {
                    if (reply === null) {
                        return items.push(null);
                    }

                    try {
                        items.push(JSON.parse(reply));
                    } catch (ex) {
                        log.error(ex, 'Error parsing redis list item: ' + i + ' on key: ' + key + ' in db: ' + self.db);
                        throw ex;
                    }
                });
            } catch (ex) {
                return next(ex);
            }

            var result = {
                total: replies[1],
                items: items
            };

            return next(null, result);
        });
    });
};

RedisCache.prototype.scriptEval = function(script, keys, argv, next) {
    var self = this;

    self.getClient(function(err, client) {
        if (err) { return next(err); }

        if (!client) { return next(); }

        var keyCount = keys ? keys.length : 0;
        var args = [script, keyCount];

        if (keys) {
            keys.forEach(function(key) {
                args.push(key);
            });
        }

        if (argv) {
            argv.forEach(function(arg) {
                args.push(arg);
            });
        }

        // js_hint does not like calling a function to named eval
        /* jshint ignore:start */
        client.eval(args, function (err, res) {
            if (err) { return next(err); }

            return next(null, res);
        });
        /* jshint ignore:end */
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

RedisCache.prototype.getMultiCacheObjects = function(ids, createKeyFunc, repoLookupFunc, expirySeconds, next, retryCount) {
    var self = this;

    if (ids.length === 0) {
        return next(null, []);
    }

    var cacheKeys = ids.map(function(id) {
        return createKeyFunc(id);
    });

    self.getObjects(cacheKeys, function(err, cacheResults) {
        if (err) {
            log.error(err, "Error getting multi objects from redis cache.");

            if (err.isParseError) {
                log.warn(err, "Parse errors encountered. Will attempt to clear cache and retry.");

                return self.deleteKeys(err.keys, function(err) {
                    if (err) { return next(err); }

                    //retry
                    retryCount = retryCount ? retryCount + 1 : 1;
                    if (retryCount > 2) {
                        return next(new Error('Get multi objects stuck in retry loop'));
                    }

                    self.getMultiCacheObjects(ids, createKeyFunc, repoLookupFunc, expirySeconds, next, retryCount);
                });
            }
        }

        var missingIds;
        var missingIdsIndex;
        var results;

        if (!cacheResults) {
            missingIds = ids;
            results = [];
        }
        else {
            missingIds = [];
            missingIdsIndex = [];
            results = cacheResults;

            cacheResults.forEach(function(cacheResult, i) {
                if (cacheResult === null) {
                    missingIds.push(ids[i]);
                    missingIdsIndex.push(i);
                }
            });
        }

        if (missingIds.length === 0) {
            return next(null, results);
        }

        repoLookupFunc(missingIds, function(err, repoResults) {
            if (err) { return next(err); }

            var repoResultsMap = Object.create(null);
            var cacheKeyValuePairs = [];

            repoResults.forEach(function(repoResult) {
                repoResultsMap[repoResult.id] = repoResult;

                if (cacheResults) {
                    cacheKeyValuePairs.push({
                        key: createKeyFunc(repoResult.id),
                        value: repoResult
                    });
                }

                delete repoResult.id;
            });

            if (cacheKeyValuePairs.length > 0) {
                self.msetEx(cacheKeyValuePairs, expirySeconds, function (err) {
                    if (err) {
                        log.error(err);
                    }
                });
            }

            missingIds.forEach(function(missingId, i) {
                if (cacheResults) {
                    results[missingIdsIndex[i]] = repoResultsMap[missingId];
                } else {
                    results.push(repoResultsMap[missingId]);
                }
            });

            next(null, results);
        });
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
    pricedrop: 3,
    search: 4,
    featured: 8,
    appstore: 10,
    out: 12
};
















