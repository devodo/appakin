(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('AppCtrl', ['$scope', 'appService', function($scope, appService) {
        appService.setPageTitleSection('App');
        appService.setSection('app');

        $scope.message = 'Info on an app';
    }]);

}()); // use strict
