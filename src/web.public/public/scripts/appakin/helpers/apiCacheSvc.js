(function () {
    'use strict';

    angular.module('appAkin').factory('cache', function($sessionStorage) {
        var cacheTtlMinutes = 30;
        var noCache = false;

        function addMinutes(date, minutes) {
            return new Date(date.getTime() + minutes*60000);
        }

        return {
            set: function(keyStr, value, hasTtl) {
                var data = { data: value };

                if (hasTtl) {
                    data.added = new Date();
                }

                $sessionStorage[keyStr] = data;
            },
            get: function(keyStr) {
                if (noCache) {
                    return null;
                }

                var result = $sessionStorage[keyStr];

                if (result) {
                    if (result.added) {
                        if (addMinutes(new Date(result.added), cacheTtlMinutes) > new Date()) {
                            //console.log('Got data from session cache for key ' + keyStr);
                            return result.data;
                        } else {
                            // clear this now old data out.
                            $sessionStorage[keyStr] = null;
                        }
                    } else {
                        return result.data;
                    }
                }

                return null;
            }
        };
    });

}()); // use strict
