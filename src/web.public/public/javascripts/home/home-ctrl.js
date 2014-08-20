(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('HomeCtrl', ['$scope', 'appService', function($scope, appService) {
        appService.setPageTitleSection('Home');
        appService.setSection('home');

        $scope.message = 'A search box.';
    }]);

}()); // use strict
