(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');

    appAkin.controller('CategoryCtrl', ['$scope', '$routeParams', 'navigationService',
        function($scope, $routeParams, navigationService) {
            navigationService.setPageTitle('Category');

            $scope.message = $routeParams.platform + ' ' +
                $routeParams.categoryName + ' ' +
                ($routeParams.page || 1) + ' ' +
                ($routeParams.show || 10);
    }]);

    // TODO: Maybe use controllerAs syntax: https://docs.angularjs.org/api/ng/directive/ngController#example
}()); // use strict
