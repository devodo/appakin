(function () {'use strict';

    angular.module('appAkin').controller('SearchResultsCtrl',
        function($scope, $window, $timeout, $location, $route, pageTitle, search, searchApi, url, app) {
            pageTitle.setPageTitle('AppAkin Search Results');

            $scope.search = search;
            $scope.searchApi = searchApi;
            $scope.appsvc = app;
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
                delete $scope.searchResults;
            });
        });

}()); // use strict
