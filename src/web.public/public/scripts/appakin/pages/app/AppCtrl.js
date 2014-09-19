(function () {'use strict';

    angular.module('appAkin')
        .controller('AppCtrl', function($scope, $route, search, pageTitle, app, url, platform) {
            pageTitle.setPageTitle('');
            search.resetSearchTerm();
            app.data = $route.current.locals.appData;

            $scope.app = app;
            $scope.url = url;
            $scope.platform = platform;

            app.updateSearch();
            //app.get();
        });

}()); // use strict
