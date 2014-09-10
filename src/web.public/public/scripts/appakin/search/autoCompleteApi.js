(function () {
    'use strict';

    angular.module('appAkin').factory('autoCompleteApi', function(webApiUrl, platform, $timeout, $http, $q) {
        var debounceTimeoutMs = 200;
        var requestTimeoutMs = 3000;

        var bouncePromise = null;
        var requestCancelPromise = null;
        var requestTimeoutPromise = null;

        function cancelCurrentRequest() {
            if (bouncePromise) {
                $timeout.cancel(bouncePromise);
                bouncePromise = null;
            }

            if (requestCancelPromise) {
                requestCancelPromise.resolve();
                requestCancelPromise = null;
            }

            if (requestTimeoutPromise) {
                $timeout.cancel(requestTimeoutPromise);
                requestTimeoutPromise = null;
            }
        }

        return {
            cancel: cancelCurrentRequest,
            get: function(q, p, callback) {
                cancelCurrentRequest();

                bouncePromise = $timeout(function() {
                    bouncePromise = null;
                    requestCancelPromise = $q.defer();

                    requestTimeoutPromise = $timeout(function() {
                        if (requestCancelPromise) {
                            requestCancelPromise.resolve();
                            requestCancelPromise = null;
                        }

                        console.log('auto request timed out.');
                    }, requestTimeoutMs);

                    var store = platform.getApiName(p);
                    console.log('Making auto complete request: q=' + q + ' store=' + store);

                    $http
                        .get(
                            webApiUrl + 'search/'+store+'/auto?q='+encodeURIComponent(q),
                            { timeout: requestCancelPromise.promise })
                        .success(function(data) {
                            console.log('got result for q=' + q + ' p=' + p);

                            $timeout.cancel(requestTimeoutPromise);
                            requestTimeoutPromise = null;

                            requestCancelPromise.resolve();
                            requestCancelPromise = null;

                            callback(data);
                        })
                        .error(function(data, status) {
                            console.log('Failed search: status=' + status + ' data=' + data);

                            $timeout.cancel(requestTimeoutPromise);
                            requestTimeoutPromise = null;

                            requestCancelPromise.resolve();
                            requestCancelPromise = null;
                        });
                }, debounceTimeoutMs);
            }
        };
    });

}()); // use strict
