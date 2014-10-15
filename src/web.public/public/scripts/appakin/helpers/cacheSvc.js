(function () {
    'use strict';

    angular.module('appAkin').factory('cache', function(DSCacheFactory) {
        return function(name, ttlMinutes, isActive) {
            var cache = new DSCacheFactory(
                name,
                {
                    maxAge: 1000 * 60 * ttlMinutes,
                    deleteOnExpire: 'aggressive'
                });

            return {
                set: function (keyStr, value) {
                    if (!isActive) {
                        return false;
                    }

                    cache.put(keyStr, value);
                    return true;
                },
                get: function (keyStr) {
                    if (!isActive) {
                        return null;
                    }

                    var value = cache.get(keyStr);
                    return (!value || value.isExpired) ? null : value;
                }
            };
        };
    });

}()); // use strict
