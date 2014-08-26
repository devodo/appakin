(function () {'use strict';

    angular.module('appAkin').directive('akinSearchbox', function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: 'appakin/search/akin-searchbox.html',
            controller: function ($scope, $timeout, search) {
                $scope.search = search;

                $scope.updateAutoCompleteTerms = function(typed) {
//                    if (typed.length === 0) {
//                        $scope.search.autoCompleteTerms = [];
//                        return;
//                    }

                    search.updateAutoCompleteTerms(typed);

//                        .then(function () {
//                            $timeout(function () {
//                                $scope.$apply();
//                                console.log('fully processed.')
//                            }, 0);
//                        });
                }
            }
        };
    });

}()); // use strict
