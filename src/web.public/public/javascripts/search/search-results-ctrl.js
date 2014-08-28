(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('SearchCtrl', ['$scope', '$routeParams', 'navigationService', 'searchService',
        function($scope, $routeParams, navigationService, searchService) {
            navigationService.setPageTitle('Search');

            $scope.message = 'Search results!';

            console.log('init controller');

            $scope.categories = [];
            $scope.totalItems = 0;
            $scope.currentPage = undefined;
            $scope.numPages = 5;

            var search = function() {
                searchService.search(
                    $scope.currentPage || $routeParams.page || 1,
                    function(data) {
                        $scope.platform = data.platform;
                        $scope.categories = data.categories;
                        $scope.currentPage = data.page;
                        $scope.totalItems = data.totalItems;
                    },
                    function() { alert('got error'); } // TODO: replace this.
                );
            };

            search();

            $scope.pageChanged = function() {
                search();
            };
        }]);

}()); // use strict
