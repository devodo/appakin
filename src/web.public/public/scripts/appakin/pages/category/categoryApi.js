(function () {
    'use strict';

    angular.module('appAkin').factory('categoryApi', function($q, $timeout, httpGet, loading) {
        var categoryApi = httpGet();

        function createUrl(platform, encodedId, slug, pageNumber) {
            return platform + '/category/' + encodedId + '/' + slug + '?p=' + pageNumber;
        }

        return {
            get: function(platform, encodedId, slug) {
                var deferred = $q.defer();
                loading.started();

                categoryApi(
                    createUrl(platform, encodedId, slug, 1),
                    function (data) {
                        data.serverError = false;
                        handleResponse(data);
                    },
                    function (data) {
                        data = {data: data};
                        data.serverError = true;
                        handleResponse(data);
                    });

                function handleResponse(data) {
                    data.platform = platform;
                    console.log('here ' + data.apps.length);
                    deferred.resolve(data);
                    loading.reset();
                }

                return deferred.promise;
            },
            getMore: function(platform, encodedId, slug, pageNumber) {
                var deferred = $q.defer();

                var loadingKey = 'loading-more-categories';
                loading.started(loadingKey);

                categoryApi(
                    createUrl(platform, encodedId, slug, pageNumber),
                    function (data) {
                        console.log(data.apps.length);
                        handleResponse(data);
                    },
                    function (data) {
                        data = {data: data};
                        handleResponse(data);
                    });

                function handleResponse(data) {
                    data.serverError = false; // ignore errors. TODO change this.
                    data.platform = platform;
                    deferred.resolve(data);
                    loading.reset(loadingKey);
                }

                return deferred.promise;
            }
        };
    });

}()); // use strict
