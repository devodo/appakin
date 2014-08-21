(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('SearchCtrl', ['$scope', 'navigationService', 'searchService',
        function($scope, navigationService, searchService) {
            navigationService.setPageTitle('Search');

            $scope.message = 'Search results!';

            $scope.categories = [];
            $scope.paging = {page: 1, totalPages: 0};

            searchService.search(
                function(data) {
                    $scope.platform = data.platform;
                    $scope.categories = data.categories;
                    $scope.paging = data.paging;
                },
                function() { alert('got error'); } // TODO: replace this.
            );
        }]);

}()); // use strict
