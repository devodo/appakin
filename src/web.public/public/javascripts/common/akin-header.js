(function () {'use strict';

    var appAkin = require('./../appakin/appakin.js');

    appAkin.directive('akinHeader', function () {
        return {
            restrict: 'A',
            replace: true,
            //scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
            templateUrl: 'directives/akin-header.html',
            controller: ['$scope', '$filter', 'navigationService',
                function ($scope, $filter, navigationService) {
                    $scope.onHomePage = navigationService.getOnHomePage();

                    $scope.$watch(
                        function(){return navigationService.getOnHomePage();},
                        function(newValue){$scope.onHomePage = newValue;});
                }
            ]
        }
    });

}()); // use strict
