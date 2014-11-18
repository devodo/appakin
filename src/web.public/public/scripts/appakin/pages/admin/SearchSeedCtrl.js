(function () {'use strict';

    angular.module('appAkin').controller('SearchSeedCtrl', function($scope, search, pageTitle, $document, classifiedApps, classifiedAppsApi) {
        pageTitle.setPageTitle('Search Seed');
        search.resetSearchTerm();
        $document.scrollTo(0);

        $scope.classifiedApps = classifiedApps;
        $scope.searchSeedAppsData = {};

        $scope.submitForm = function() {
            classifiedAppsApi
                .getSearchSeedApps(classifiedApps.seedCategoryId, classifiedApps.boost, classifiedApps.skip, classifiedApps.take)
                .then(function(data) {
                    if (data && !data.serverError) {
                        console.log('got data');
                        $scope.searchSeedAppsData = data;
                    }
                });
        };

        $scope.updateTrainingData = function(extId, seedCategoryId, include, searchSeedApp) {
            classifiedAppsApi.updateTrainingData(extId, seedCategoryId, include, function() {
                searchSeedApp.isTrainingData = true;
                searchSeedApp.include = include;
            });
        };

        $scope.deleteTrainingData = function(extId, seedCategoryId, searchSeedApp) {
            classifiedAppsApi.deleteTrainingData(extId, seedCategoryId, function() {
                searchSeedApp.isTrainingData = false;
                searchSeedApp.include = null;
            })
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
