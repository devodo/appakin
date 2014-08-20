(function () {'use strict';

    var appAkin = require('../appakin/appakin.js');
    require('../appakin/appakin-service.js');

    appAkin.controller('CategoryCtrl', ['$scope', '$routeParams', 'appService',
        function($scope, $routeParams, appService) {
            appService.setPageTitleSection('Category');
            appService.setSection('category');

            $scope.message = $routeParams.platform + ' ' +
                $routeParams.categoryName + ' ' +
                ($routeParams.page || 1) + ' ' +
                ($routeParams.show || 10);
    }]);

    // TODO: use controllerAs syntax: https://docs.angularjs.org/api/ng/directive/ngController#example
}()); // use strict
