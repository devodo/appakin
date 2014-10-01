(function () {'use strict';

    angular.module('appAkin').directive('akinHeader', function () {
        return {
            restrict: 'A',
            replace: false,
            templateUrl: '/public/templates/appakin/structure/akin-header.html',
            controller: function ($scope, $location) {
                $scope.locationData = {
                    onHomePage: onHomePage()
                };

                $scope.$on('$routeChangeSuccess', function () {
                   $scope.locationData.onHomePage = onHomePage();
                });

                function onHomePage() {
                    return $location.path() === '/';
                }
            }
        };
    });

}()); // use strict
