(function () {
    'use strict';

    angular.module('appAkin').factory('appApi', function($q, $timeout, httpGet, loading) {
        var appApi = httpGet();

        return {
            get: function(platform, encodedId, slug) {
                var deferred = $q.defer();
                loading.started();

                appApi(
                    platform + '/app/' + encodedId + '/' + slug,
                    function (data) {
                        data.serverError = false;
                        handleResponse(data);
                    },
                    function (data) {
                        data = {data: data};
                        data.serverError = true;
                        handleResponse(data);
                    });

                function handleResponse(data) {
                    data.platform = platform;
                    deferred.resolve(data);
                    loading.reset();
                }

                return deferred.promise;
            }
        };
    });

}()); // use strict
