(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('TermsCtrl', ['$scope', 'appService', function($scope, appService) {
        //$scope.pageTitle = appService.pageTitle;
        $scope.message = 'Terms of this app';
    }]);

}()); // use strict
