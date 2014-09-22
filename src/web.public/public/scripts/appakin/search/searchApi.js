(function () {
    'use strict';

    angular.module('appAkin').factory('searchApi', function($q, $timeout, httpGet, loading, search, platform) {
        var searchApi = httpGet();

        return {
            get: function() {
                var deferred = $q.defer();

                if (search.searchTerm === '') {
                    search.results.initialState = false;
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
                        addPlatform(data.apps);

                        var newResults = {
                            items: data.categories || data.apps,
                            apps: data.apps,
                            totalItems: data.total,
                            initialState: false,
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
