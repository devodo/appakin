(function () {'use strict';

    angular.module('appAkin').directive('akinSearchbox', function (platform) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'appakin/search/akin-searchbox.html',
            controller: function ($scope, search) {
                $scope.search = search;
                $scope.platform = platform;

                $scope.platformTabs = [
                    {name: 'android', friendlyName: 'Android'},
                    {name: 'ios', friendlyName: 'Apple'},
                    {name: 'winphone', friendlyName: 'Windows'}
                ];

                $scope.isActiveTab = function (tabName) {
                    return tabName === $scope.search.platform;
                };

                $scope.onTabClick = function (tabName) {
                    $scope.search.platform = tabName;
                };
            }
        };
    });

}()); // use strict
