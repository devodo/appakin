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
                var submitSearchTimeout = null;

                $scope.submitSearch = function(value) {
                    // TODO: find a way to wrap this in a directive?
                    if ("activeElement" in document) {
                        document.activeElement.blur();
                    }

                    if (submitSearchTimeout) {
                        $timeout.cancel(submitSearchTimeout);
                    }

                    submitSearchTimeout = $timeout(function() {
                        search.submitSearch(1);
                    }, 0);
                };

                $scope.$on('$destroy', function() {
                    if (submitSearchTimeout) {
                        $timeout.cancel(submitSearchTimeout);
                    }
                });

                // LEAVE THIS STUFF HERE! IT WILL BE REINSTATED LATER.

//                $scope.ddSelectOptions = [
//                    {
//                        text: $scope.platform.getStoreName('android'),
//                        platform: 'android'
//                    },
//                    {
//                        text: $scope.platform.getStoreName('ios'),
//                        platform: 'ios'
//                    },
//                    {
//                        text: $scope.platform.getStoreName('winphone'),
//                        platform: 'winphone'
//                    }
//                ];
//
//                $scope.ddSelectSelected = {
//                    text: $scope.platform.getStoreName($scope.search.platform),
//                    platform: $scope.search.platform
//                };
//
//                // TODO: There may be a better way to manage platform updating.
//                $scope.$watch('search.platform', function(newValue, oldValue) {
//                    $scope.ddSelectSelected = {
//                        text: $scope.platform.getStoreName($scope.search.platform),
//                        platform: $scope.search.platform
//                    };
//                });
//
//                $scope.dropdownOnchange = function (selected) {
//                    if ($scope.search.platform === selected.platform) {
//                        return;
//                    }
//
//                    $scope.search.platform = selected.platform;
//                    $rootScope.$broadcast('userChangedPlatform');
//                };
            }
        };
    });

}()); // use strict
