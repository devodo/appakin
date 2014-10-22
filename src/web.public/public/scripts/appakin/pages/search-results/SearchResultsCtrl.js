(function () {'use strict';

    angular.module('appAkin').controller('SearchResultsCtrl',
        function($scope, $window, $timeout, $location, $route, pageTitle, search, searchApi, url) {
            pageTitle.setPageTitle('appAkin Search Results');

            $scope.search = search;
            $scope.searchApi = searchApi;
            $scope.url = url;
            $scope.numPages = 5;
            $scope.searchResults = $route.current.locals.searchData;

            $scope.setSearchType = function(searchType) {
                search.searchType = searchType;
                search.submitSearch(1);
            };

            $scope.pageChanged = function() {
                if ($scope.searchResults.resultSearchTerm) {
                    search.searchTerm = $scope.searchResults.resultSearchTerm;
                }

                search.submitSearch(search.currentPage);
            };

            $scope.$on('$destroy', function() {
                console.log('destroy on search result close');

                var i, j;
                if ($scope.searchResults.items) {
                    for (i = 0; i < $scope.searchResults.items.length; ++i) {
                        if ($scope.searchResults.items[i].apps) {
                            for (j = 0; j < $scope.searchResults.items[i].apps.length; ++j) {
                                delete $scope.searchResults.items[i].apps[j];
                            }
                        }

                        delete $scope.searchResults.items[i];
                    }
                }

                delete $scope.searchResults;
            });
        });

}()); // use strict
