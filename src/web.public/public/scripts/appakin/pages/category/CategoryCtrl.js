(function () {'use strict';

    angular.module('appAkin').controller('CategoryCtrl', function($scope, pageTitle, category, url,platform) {
        pageTitle.setPageTitle('');

        $scope.category = category;
        $scope.url = url;
        $scope.platform = platform;

        category.updateSearch();
        category.get();
    });

}()); // use strict
