(function () {'use strict';

    var appAkin = require('./appakin.js');

    appAkin.directive('header', function () {
        return {
            restrict: 'A',
            replace: true,
            //scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
            templateUrl: 'directives/header.html',
            controller: ['$scope', '$filter', 'appService',
                function ($scope, $filter, appService) {
                    $scope.$watch(
                        function(){return appService.onHomePage;},
                        function(newVal){$scope.onHomePage = newVal;});
                }
            ]
        }
    });

}()); // use strict
