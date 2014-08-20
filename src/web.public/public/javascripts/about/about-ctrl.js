(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('AboutCtrl', ['$scope', 'appService', function($scope, appService) {
        appService.setPageTitleSection('About us!');
        appService.setSection('about');

        $scope.message = 'About this app';
    }]);

}()); // use strict
