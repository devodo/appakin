(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('HomeCtrl', ['$scope', 'appService', function($scope, appService) {
        //$scope.pageTitle = appService.pageTitle;
        $scope.message = 'A search box.';
    }]);

}()); // use strict
