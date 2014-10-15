(function () {'use strict';

    angular.module('appAkin')
        .controller(
            'AppCtrl',
            function($scope, $document, $route, search, pageTitle, app,
                     url, platform, display, firstSectionFilter, createSupportedDevicesArrayFilter) {
                var appData = $route.current.locals.appData;

                if (appData && !appData.serverError) {
                    pageTitle.setPageTitle(appData.name + ' on appAkin');
                } else {
                    pageTitle.setPageTitle('appAkin');
                }

                $document.scrollTo(0);

                search.resetSearchTerm();
                app.data = appData;
                app.data.firstSection = firstSectionFilter(app.data.description);

                $scope.app = app;
                $scope.url = url;
                $scope.platform = platform;

                $scope.display = {
                    fullDescription: false
                };

                $scope.getLinkTarget = function() {
                    return display.isIOS ? '_self' : '_blank';
                };

                $scope.toggleFullDescription = function() {
                    $scope.display.fullDescription = !$scope.display.fullDescription;
                };

                $scope.supportedDevices = createSupportedDevicesArrayFilter(app.data.supportedDevices);

                app.updateSearch();
            });

}()); // use strict
