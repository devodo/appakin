(function () {'use strict';

    angular.module('appAkin').directive('akinSearchbox', function (platform) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'appakin/search/akin-searchbox.html',
            controller: function ($scope, search) {
                $scope.search = search;
                $scope.platform = platform;
                $scope.status = { isOpen: false };

                $scope.ddSelectOptions = [
                    {
                        text: $scope.platform.getStoreName('android'),
                        platform: 'android'
                    },
                    {
                        text: $scope.platform.getStoreName('ios'),
                        platform: 'ios'
                    },
                    {
                        text: $scope.platform.getStoreName('winphone'),
                        platform: 'winphone'
                    }
                ];

                $scope.ddSelectSelected = {
                    text: $scope.platform.getStoreName($scope.search.platform),
                    platform: $scope.search.platform
                };

                $scope.dropdownOnchange = function (selected) {
                    $scope.search.platform = selected.platform;
                    console.log('platform is ' + $scope.search.platform);
                };
            }
        };
    });

}()); // use strict
