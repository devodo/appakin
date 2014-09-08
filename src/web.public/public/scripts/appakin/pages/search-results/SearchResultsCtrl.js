(function () {'use strict';

    angular.module('appAkin').controller('SearchResultsCtrl',
        function($scope, $timeout, $location, pageTitle, search, url) {
            pageTitle.setPageTitle('Search Results');

            $scope.search = search;
            $scope.url = url;
            $scope.numPages = 5;

            search.resetSearchResults();
            search.updateSearchFromUrl();

            //console.log('search in service is: q=' + search.searchTerm + ' p=' + search.platform);

            $scope.setSearchType = function(searchType) {

            };

            $scope.$on('$routeUpdate',function(event) {
                //console.log('location changed: ' + $location.search().q);
                search.updateSearchFromUrl();
                search.search();
            });

            // Add this listener after the controller has initialised in order to prevent a second search request
            // being generated when the currentPage value possibly gets adjusted as part of controller initialisation.
            $timeout(function() {
                $scope.pageChanged = function() {
                    //console.log('page changed: ' + search.results.currentPage);
                    search.submitSearch(search.results.currentPage);
                };
            }, 0);

            search.search();
        });

}()); // use strict
