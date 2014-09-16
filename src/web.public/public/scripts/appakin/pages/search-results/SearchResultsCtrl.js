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
                search.searchType = searchType;
                search.submitSearch(1);
            };

            $scope.$on('$routeUpdate', function(event) {
                search.updateSearchFromUrl();
                search.search(search.currentPage);
            });

            $scope.$on('userChangedPlatform', function(event) {
                search.submitSearch(1);
            });

            $timeout(function() {
                // Have the search run after page load.
                // One reason for doing this is to prevent the search being cancelled
                // by the setting of the search.platform variable in the controller.
                search.search(search.currentPage);

                // Have to add this listener after the controller has initialised in order to prevent a second search request
                // being generated when the currentPage value possibly gets adjusted as part of controller initialisation.
                $scope.pageChanged = function() {
                    console.log('page changed: ' + search.currentPage);
                    search.submitSearch(search.currentPage);
                };
            }, 0);

            $scope.$watch('search.currentPage', function() {
                console.log('currentPage=' + search.currentPage);
            })
        });

}()); // use strict
