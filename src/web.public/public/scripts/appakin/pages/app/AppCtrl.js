(function () {'use strict';

    angular.module('appAkin')
        .controller('AppCtrl', function($scope, $timeout, $route, search, pageTitle, app, url, platform) {
            var appData = $route.current.locals.appData;

            if (appData && !appData.serverError) {
                pageTitle.setPageTitle(appData.name);
            } else {
                pageTitle.setPageTitle('');
            }

            search.resetSearchTerm();
            app.data = appData;

            $scope.app = app;
            $scope.url = url;
            $scope.platform = platform;

            app.updateSearch();

            $timeout(function() {
                console.log($scope.app.data);
            }, 2000);
        });

}()); // use strict
