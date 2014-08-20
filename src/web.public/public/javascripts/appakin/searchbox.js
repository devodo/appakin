(function () {'use strict';

    var appAkin = require('./appakin.js');

    appAkin.directive('searchbox', function () {
        return {
            restrict: 'A', // as attribute
            replace: true,
            templateUrl: "directives/searchbox.html",
            controller: ['$scope', '$filter', 'appService',
                function ($scope, $filter, appService) {
                    $scope.formState = {
                        searchTerm: '',
                        platform: appService.platform
                    };

                    $scope.$watch('formState.platform', function () {
                        // TODO: this is firing on first load.
                        appService.setPlatform($scope.formState.platform);
                    });
                }]
        }
    });

}()); // use strict
