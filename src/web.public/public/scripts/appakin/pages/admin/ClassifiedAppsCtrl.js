(function () {'use strict';

    angular.module('appAkin').controller('ClassifiedAppsCtrl', function($scope, search, pageTitle, $document, classifiedApps, classifiedAppsApi) {
        pageTitle.setPageTitle('Classified Apps');
        search.resetSearchTerm();
        $document.scrollTo(0);

        $scope.classifiedApps = classifiedApps;
        $scope.classifiedAppsData = [];

        $scope.submitForm = function() {
            classifiedAppsApi
                .getClassifiedApps(classifiedApps.seedCategoryId, classifiedApps.include, classifiedApps.skip, classifiedApps.take)
                .then(function(data) {
                    if (data && !data.serverError) {
                        console.log('got data');
                        $scope.classifiedAppsData = data;
                    }
                });
        };

        $scope.updateTrainingData = function(extId, seedCategoryId, include, classifiedApp) {
            classifiedAppsApi.updateTrainingData(extId, seedCategoryId, include, function() {
                classifiedApp.updated = true;
                classifiedApp.include = include;
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
