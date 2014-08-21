(function () {'use strict';

    var appAkin = require('./../appakin/appakin.js');

    appAkin.directive('akinSearchbox', function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: "directives/akin-searchbox.html",
            controller: ['$scope', '$filter', 'searchService',
                function ($scope, $filter, searchService) {
                    $scope.formState = {
                        searchTerm: searchService.searchTerm,
                        platform: searchService.getPlatform()
                    };

                    $scope.submit = function() {
                        searchService.redirectToSearch();
                    }

                    $scope.$watch('formState.searchTerm', function() {
                       searchService.searchTerm = $scope.formState.searchTerm;
                    });

                    $scope.$watch('formState.platform', function() {
                        // TODO: this is firing on first load.
                        searchService.setPlatform($scope.formState.platform);
                    });
                }]
        }
    });

}()); // use strict
