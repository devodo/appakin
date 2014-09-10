(function () {
    'use strict';

    angular.module('appAkin.http', [])
        .service('httpGet', function($timeout, $http, $q, webApiUrl) {
            var defaultRequestTimeoutMs = 4000;

            return function(requestTimeoutMs) {
                var requestTimeoutMs = requestTimeoutMs || defaultRequestTimeoutMs;

                var currentRequest;

                function resetCurrentRequest() {
                    if (currentRequest && currentRequest.active) {
                        console.log('cancelling request');

                        if (currentRequest.requestCancelPromise) {
                            currentRequest.requestCancelPromise.resolve();
                        }

                        if (currentRequest.requestTimeoutPromise) {
                            $timeout.cancel(currentRequest.requestTimeoutPromise);
                        }

                        currentRequest.active = false;
                        currentRequest.timedOut = false;
                    }

                    // Create a new object and assign it to currentRequest.
                    currentRequest = {
                        active: true,
                        timedOut: false
                    };
                }

                function doRequest(relativeUrl, success, error) {
                    resetCurrentRequest();
                    var localCurrentRequest = currentRequest;

                    var url = webApiUrl + relativeUrl;

                    localCurrentRequest.requestCancelPromise = $q.defer();

                    localCurrentRequest.requestTimeoutPromise = $timeout(function() {
                            console.log('timed out: active=' + localCurrentRequest.active);

                            if (!localCurrentRequest.active) {
                                return;
                            }

                            if (localCurrentRequest.timedOut) {
                                console.log('Server request has already timed out. url=' + url);
                            }

                            if (localCurrentRequest.requestCancelPromise) {
                                localCurrentRequest.requestCancelPromise.resolve();
                            }

                            localCurrentRequest.timedOut = true;

                            console.log('Server request timed out. url=' + url);
                        },
                        requestTimeoutMs);

                    $http
                        .get(
                            url,
                            {
                                timeout: localCurrentRequest.requestCancelPromise.promise
                            })
                        .success(function(data) {
                            success(data);
                            localCurrentRequest.active = false;
                        })
                        .error(function(data, status) {
                            console.log('Failed search: status=' + status +
                                ' url=' + url +
                                ' timedOut=' + localCurrentRequest.timedOut);

                            if (error) {
                                if (status > 0 || (status === 0 && localCurrentRequest.timedOut)) {
                                    console.log('Invoking error callback.');
                                    error(data);
                                }
                            }

                            localCurrentRequest.active = false;
                        });
                }

                doRequest.cancel = resetCurrentRequest;

                return doRequest;
            };
        });

}()); // use strict
