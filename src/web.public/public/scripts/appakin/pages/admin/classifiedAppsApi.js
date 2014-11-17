(function () {
    'use strict';

    angular.module('appAkin').factory('classifiedAppsApi', function(
        $q, $timeout, $location, $http, httpGet, loading, webApiUrl) {
            var getApi = httpGet();

            function createUrl(seedCategoryId, include) {
                return 'admin/cluster/classified_apps/' + seedCategoryId + '?include=' + include + '&skip=0&take=400';
            }

            return {
                get: function(seedCategoryId, include) {
                    var deferred = $q.defer();

                    loading.started();

                    getApi(
                        createUrl(seedCategoryId, include),
                        function (data) {
                            data.serverError = false;
                            handleResponse(data);
                        },
                        function (data) {
                            data = {data: data};
                            data.serverError = true;
                            handleResponse(data);
                        },
                        true);

                    function handleResponse(data) {
                        deferred.resolve(data);
                        loading.reset();
                    }

                    return deferred.promise;
                },
                updateTrainingData: function(appExtId, seedCategoryId, include, success) {
                    var url = webApiUrl + 'admin/classification/train';
                    console.log(url);

                    $http.post(
                        url,
                        {
                            seedCategoryId: seedCategoryId,
                            appExtId: appExtId,
                            include: include
                        }
                    )
                    .success(function(data) {
                            console.log('successfully updated');
                            success();
                    })
                    .error(function(data, status) {
                            console.log('failed to update');
                            alert('failed to update training data')
                    });
                }
            };
    });

}()); // use strict
