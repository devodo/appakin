(function () {'use strict';

    angular.module('appAkin').controller('SearchResultsCtrl',
        function($scope, $timeout, $location, pageTitle, search, url) {
            pageTitle.setPageTitle('appAkin Search Results');

            $scope.search = search;
            $scope.url = url;
            $scope.numPages = 5;

            $scope.setSearchType = function(searchType) {
                search.searchType = searchType;
                search.submitSearch(1);
            };

//            $scope.$on('userChangedPlatform', function(event) {
//                search.submitSearch(1);
//            });

            $scope.pageChanged = function() {
                if (search.results.resultSearchTerm) {
                    search.searchTerm = search.results.resultSearchTerm;
                }

                search.submitSearch(search.currentPage);
            };
        });

}()); // use strict
