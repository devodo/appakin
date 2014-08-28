(function () {
    'use strict';

    angular.module('appAkin').factory('searchApi', function(webApiUrl, $timeout, $http, $q) {
        var requestTimeoutMs = 4000;

        var requestCancelPromise = null;
        var requestTimeoutPromise = null;

        function cancelCurrentRequest() {
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
            get: function(q, p, page, take, callback) {
                cancelCurrentRequest();

                requestCancelPromise = $q.defer();

                requestTimeoutPromise = $timeout(function() {
                    if (requestCancelPromise) {
                        requestCancelPromise.resolve();
                        requestCancelPromise = null;
                    }
                }, requestTimeoutMs);

                console.log('Making search request: q=' + q + ' p=' + p);

                // TODO: At the moment, if the http request errors, the requestTimeoutPromise continues running.
                // Find a way to cancel it on http request error (not using error() handler by itself as the
                // autocomplete dropdown doesn't show in that case).

                $http
                    .get(
                        webApiUrl + 'search?q='+encodeURIComponent(q)+'&p='+encodeURIComponent(p)+
                        '&page='+encodeURIComponent(page)+'&take='+encodeURIComponent(take),
                        { timeout: requestCancelPromise.promise })
                    .then(function(response) {
                        console.log('got result for q=' + q + ' p=' + p);
                        $timeout.cancel(requestTimeoutPromise);
                        requestTimeoutPromise = null;

                        requestCancelPromise.resolve();
                        requestCancelPromise = null;

                        callback(response.data);
                    });
            }
        };
    });

}()); // use strict
