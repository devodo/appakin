(function () {'use strict';

    angular.module('appAkin')
        .controller(
            'AppCtrl',
            function($scope, $document, $route, search, pageTitle, app,
                     url, platform, display, firstSectionFilter, createSupportedDevicesArrayFilter,
                     googleAnalyticsTracking) {
                var appData = $route.current.locals.appData;
                appData.firstSection = firstSectionFilter(appData.description);
                appData.supportedDevicesArray = createSupportedDevicesArrayFilter(appData.supportedDevices);

                if (appData && !appData.serverError) {
                    pageTitle.setPageTitle(appData.name + ' on AppAkin');
                } else {
                    pageTitle.setPageTitle('AppAkin');
                }

                $document.scrollTo(0);

                search.resetSearchTerm();
                app.updateSearch();

                var relativeOutUrl = url.createAppStoreOutRelativeUrl('ios', appData.extId, app.fromCategoryExtId);
                $scope.outUrl = url.createAppStoreOutUrl(relativeOutUrl);

                $scope.analyticsEvent = 'AppStoreLinkClicked';
                $scope.analyticsCategory = 'Affiliation';
                $scope.analyticsLabel = appData.name ? appData.name.substring(0, 75) + ' ' + relativeOutUrl : relativeOutUrl;

                $scope.appData = appData;
                $scope.app = app;
                $scope.url = url;
                $scope.platform = platform;
                $scope.display = { fullDescription: false };
                $scope.googleAnalyticsTracking = googleAnalyticsTracking;

                $scope.getLinkTarget = function() {
                    return display.isIOS ? '_self' : '_blank';
                };

                $scope.toggleFullDescription = function() {
                    $scope.display.fullDescription = !$scope.display.fullDescription;
                };
            });

}()); // use strict
