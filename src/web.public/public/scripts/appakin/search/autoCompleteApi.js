(function () {
    'use strict';

    angular.module('appAkin').factory('autoCompleteApi', function(webApiUrl, $timeout, $http, $q) {
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
                    }, requestTimeoutMs);

                    console.log('Making auto complete request: q=' + q + ' p=' + p);

                    // TODO: At the moment, if the http request errors, the requestTimeoutPromise continues running.
                    // Find a way to cancel it on http request error (not using error() handler by itself as the
                    // autocomplete dropdown doesn't show in that case).

                    $http
                        .get(
                            webApiUrl + 'search/autocomplete?q='+encodeURIComponent(q)+'&p='+encodeURIComponent(p),
                            { timeout: requestCancelPromise.promise })
                        .then(function(response) {
                            console.log('got result for q=' + q + ' p=' + p);
                            $timeout.cancel(requestTimeoutPromise);
                            requestTimeoutPromise = null;

                            requestCancelPromise.resolve();
                            requestCancelPromise = null;

                            callback(response);
                        });
                }, debounceTimeoutMs);
            }
        };
    });

}()); // use strict
