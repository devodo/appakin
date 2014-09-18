(function () {'use strict';

    angular.module('appAkin').controller('HomeCtrl', function($scope, pageTitle, search) {
        pageTitle.setPageTitle('');
        search.resetSearchTerm();
    });

}()); // use strict
