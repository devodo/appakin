(function () {
    'use strict';

    angular.module('appAkin').factory('appApi', function(httpGet, $timeout, $http, $q) {
        var appApi = httpGet();

        return {
            get: function(platform, encodedId, slug) {
                var deferred = $q.defer();

                appApi(
                    platform + '/app/' + encodedId + '/' + slug,
                    function(data) {
                        data.platform = platform;
                        data.serverError = false;
                        deferred.resolve(data);
                    },
                    function(data) {
                        data.serverError = true;
                        deferred.resolve(data);
                    });

                return deferred.promise;
            }
        };
    });

}()); // use strict
