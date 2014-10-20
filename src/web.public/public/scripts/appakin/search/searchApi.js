(function () {
    'use strict';

    angular.module('appAkin').factory('searchApi', function($q, $timeout, httpGet, loading, search, platform) {
        var searchApi = httpGet(true);

        function addPlatform(arr, platform) {
            if (!arr) { return; }

            var i;
            for (i = 0; i < arr.length; ++i) {
                arr[i].platform = platform;
            }
        }

        return {
            getMoreCategoryApps: function(category) {
                var i;

                // Short-circuit: no more apps to display.
                // check that extras over 3 are being shown on narrow screens.
                if (category.totalApps <= category.displayApps.length) {
                    if (!category.moreAdded) {
                        category.moreAdded = true;
                    }

                    return;
                }

                // Short-circuit: apps are available client-side to display.
                if (category.apps.length > category.displayApps.length) {
                    for (i = category.displayApps.length; i < category.apps.length; ++i) {
                        category.displayApps.push(category.apps[i]);
                    }

                    category.moreAdded = true;
                    return;
                }

                // No short-circuit available; get more apps from the server.

                var deferred = $q.defer();
                var localPlatform = category.platform;
                var localSearchTerm = category.searchTerm;
                var platformApiName = platform.getApiName(localPlatform);
                var page = category.page + 1;

                searchApi(
                    platformApiName + '/search/cat_app' +
                        '?q='+encodeURIComponent(localSearchTerm) +
                        '&p='+encodeURIComponent(page) +
                        '&cat_id='+encodeURIComponent(category.id),
                    function(data) {
                        var i;

                        addPlatform(data.apps, localPlatform);

                        for (i = 0; i < data.apps.length; ++i) {
                            category.apps.push(data.apps[i]);
                            category.displayApps.push(data.apps[i]);
                        }

                        category.page = data.page;
                        category.totalApps = data.total;
                        category.moreAdded = true;

                        handleResponse(data);
                    },
                    function(data) {
                        //var newResults = { serverError: true };
                        //search.searchInProgress = false;
                        handleResponse(data);
                    }
                );

                function handleResponse(data) {
                    deferred.resolve(data);
                    //loading.reset();
                }

                return deferred.promise;
            },
            get: function() {
                var deferred = $q.defer();

                if (search.searchTerm === '') {
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

                searchApi(
                    platformApiName + '/search/' + typeApiName +
                        '?q='+encodeURIComponent(localSearchTerm) +
                        '&p='+encodeURIComponent(page),
                    function(data) {
                        addPlatform(data.categories, localPlatform);

                        if (data.categories) {
                            for (var i = 0; i < data.categories.length; ++i) {
                                addPlatform(data.categories[i].apps, localPlatform);
                                data.categories[i].moreAdded = false;
                                data.categories[i].page = 1;
                                data.categories[i].searchTerm = localSearchTerm;
                                data.categories[i].displayApps = data.categories[i].apps.slice(0, 6);
                            }
                        }

                        addPlatform(data.apps, localPlatform);

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
