(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('HomeCtrl', ['$scope', 'navigationService',
        function($scope, navigationService) {
            navigationService.setPageTitle('Search for apps');

            $scope.message = 'The home page!';
        }]);

}()); // use strict
