(function () {'use strict';

    var appAkin = require('./../appakin/appakin.js');

    appAkin.directive('akinFooter', function () {
        return {
            restrict: 'A',
            replace: true,
            templateUrl: "directives/akin-footer.html",
            controller: ['$scope', '$filter', function ($scope, $filter) {
                // Behaviour here.
            }]
        }
    });

}()); // use strict
