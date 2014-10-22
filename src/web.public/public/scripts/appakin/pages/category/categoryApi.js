(function () {
    'use strict';

    angular.module('appAkin').factory('categoryApi', function(
        $q, $timeout, $location, $http, httpGet, loading, url, webApiUrl) {
            var categoryApi = httpGet();

            function createUrl(platform, encodedId, slug, pageNumber) {
                return platform + '/category/' + encodedId + '/' + slug + '?p=' + pageNumber;
            }

            return {
                get: function(platform, encodedId, slug) {
                    var urlName = encodedId + '/' + slug;
                    var deferred = $q.defer();

                    loading.started();

                    categoryApi(
                        createUrl(platform, encodedId, slug, 1),
                        function (data) {
                            if (data.url !== urlName) {
                                $location.path(url.createCategoryUrl(platform, data.url)).replace();
                            }

                            data.serverError = false;
                            data.hasMorePages = true;
                            handleResponse(data);
                        },
                        function (data) {
                            data = {data: data};
                            data.serverError = true;
                            handleResponse(data);
                        },
                        true);

                    function handleResponse(data) {
                        data.platform = platform;
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
                            handleResponse(data);
                        },
                        function (data) {
                            data = {data: data};
                            handleResponse(data);
                        },
                        false);

                    function handleResponse(data) {
                        data.serverError = false; // ignore errors for now.
                        data.platform = platform;
                        deferred.resolve(data);
                        loading.reset(loadingKey);
                    }

                    return deferred.promise;
                }
//                ,
//                excludeFromCategory: function(categoryExtId, appExtId) {
//                    var url = webApiUrl + 'admin/search/cat/exclude_app';
//                    console.log(url);
//
//                    $http.post(
//                        url,
//                        {
//                            categoryExtId: categoryExtId,
//                            appExtId: appExtId
//                        }
//                    )
//                    .success(function(data) {
//                        console.log('successfully excluded');
//                    })
//                    .error(function(data, status) {
//                        console.log('failed to exclude');
//                    });
//                }
            };
    });

}()); // use strict
