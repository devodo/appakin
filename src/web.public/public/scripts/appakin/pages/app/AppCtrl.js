(function () {'use strict';

    angular.module('appAkin').controller('AppCtrl', function($scope, pageTitle, app, url, platform) {
        pageTitle.setPageTitle('');

        $scope.app = app;
        $scope.url = url;
        $scope.platform = platform;

        app.updateSearch();
        app.get();
    });

}()); // use strict
