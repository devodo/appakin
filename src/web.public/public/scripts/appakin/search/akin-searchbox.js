(function () {'use strict';

    angular.module('appAkin').directive('akinSearchbox', function ($rootScope, platform, $timeout) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: '/public/templates/appakin/search/akin-searchbox.html',
            controller: function ($scope, search) {
                $scope.search = search;
                $scope.platform = platform;
                $scope.status = { isOpen: false };

                $scope.submitSearch = function(value) {
                    $timeout(function() {
                        search.submitSearch(1);
                    }, 0);
                };
            }
        };
    });

}()); // use strict
