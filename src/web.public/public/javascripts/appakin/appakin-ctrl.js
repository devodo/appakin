(function () {'use strict';

    var appAkin = require('./appakin.js');

    appAkin.controller('AppAkinCtrl', ['$scope', 'navigationService',
        function($scope, navigationService) {
            $scope.$watch(
                function(){return navigationService.getPageTitle();},
                function(newValue){$scope.pageTitle = newValue;});
        }]);

}()); // use strict
