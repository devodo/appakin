(function () {'use strict';

    var appAkin = require('./appakin.js');
    require('./appakin-service.js');

    appAkin.controller('AppAkinCtrl', ['$scope', 'appService', function($scope, appService) {
        $scope.$watch(
            function(){return appService.pageTitle},
            function(newVal){$scope.pageTitle = newVal;});
    }]);

}()); // use strict
