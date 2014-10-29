(function () {'use strict';

    angular.module('appAkin').directive('akinSearchboxHome', function ($timeout, platform) {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: '/public/templates/appakin/search/akin-searchbox-home.html',
            controller: function ($scope, search) {
                $scope.search = search;
                $scope.platform = platform;
                var submitSearchTimeout = null;

                $scope.submitSearch = function(value, isAutocompleteSearch) {
                    if (submitSearchTimeout) {
                        $timeout.cancel(submitSearchTimeout);
                    }

                    submitSearchTimeout = $timeout(function() {
                        search.submitSearch(1, isAutocompleteSearch);
                    }, 0);
                };

                $scope.$on('$destroy', function() {
                    if (submitSearchTimeout) {
                        $timeout.cancel(submitSearchTimeout);
                    }
                });
            }
        };
    });

}()); // use strict
