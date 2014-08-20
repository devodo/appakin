(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('SearchCtrl', ['$scope', 'appService', function($scope, appService) {
        appService.setPageTitleSection('Search');
        appService.setSection('search');
        
        $scope.message = 'Search results!';
    }]);

}()); // use strict
