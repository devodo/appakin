(function () {
    'use strict';

    angular.module('appAkin').factory('searchApi', function($q, $timeout, httpGet, loading, search, platform) {
        var searchApi = httpGet();

        return {
            get: function() {
                var deferred = $q.defer();

                if (search.searchTerm === '') {
                    //search.results.initialState = false;
                    deferred.resolve();
                    return;
                }

                loading.started();
                search.searchInProgress = true;

                var localSearchTerm = search.searchTerm;
                var localPlatform = search.platform;
                var localSearchType = search.searchType;
                var platformApiName = platform.getApiName(localPlatform);
                var typeApiName = search.searchType === 'category' ? 'cat' : 'app';
                var page = search.currentPage;

                function addPlatform(arr) {
                    if (!arr) { return; }

                    var i;
                    for (i = 0; i < arr.length; ++i) {
                        arr[i].platform = localPlatform;
                    }
                }

                searchApi(
                    platformApiName + '/search/' + typeApiName +
                        '?q='+encodeURIComponent(localSearchTerm) +
                        '&p='+encodeURIComponent(page),
                    function(data) {
                        var currentCategory;

                        addPlatform(data.categories);

                        if (data.categories) {
                            for (var i = 0; i < data.categories.length; ++i) {
                                currentCategory = data.categories[i];
                                addPlatform(currentCategory.apps);

                                if (currentCategory.apps) {
                                    currentCategory.partitionedApps = [];
                                    currentCategory.partitionedApps.push(currentCategory.apps.slice(0, 3));

                                    if (currentCategory.apps.length > 3) {
                                        currentCategory.partitionedApps.push(currentCategory.apps.slice(3, 6));
                                    }
                                }
                            }
                        }

                        addPlatform(data.apps);

                        var newResults = {
                            items: data.categories || data.apps,
                            //apps: data.apps,
                            totalItems: data.total,
                            serverError: false,
                            searchType: localSearchType,
                            suggestion: null,
                            resultSearchTerm: localSearchTerm
                        };

                        if (data.suggestions && data.suggestions[0]) {
                            newResults.suggestion = data.suggestions[0];
                        }

                        search.results = newResults;
                        search.searchInProgress = false;
                        search.currentPage = data.page;

                        data.serverError = false;
                        handleResponse(data);
                    },
                    function(data) {
                        search.resetSearchResults();
                        search.results.serverError = true;
                        search.searchInProgress = false;
                        //console.log('error');

                        data.serverError = true;
                        handleResponse(data);
                    }
                );

                function handleResponse(data) {
                    deferred.resolve(data);
                    loading.reset();
                }

                return deferred.promise;
            }
        };
    });

}()); // use strict
