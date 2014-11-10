(function () {
    'use strict';

    angular.module('appAkin.http', [])
        .service('httpGet', function($timeout, $http, $q, webApiUrl, cache, cacheApiRequests) {
            var defaultRequestTimeoutMs = 15000;
            var apiCache = cache('apiCache', 10, cacheApiRequests);

            function createCacheKey(url) {
                return 'data ' + url;
            }

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

                function doRequest(relativeUrl, success, error, isCacheable, cacheRelativeUrl) {
                    resetCurrentRequest();
                    var url = webApiUrl + relativeUrl;
                    var cacheUrl = webApiUrl + (cacheRelativeUrl || relativeUrl);

                    if (isCacheable) {
                        var cachedData = apiCache.get(createCacheKey(cacheUrl));

                        if (cachedData) {
                            currentRequest.active = false;
                            console.log('got data from cache');

                            if (success) {
                                success(cachedData);
                            }

                            return;
                        }
                    }

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
                            console.log('Successful api call: url=' + url);

                            if (data && isCacheable) {
                                apiCache.set(createCacheKey(cacheUrl), data, true);
                                console.log('added data to cache for cache url ' + cacheUrl);
                            }

                            if (success) {
                                success(data);
                            }

                            clearPromises(localCurrentRequest);
                            localCurrentRequest.active = false;
                        })
                        .error(function(data, status) {
                            console.log('Failed api call: status=' + status +
                                ' url=' + url +
                                ' timedOut=' + localCurrentRequest.timedOut +
                                ' cancelled=' + localCurrentRequest.cancelled +
                                ' active=' + localCurrentRequest.active);

                            var cancelled = localCurrentRequest.cancelled && !localCurrentRequest.timedOut;

                            if (error) {
                                if (status > 0 || ((status === 0 || status === undefined) && !cancelled)) {
                                    //console.log('Invoking error callback.');
                                    error(data || {});
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
