(function () {'use strict';

    angular.module('appAkin').directive('akinSearchboxHome', function ($timeout, platform) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: '/public/templates/appakin/search/akin-searchbox-home.html',
            controller: function ($scope, search) {
                $scope.search = search;
                $scope.platform = platform;

                $scope.submitSearch = function(value) {
                    $timeout(function() {
                        search.submitSearch(1);
                    }, 0);
                };
            }
        };
    });

}()); // use strict
