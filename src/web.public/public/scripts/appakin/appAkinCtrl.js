(function () {
    'use strict';

    angular.module('appAkin').controller('AppAkin', function($scope, pageTitle, $rootScope, loading) {
        $scope.pageTitle = pageTitle;

        $rootScope.$on('$locationChangeSuccess', function() {
            console.log('spinner reset');
            loading.reset();
        });
    });

}()); // use strict
