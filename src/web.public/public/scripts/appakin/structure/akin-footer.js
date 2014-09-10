(function () {'use strict';

    angular.module('appAkin').directive('akinFooter', function () {
        return {
            restrict: 'A',
            replace: false,
            templateUrl: '/public/templates/appakin/structure/akin-footer.html',
            controller: function ($scope, $filter) {
                // Behaviour here.
            }
        };
    });

}()); // use strict
