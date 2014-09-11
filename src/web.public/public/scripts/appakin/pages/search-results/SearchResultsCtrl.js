(function () {'use strict';

    angular.module('appAkin').controller('SearchResultsCtrl',
        function($scope, $timeout, $location, pageTitle, search, url) {
            pageTitle.setPageTitle('Search Results');

            $scope.search = search;
            $scope.url = url;
            $scope.numPages = 5;

            search.resetSearchResults();
            search.updateSearchFromUrl();

            $scope.setSearchType = function(searchType) {

            };

            $scope.$on('$routeUpdate', function(event) {
                search.updateSearchFromUrl();
                search.search();
            });

            $scope.$on('userChangedPlatform', function(event) {
                search.submitSearch(1);
            });

            // Have to add this listener after the controller has initialised in order to prevent a second search request
            // being generated when the currentPage value possibly gets adjusted as part of controller initialisation.
            $timeout(function() {
                $scope.pageChanged = function() {
                    //console.log('page changed: ' + search.results.currentPage);
                    search.submitSearch(search.results.currentPage);
                };
            }, 0);

            // Have the search run after page load.
            // One reason for doing this is to prevent the search being cancelled
            // by the setting of the search.platform variable in the controller.
            $timeout(function() {
                search.search();
            }, 0);
        });

}()); // use strict
