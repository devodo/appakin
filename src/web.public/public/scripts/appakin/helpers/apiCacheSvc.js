(function () {
    'use strict';

    angular.module('appAkin').factory('cache', function($sessionStorage, $interval) {
        var cacheTtlMinutes = 30;
        var noCache = true;
        var cacheScanMinutes = 10;

        function addMinutes(date, minutes) {
            return new Date(date.getTime() + minutes*60000);
        }

        $interval(function() {
            var now = new Date();

            for (var key in $sessionStorage) {
                if (key.match(/^(?:data |scroll )/)) {
                    var data = $sessionStorage[key];

                    if (data && data.added && addMinutes(new Date(data.added), cacheTtlMinutes) < now) {
                        delete $sessionStorage[key];
                    }
                }
            }

        }, cacheScanMinutes * 60000);

        return {
            set: function(keyStr, value, hasTtl) {
                var data = { data: value };

                if (hasTtl) {
                    data.added = new Date();
                }

                try {
                    $sessionStorage[keyStr] = data;
                }
                catch (err) {
                    // writing can fail if storage is full; swallow the error in this case.
                    console.log('failed to write data for key ' + keyStr + ' to sessionStorage');
                    return false;
                }

                return true;
            },
            get: function(keyStr) {
                var now = null;

                if (noCache) {
                    return null;
                }

                var result = $sessionStorage[keyStr];

                if (result) {
                    if (result.added) {
                        now = new Date();

                        if (addMinutes(new Date(result.added), cacheTtlMinutes) > now) {
                            //console.log('Got data from session cache for key ' + keyStr);
                            //result.added = now;
                            return result.data;
                        } else {
                            // clear this now old data out.
                            delete $sessionStorage[keyStr];
                            //$sessionStorage[keyStr] = null;
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
