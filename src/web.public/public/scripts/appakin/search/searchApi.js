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
            get: function(q, p, page, take, success, error) {
                cancelCurrentRequest();

                var requestTimedOut = false;

                requestCancelPromise = $q.defer();

                requestTimeoutPromise = $timeout(function() {
                    if (requestCancelPromise) {
                        requestCancelPromise.resolve();
                        requestCancelPromise = null;
                    }

                    console.log('Server request timed out.');
                    requestTimedOut = true;
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
