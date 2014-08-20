(function () {'use strict';

    var appAkin = require('./appakin.js');

    appAkin.directive('footer', function () {
        return {
            restrict: 'A', // as attribute
            replace: true,
            templateUrl: "directives/footer.html",
            controller: ['$scope', '$filter', function ($scope, $filter) {
                // Behaviour here.
            }]
        }
    });

}()); // use strict
