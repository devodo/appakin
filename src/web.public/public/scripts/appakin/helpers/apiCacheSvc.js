(function () {
    'use strict';

    angular.module('appAkin').factory('cache', function(DSCacheFactory) {
        var cacheTtlMinutes = 10;
        var noCache = false;

        var cache = DSCacheFactory(
            'cache',
            {
                maxAge: 1000 * 60 * cacheTtlMinutes,
                deleteOnExpire: 'aggressive'
            });

        return {
            set: function(keyStr, value) {
                if (noCache) {
                    return false;
                }

                cache.put(keyStr, value);
                return true;
            },
            get: function(keyStr) {
                if (noCache) {
                    return null;
                }

                var value = cache.get(keyStr);
                return (!value || value.isExpired) ? null : value;
            }
        }
    });

}()); // use strict
