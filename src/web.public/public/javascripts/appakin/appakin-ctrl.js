(function () {'use strict';

    var appAkin = require('./appakin.js');
    require('./appakin-service.js');

    appAkin.controller('AppAkinCtrl', ['$scope', 'appService', function($scope, appService) {
        $scope.pageTitle = appService.pageTitle;
    }]);

}()); // use strict
