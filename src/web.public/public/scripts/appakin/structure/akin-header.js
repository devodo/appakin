(function () {'use strict';

    angular.module('appAkin').directive('akinHeader', function () {
        return {
            restrict: 'A',
            replace: false,
            templateUrl: 'appakin/structure/akin-header.html',
            controller: function ($scope, $location) {
                $scope.location = $location;
            }
        };
    });

}()); // use strict
