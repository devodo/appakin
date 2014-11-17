(function () {'use strict';

    angular.module('appAkin').controller('SearchSeedCtrl', function($scope, search, pageTitle, $document, classifiedApps, classifiedAppsApi) {
        pageTitle.setPageTitle('Search Seed');
        search.resetSearchTerm();
        $document.scrollTo(0);

        $scope.classifiedApps = classifiedApps;
        $scope.searchSeedAppsData = {};
        $scope.skip = 0;
        $scope.take = 200;

        $scope.submitForm = function() {
            classifiedAppsApi
                .getSearchSeedApps(classifiedApps.seedCategoryId, classifiedApps.boost, $scope.skip, $scope.take)
                .then(function(data) {
                    if (data && !data.serverError) {
                        console.log('got data');
                        $scope.searchSeedAppsData = data;
                    }
                });
        };

        $scope.updateTrainingData = function(extId, seedCategoryId, include, searchSeedApp) {
            classifiedAppsApi.updateTrainingData(extId, seedCategoryId, include, function() {
                searchSeedApp.updated = true;
            });
        };
    });

}()); // use strict