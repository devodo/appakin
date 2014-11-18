(function () {
    'use strict';

    angular.module('appAkin').factory('classifiedAppsApi', function(
        $q, $timeout, $location, $http, httpGet, loading, webApiUrl) {
            var getApi = httpGet(25000);

            return {
                getClassifiedApps: function(seedCategoryId, include, skip, take) {
                    var deferred = $q.defer();

                    loading.started();

                    getApi(
                        'admin/cluster/classified_apps/' + seedCategoryId + '?include=' + include + '&skip=' + skip + '&take=' + take,
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
                getSearchSeedApps: function(seedCategoryId, boost, skip, take) {
                    var deferred = $q.defer();

                    loading.started();

                    getApi(
                        'admin/cluster/search_seed_app/' + seedCategoryId + '?boost=' + boost + '&skip=' + skip + '&take=' + take,
                        function (data) {
                            var i;

                            getApi(
                                'admin/classification/training/' + seedCategoryId,
                                function (trainingData) {
                                    var trainingDataLookup = {};
                                    var trainingDataResult;

                                    if (trainingData && trainingData.length > 0) {
                                        for (i = 0; i < trainingData.length; ++i) {
                                            trainingDataLookup[trainingData[i].appExtId.replace(/-/g, '')] = trainingData[i];
                                        }

                                        for (i = 0; i < data.apps.length; ++i) {
                                            trainingDataResult = trainingDataLookup[data.apps[i].extId];

                                            if (trainingDataResult) {
                                                data.apps[i].isTrainingData = true;
                                                data.apps[i].include = trainingDataResult.include;
                                                data.apps[i].trainingDataId = trainingDataResult.id;
                                            }
                                        }
                                    }

                                    data.serverError = false;
                                    handleResponse(data);
                                },
                                function () {
                                    data = {data: data};
                                    data.serverError = true;
                                    handleResponse(data);
                                }
                            );
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
                classify: function(seedCategoryId) {
                    var deferred = $q.defer();

                    loading.started();

                    getApi(
                        'admin/cluster/classify/' + seedCategoryId + '?save=true',
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
                            alert('failed to update training data');
                        });
                },
                deleteTrainingData: function(appExtId, seedCategoryId, success) {
                    var url = webApiUrl + 'admin/classification/train?seedCategoryId=' + seedCategoryId + '&appExtId=' + appExtId;
                    console.log(url);

                    $http.delete(url)
                        .success(function(data) {
                            console.log('successfully deleted');
                            success();
                        })
                        .error(function(data, status) {
                            console.log('failed to delete');
                            alert('failed to delete training data');
                        });
                }
            };
    });

}()); // use strict
