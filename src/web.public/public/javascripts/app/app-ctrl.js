(function () {'use strict';

    var appAkin = require('./app.js');
    require('./app-service.js');

    appAkin.controller('AppCtrl', ['$scope', 'appService', function($scope, appService) {
        $scope.pageTitle = appService.pageTitle;
    }]);

}()); // use strict
