(function () {
    'use strict';

    angular.module('appAkin').factory('searchApi', function($q, $timeout, httpGet, loading, search, platform) {
        var searchApi = httpGet(true);

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
                        addPlatform(data.categories);

                        if (data.categories) {
                            for (var i = 0; i < data.categories.length; ++i) {
                                addPlatform(data.categories[i].apps);
                            }
                        }

                        addPlatform(data.apps);

                        var newResults = {
                            items: data.categories || data.apps,
                            totalItems: data.total,
                            serverError: false,
                            searchType: localSearchType,
                            suggestion: null,
                            resultSearchTerm: localSearchTerm
                        };

                        if (data.suggestions && data.suggestions[0]) {
                            newResults.suggestion = data.suggestions[0];
                        }

                        search.searchInProgress = false;
                        search.currentPage = data.page;
                        handleResponse(newResults);
                    },
                    function(data) {
                        var newResults = { serverError: true };
                        search.searchInProgress = false;
                        handleResponse(newResults);
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
