(function () {'use strict';

    angular.module('appAkin').controller('CategoryCtrl', function($scope, pageTitle, category) {
        pageTitle.setPageTitle('Category');

        $scope.category = category;

        category.updateSearch();
        category.get();
    });

}()); // use strict
