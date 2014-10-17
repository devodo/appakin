(function () {'use strict';

    angular.module('appAkin').controller('SearchResultsCtrl',
        function($scope, $timeout, $location, $route, pageTitle, search, url) {
            pageTitle.setPageTitle('appAkin Search Results');
            var searchResults = $route.current.locals.searchData;

            $scope.search = search;
            $scope.url = url;
            $scope.numPages = 5;

            $scope.searchType = searchResults.searchType;
            $scope.isCategorySearch = searchResults.searchType == 'category';
            $scope.isAppSearch = searchResults.searchType == 'app';
            $scope.serverError = searchResults.serverError;
            $scope.hasResults = searchResults.items && searchResults.items.length > 0;
            $scope.suggestion = searchResults.suggestion;
            $scope.resultSearchTerm = searchResults.resultSearchTerm;
            $scope.resultTotalItems = searchResults.totalItems;
            $scope.resultItems = searchResults.items;

            $scope.setSearchType = function(searchType) {
                search.searchType = searchType;
                search.submitSearch(1);
            };

            $scope.pageChanged = function() {
                if (searchResults.resultSearchTerm) {
                    search.searchTerm = searchResults.resultSearchTerm;
                }

                search.submitSearch(search.currentPage);
            };
        });

}()); // use strict
