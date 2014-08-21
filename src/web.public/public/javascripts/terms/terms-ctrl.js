(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('TermsCtrl', ['$scope', 'navigationService',
        function($scope, navigationService) {
            navigationService.setPageTitle('Terms & Conditions');

            $scope.message = 'Terms of this app';
        }]);

}()); // use strict
