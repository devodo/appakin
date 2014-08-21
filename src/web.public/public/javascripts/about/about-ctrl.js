(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('AboutCtrl', ['$scope', 'navigationService',
        function($scope, navigationService) {
            navigationService.setPageTitle('About us!');

            $scope.message = 'About this app';
    }]);

}()); // use strict
