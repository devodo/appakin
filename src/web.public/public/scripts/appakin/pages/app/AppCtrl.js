(function () {'use strict';

    angular.module('appAkin')
        .controller('AppCtrl', function($scope, $route, search, pageTitle, app, url, platform) {
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
        });

}()); // use strict
