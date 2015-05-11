(function () {'use strict';

    angular.module('appAkin').controller('ClassifiedAppsCtrl', function($scope, search, pageTitle, $document, classifiedApps, classifiedAppsApi) {
        pageTitle.setPageTitle('Classified Apps');
        search.resetSearchTerm();
        $document.scrollTo(0);

        $scope.classifiedApps = classifiedApps;
        $scope.classifiedAppsData = [];
        $scope.classifiedAppsLive = [];

        $scope.submitForm = function() {
            classifiedAppsApi
                .getClassifiedApps(classifiedApps.seedCategoryId, classifiedApps.include, classifiedApps.skip, classifiedApps.take)
                .then(function(data) {
                    if (data && !data.serverError) {
                        console.log('got data');
                        $scope.classifiedAppsData = data;
                        $scope.classifiedAppsLive = data.slice(0, 5);
                    }
                });
        };

        $scope.loadMore = function() {
            var currentAppCount = $scope.classifiedAppsLive.length;
            var totalAppCount = $scope.classifiedAppsData.length;

            if (currentAppCount < totalAppCount) {
                for (var i = currentAppCount; i < Math.min(totalAppCount, currentAppCount + 5); ++i) {
                    $scope.classifiedAppsLive.push($scope.classifiedAppsData[i]);
                }

                console.log('size: ' + $scope.classifiedAppsLive.length);
            }
        };

        $scope.updateTrainingData = function(extId, seedCategoryId, include, classifiedApp) {
            classifiedAppsApi.updateTrainingData(extId, seedCategoryId, include, function() {
                classifiedApp.updated = true;
                classifiedApp.include = include;
            });
        };

        $scope.deleteTrainingData = function(extId, seedCategoryId, classifiedApp) {
            classifiedAppsApi.deleteTrainingData(extId, seedCategoryId, function() {
                classifiedApp.isTrainingData = false;
                classifiedApp.include = false;
            });
        };

        $scope.classify = function() {
            classifiedAppsApi
                .classify(classifiedApps.seedCategoryId)
                .then(function(data) {
                    if (data && !data.serverError) {
                        alert('Classification succeeded.');
                    } else {
                        alert('Classification failed.');
                    }
                });
        };
    });

}()); // use strict
