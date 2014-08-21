(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('RatersCtrl', ['$scope', 'navigationService',
        function($scope, navigationService) {
            navigationService.setPageTitle('Raters');

            $scope.message = 'Info for raters';
        }]);

}()); // use strict
