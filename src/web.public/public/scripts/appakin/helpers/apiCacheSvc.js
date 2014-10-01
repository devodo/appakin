(function () {
    'use strict';

    angular.module('appAkin').factory('apiCache', function($sessionStorage) {
        var cacheTtlMinutes = 30;
        var noCache = false;

        function addMinutes(date, minutes) {
            return new Date(date.getTime() + minutes*60000);
        }

        return {
            set: function(keyStr, value) {
                $sessionStorage[keyStr] = {
                    data: value,
                    added: new Date()
                };
            },
            get: function(keyStr) {
                if (noCache) {
                    return null;
                }

                var result = $sessionStorage[keyStr];

                if (result) {
                    if (result.added && addMinutes(new Date(result.added), cacheTtlMinutes) > new Date()) {
                        console.log('Got data from session cache for key ' + keyStr);
                        return result.data;
                    }

                    // Clear the old or incomplete data out.
                    $sessionStorage[keyStr] = null;
                }

                return null;
            }
        };
    });

}()); // use strict
