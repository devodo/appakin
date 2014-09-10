(function () {'use strict';

    angular.module('appAkin').controller('AppCtrl', function($scope, search, pageTitle, app, url, platform) {
        pageTitle.setPageTitle('');
        search.resetSearchTerm();

        $scope.app = app;
        $scope.url = url;
        $scope.platform = platform;

        app.updateSearch();
        app.get();
    });

}()); // use strict
