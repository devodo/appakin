(function () {'use strict';

    angular.module('appAkin').controller('AppCtrl', function($scope, pageTitle, app) {
        pageTitle.setPageTitle('App');

        $scope.app = app;

        app.updateSearch();
        app.get();
    });

}()); // use strict
