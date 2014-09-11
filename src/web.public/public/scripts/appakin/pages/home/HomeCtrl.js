(function () {'use strict';

    angular.module('appAkin').controller('HomeCtrl', function($scope, pageTitle, search) {
        pageTitle.setPageTitle('Find your next app');
        search.resetSearchTerm();
    });

}()); // use strict
