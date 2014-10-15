(function () {'use strict';

    angular.module('appAkin').controller('CategoryCtrl', function($scope, $document, $route, search, pageTitle, category, url,platform) {
        var categoryData = $route.current.locals.categoryData;

        if (categoryData && !categoryData.serverError) {
            pageTitle.setPageTitle(categoryData.name + ' chart on appAkin');
        } else {
            pageTitle.setPageTitle('appAkin');
        }

        search.resetSearchTerm();
        category.updateSearch();

        $scope.categoryData = categoryData;
        $scope.category = category;
        $scope.url = url;
        $scope.platform = platform;

        $scope.$on('$destroy', function() {
            category.cancel();
        });
    });

}()); // use strict
