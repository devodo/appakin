(function () {'use strict';

    angular.module('appAkin').directive('akinSearchbox', function ($rootScope, platform) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: '/public/templates/appakin/search/akin-searchbox.html',
            controller: function ($scope, search) {
                $scope.search = search;
                $scope.platform = platform;
                $scope.status = { isOpen: false };

                console.log('wat: ' + $scope.search.platform);

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

                // TODO: There may be a better way to manage platform updating.
                $scope.$watch('search.platform', function(newValue, oldValue) {
                    $scope.ddSelectSelected = {
                        text: $scope.platform.getStoreName($scope.search.platform),
                        platform: $scope.search.platform
                    };
                });

                $scope.dropdownOnchange = function (selected) {
                    if ($scope.search.platform === selected.platform) {
                        return;
                    }

                    $scope.search.platform = selected.platform;
                    $rootScope.$broadcast('userChangedPlatform');
                };
            }
        };
    });

}()); // use strict
