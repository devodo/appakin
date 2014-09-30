(function () {
    'use strict';

    angular.module('appAkin.http', [])
        .service('httpGet', function($timeout, $http, $q, webApiUrl) {
            var defaultRequestTimeoutMs = 4000;

            return function(requestTimeoutMs) {
                requestTimeoutMs = requestTimeoutMs || defaultRequestTimeoutMs;

                var currentRequest;

                function resetCurrentRequest() {
                    if (currentRequest && currentRequest.active) {
                        clearPromises(currentRequest);
                        currentRequest.active = false;
                        currentRequest.timedOut = false;
                        currentRequest.cancelled = true;
                    }

                    // Create a new object and assign it to currentRequest.
                    currentRequest = {
                        active: false,
                        timedOut: false,
                        cancelled: false
                    };
                }

                function doRequest(relativeUrl, success, error) {
                    resetCurrentRequest();
                    var url = webApiUrl + relativeUrl;

                    var localCurrentRequest = currentRequest;
                    localCurrentRequest.active = true;

                    localCurrentRequest.requestCancelPromise = $q.defer();
                    localCurrentRequest.url = url;

                    localCurrentRequest.requestTimeoutPromise = $timeout(
                        function() {
                            console.log('timed out: active=' + localCurrentRequest.active);

                            if (!localCurrentRequest.active) {
                                return;
                            }

                            clearPromises(localCurrentRequest);
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
                            if (success) {
                                success(data);
                            }

                            clearPromises(localCurrentRequest);
                            localCurrentRequest.active = false;
                        })
                        .error(function(data, status) {
                            console.log('Failed search: status=' + status +
                                ' url=' + url +
                                ' timedOut=' + localCurrentRequest.timedOut +
                                ' cancelled=' + localCurrentRequest.cancelled +
                                ' active=' + localCurrentRequest.active);

                            var cancelled = localCurrentRequest.cancelled && !localCurrentRequest.timedOut;

                            if (error) {
                                if (status > 0 || (status === 0 && !cancelled)) {
                                    //console.log('Invoking error callback.');
                                    error(data);
                                }
                            }

                            clearPromises(localCurrentRequest);
                            localCurrentRequest.active = false;
                        });
                }

                function clearPromises(request) {
                    if (request.requestCancelPromise) {
                        request.requestCancelPromise.resolve();
                    }

                    if (request.requestTimeoutPromise) {
                        $timeout.cancel(request.requestTimeoutPromise);
                    }
                }

                doRequest.cancel = resetCurrentRequest;

                return doRequest;
            };
        });

}()); // use strict
