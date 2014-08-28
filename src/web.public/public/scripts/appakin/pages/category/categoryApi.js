(function () {
    'use strict';

    angular.module('appAkin').factory('categoryApi', function(webApiUrl, $timeout, $http, $q) {
        var requestTimeoutMs = 4000;

        return {
            get: function(platform, urlName, success, error) {

                var requestTimedOut = false;
                var requestCancelPromise = $q.defer();

                var requestTimeoutPromise = $timeout(
                    function() {
                        if (requestCancelPromise) {
                            requestCancelPromise.resolve();
                            requestCancelPromise = null;
                        }

                        requestTimedOut = true;
                    },
                    requestTimeoutMs);

                console.log('Making category request: category=' + urlName + ' platform=' + platform);

                $http
                    .get(
                        webApiUrl + platform + '/category/' + urlName, // TODO: url encoding?
                        { timeout: requestCancelPromise.promise })
                    .success(function(data) {
                        console.log('got result');
                        success(data);
                    })
                    .error(function(data, status) {
                        console.log('failed result: status=' + status + ' data=' + data);

                        if (error) {
                            if (status > 0 || (status === 0 && requestTimedOut)) {
                                error(data);
                            }
                        }
                    });
            }
        };
    });

}()); // use strict
