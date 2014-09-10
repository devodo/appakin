(function () {'use strict';

    angular.module('appAkin').controller('HomeCtrl', function($scope, pageTitle, search) {
        pageTitle.setPageTitle('Search for your next app');
        search.resetSearchTerm();
    });

}()); // use strict
