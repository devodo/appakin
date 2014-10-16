(function () {'use strict';

    angular.module('appAkin')
        .controller(
            'AppCtrl',
            function($scope, $document, $route, search, pageTitle, app,
                     url, platform, display, firstSectionFilter, createSupportedDevicesArrayFilter) {
                var appData = $route.current.locals.appData;
                appData.firstSection = firstSectionFilter(appData.description);
                appData.supportedDevicesArray = createSupportedDevicesArrayFilter(appData.supportedDevices);

                if (appData && !appData.serverError) {
                    pageTitle.setPageTitle(appData.name + ' on appAkin');
                } else {
                    pageTitle.setPageTitle('appAkin');
                }

                $document.scrollTo(0);

                search.resetSearchTerm();
                app.updateSearch();

                $scope.appData = appData;
                $scope.app = app;
                $scope.url = url;
                $scope.platform = platform;
                $scope.display = { fullDescription: false };

                $scope.getLinkTarget = function() {
                    return display.isIOS ? '_self' : '_blank';
                };

                $scope.toggleFullDescription = function() {
                    $scope.display.fullDescription = !$scope.display.fullDescription;
                };
            });

}()); // use strict
