(function () {'use strict';

    angular.module('appAkin').directive('akinSearchbox', function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'appakin/search/akin-searchbox.html',
            controller: function ($scope, search) {
                $scope.search = search;

                $scope.states = ['Alabama', 'Alaska', 'Arizona', 'Arkansas'];
            }
        };
    });

}()); // use strict
