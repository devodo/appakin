//(function () {
//    'use strict';
//
//    angular.module('appAkin').factory('searchApi', function(webApiUrl, $timeout, $http, $q) {
//        var requestTimeoutMs = 4000;
//        var currentRequest = createCurrentRequest();
//
//        function cancelCurrentRequest() {
//            currentRequest.cancelled = true;
//
//            if (currentRequest.requestCancelPromise) {
//                currentRequest.requestCancelPromise.resolve();
//            }
//
//            if (currentRequest.requestTimeoutPromise) {
//                $timeout.cancel(currentRequest.requestTimeoutPromise);
//            }
//        }
//
//        function createCurrentRequest() {
//            return {
//                timedOut: false,
//                cancelled: false
//            };
//        }
//
//        return {
//            cancel: cancelCurrentRequest,
//            get: function(q, p, page, take, success, error) {
//                cancelCurrentRequest();
//
//                currentRequest = createCurrentRequest();
//                var localCurrentRequest = currentRequest;
//
//                localCurrentRequest.requestCancelPromise = $q.defer();
//
//                localCurrentRequest.requestTimeoutPromise = $timeout(function() {
//                    if (localCurrentRequest.requestCancelPromise) {
//                        localCurrentRequest.requestCancelPromise.resolve();
//                    }
//
//                    localCurrentRequest.timedOut = true;
//
//                    console.log('Server request timed out.');
//                }, requestTimeoutMs);
//
//                console.log('Making search request: q=' + q + ' p=' + p);
//
//                $http
//                    .get(
//                        webApiUrl + 'search?q='+encodeURIComponent(q)+'&p='+encodeURIComponent(p)+
//                        '&page='+encodeURIComponent(page)+'&take='+encodeURIComponent(take),
//                        { timeout: localCurrentRequest.requestCancelPromise.promise })
//                    .success(function(data) {
//                        console.log('got result');
//                        success(data);
//                    })
//                    .error(function(data, status) {
//                        console.log('Failed search: status=' + status + ' data=' + data);
//
//                        var requestTimedOut = localCurrentRequest.timedOut;
//                        var requestCancelled = localCurrentRequest.cancelled;
//
//                        if (error) {
//                            if (status > 0 || (status === 0 && !requestCancelled)) {
//                                console.log('Invoking error callback.');
//                                error(data);
//                            }
//                        }
//                    });
//            }
//        };
//    });
//
//}()); // use strict
