(function () {'use strict';

    angular.module('appAkin').directive('akinSearchboxHome', function (platform) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: '/public/templates/appakin/search/akin-searchbox-home.html',
            controller: function ($scope, search) {
                $scope.search = search;
                $scope.platform = platform;
            }
        };
    });

}()); // use strict
