(function () {'use strict';

    angular.module('appAkin').directive('akinSearchbox', function (platform) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'appakin/search/akin-searchbox.html',
            controller: function ($scope, search) {
                $scope.search = search;
                $scope.platform = platform;
            }
        };
    });

}()); // use strict
