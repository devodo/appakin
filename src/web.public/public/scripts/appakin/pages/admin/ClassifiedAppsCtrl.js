(function () {'use strict';

    angular.module('appAkin').controller('ClassifiedAppsCtrl', function($scope, search, pageTitle, $document, classifiedApps, classifiedAppsApi) {
        pageTitle.setPageTitle('Classified Apps');
        search.resetSearchTerm();
        $document.scrollTo(0);

        $scope.classifiedApps = classifiedApps;
        $scope.classifiedAppsData = [];

        $scope.submitForm = function() {
            classifiedAppsApi
                .get(classifiedApps.seedCategoryId, classifiedApps.include)
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
            });
        };
    });

}()); // use strict
