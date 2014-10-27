(function () {'use strict';

    angular.module('appAkin').controller('CategoryCtrl', function($scope, $document, $route, search, pageTitle, category, url,platform) {
        $scope.categoryData = $route.current.locals.categoryData;

        if ($scope.categoryData && !$scope.categoryData.serverError) {
            pageTitle.setPageTitle($scope.categoryData.name + ' chart on AppAkin');
        } else {
            pageTitle.setPageTitle('AppAkin');
        }

        search.resetSearchTerm();
        category.updateSearch();

        $scope.category = category;
        $scope.url = url;
        $scope.platform = platform;

        $scope.$on('$destroy', function() {
            category.cancel();
            delete $scope.categoryData;
        });
    });

}()); // use strict
