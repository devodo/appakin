(function () {'use strict';

    angular.module('appAkin')
        .controller('AppCtrl', function($scope, $timeout, $route, search, pageTitle, app, url, platform) {
            var appData = $route.current.locals.appData;
            var monthNames = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sept", "Oct", "Nov", "Dec" ];

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

            $scope.display = {
                fullDescription: false
            };

            $scope.toggleFullDescription = function() {
                $scope.display.fullDescription = !$scope.display.fullDescription;
            };

            $scope.formatPrice = function(price) {
                if (price === 0) {
                    return 'Free';
                } else if (price < 100) {
                    return price + '¢';
                }

                return '$' + price / 100;
            };

            $scope.formatVoteCount = function(voteCount) {
                if (voteCount > 1000000) {
                    return '99,999+';
                }

                if (voteCount > 1000) {
                    return Math.floor(voteCount / 1000) + ',' + voteCount % 1000;
                }

                return voteCount;
            };

            $scope.formatSize = function(fileSizeBytes) {
                if (fileSizeBytes < 1024) {
                    return fileSizeBytes + ' B';
                } else if (fileSizeBytes < 1048576) {
                    return Math.round(fileSizeBytes / 1024.0) + ' kB';
                } else {
                    return Math.round(fileSizeBytes / 1048576.0) + ' MB';
                }
            };

            $scope.getSupportedDevices = function(supportedDevices) {
                var result = [];
                var device = null;
                var iPhone = false;
                var iPad = false;
                var iPodTouch = false;

                for (var i = 0; i < supportedDevices.length; i++) {
                    device = supportedDevices[i];

                    if (!iPhone && device.indexOf('iPhone') === 0) {
                        iPhone = true;
                    } else if (!iPad && device.indexOf('iPad') === 0) {
                        iPad = true;
                    } else if (!iPodTouch && device.indexOf('iPodTouch') === 0) {
                        iPodTouch = true;
                    }
                }

                if (iPhone) { result.push('iPHONE'); }
                if (iPad) { result.push('iPAD'); }
                if (iPodTouch) { result.push('iPOD'); }

                return result;
            };

            $scope.formatDate = function(dateString) {
                var date = new Date(dateString);
                return monthNames[date.getMonth()] + ' ' + date.getFullYear();
            };

            $scope.getScreenShotsUrls = function() {
                var result = [];
                var i;

                for (i = 0; i < app.data.screenShotUrls.length; ++i) {
                    result.push(app.data.screenShotUrls[i]);
                }

                for (i = 0; i < app.data.ipadScreenShotUrls.length; ++i) {
                    result.push(app.data.ipadScreenShotUrls[i]);
                }

                return result;
            };

            app.updateSearch();
        });

}()); // use strict
