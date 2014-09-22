(function () {'use strict';

    angular.module('appAkin').controller('SearchResultsCtrl',
        function($scope, $timeout, $location, pageTitle, search, url) {
            pageTitle.setPageTitle('Search Results');

            $scope.search = search;
            $scope.url = url;
            $scope.numPages = 5;

            $scope.setSearchType = function(searchType) {
                search.searchType = searchType;
                search.submitSearch(1);
            };

//            $scope.$on('$routeUpdate', function(event) {
//                search.updateSearchFromUrl();
//                search.submit(search.currentPage);
//            });

            $scope.$on('userChangedPlatform', function(event) {
                search.submitSearch(1);
            });

            //$timeout(function() {
                //// Have to add this listener after the controller has initialised in order to prevent a second search request
                //// being generated when the currentPage value possibly gets adjusted as part of controller initialisation.
                $scope.pageChanged = function() {
                    console.log('page changed: ' + search.currentPage);

                    //console.log(search.result.resultSearchTerm);
                    if (search.results.resultSearchTerm) {
                        search.searchTerm = search.results.resultSearchTerm;
                    }

                    search.submitSearch(search.currentPage);
                };
            //}, 0);

//            $scope.$watch('search.currentPage', function() {
//                console.log('currentPage=' + search.currentPage);
//            })
        });

}()); // use strict
