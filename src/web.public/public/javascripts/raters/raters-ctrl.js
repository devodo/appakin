(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('RatersCtrl', ['$scope', 'appService', function($scope, appService) {
        appService.setPageTitleSection('Raters');
        appService.setSection('raters');
        
        $scope.message = 'Info for raters';
        //$scope.aa.pageTitle = 'App Akin | Raters';

    }]);

}()); // use strict
