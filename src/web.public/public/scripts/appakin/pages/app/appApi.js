(function () {
    'use strict';

    angular.module('appAkin').factory('appApi', function($q, $timeout, httpGet, loading) {
        var appApi = httpGet(false);

        return {
            get: function(platform, encodedId, slug) {
                var deferred = $q.defer();
                loading.started();

                appApi(
                    platform + '/app/' + encodedId + '/' + slug,
                    function (data) {
                        data.serverError = false;

                        if (data.screenShotUrls && data.screenShotUrls.length > 0) {
                            data.screenShotUrl = data.screenShotUrls[0];
                        } else if (data.ipadScreenShotUrls && data.ipadScreenShotUrls.length > 0) {
                            data.screenShotUrl = data.ipadScreenShotUrls[0];
                        }

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
