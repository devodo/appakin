(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('SearchCtrl', ['$scope', 'appService', function($scope, appService) {
        //$scope.pageTitle = appService.pageTitle;
        $scope.message = 'Search results!';
    }]);

}()); // use strict
