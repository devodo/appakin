(function () {'use strict';

    angular.module('appAkin').controller('CategoryCtrl', function($scope, $route, search, pageTitle, category, url,platform) {
        var categoryData = $route.current.locals.categoryData;

        if (categoryData && !categoryData.serverError) {
            pageTitle.setPageTitle(categoryData.name + ' on appAkin');
        } else {
            pageTitle.setPageTitle('appAkin');
        }

        search.resetSearchTerm();
        category.data = categoryData;

        $scope.category = category;
        $scope.url = url;
        $scope.platform = platform;

        category.updateSearch();
    });

}()); // use strict
