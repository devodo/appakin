(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('AppCtrl', ['$scope', 'navigationService',
        function($scope, navigationService) {
            navigationService.setPageTitle('App');

            $scope.message = 'Info on an app';
    }]);

}()); // use strict
