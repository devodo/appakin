(function () {'use strict';

    angular.module('appAkin').controller('SearchResultsCtrl',
        function($scope, $timeout, $location, pageTitle, search, url) {
            pageTitle.setPageTitle('appAkin Search Results');

            $scope.search = search;
            $scope.url = url;
            $scope.numPages = 5;
            $scope.searchType = search.results.searchType; // could be replaced.
            $scope.isCategorySearch = search.results.searchType == 'category';
            $scope.isAppSearch = search.results.searchType == 'app';
            $scope.serverError = search.results.serverError;
            $scope.hasResults = search.results.items.length > 0;
            $scope.suggestion = search.results.suggestion;
            $scope.resultSearchTerm = search.results.resultSearchTerm;
            $scope.resultTotalItems = search.results.totalItems;
            $scope.resultItems = search.results.items;

            $scope.setSearchType = function(searchType) {
                search.searchType = searchType;
                search.submitSearch(1);
            };

            //$scope.$on('userChangedPlatform', function(event) {
            //    search.submitSearch(1);
            //});

            $scope.pageChanged = function() {
                if (search.results.resultSearchTerm) {
                    search.searchTerm = search.results.resultSearchTerm;
                }

                search.submitSearch(search.currentPage);
            };
        });

}()); // use strict
