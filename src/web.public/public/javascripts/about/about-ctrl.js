(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('AboutCtrl', ['$scope', 'appService', function($scope, appService) {
        //$scope.pageTitle = appService.pageTitle;
        $scope.message = 'About this app';
    }]);

}()); // use strict
