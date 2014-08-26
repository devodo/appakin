(function () {'use strict';

    angular.module('appAkin').directive('akinSearchbox', function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'appakin/search/akin-searchbox.html',
            controller: function ($scope, $timeout, search) {
                $scope.search = search;

                $scope.updateAutoCompleteTerms = function(typed) {
                    search.updateAutoCompleteTerms(typed);
                }
            }
        };
    });

}()); // use strict
