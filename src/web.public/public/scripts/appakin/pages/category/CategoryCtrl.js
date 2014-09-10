(function () {'use strict';

    angular.module('appAkin').controller('CategoryCtrl', function($scope, search, pageTitle, category, url,platform) {
        pageTitle.setPageTitle('');
        search.resetSearchTerm();

        $scope.category = category;
        $scope.url = url;
        $scope.platform = platform;

        category.updateSearch();
        category.get();
    });

}()); // use strict
