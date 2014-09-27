(function () {'use strict';

    angular.module('appAkin').controller('TermsCtrl', function($scope, search, pageTitle) {
        pageTitle.setPageTitle('appAkin Terms & Conditions');
        search.resetSearchTerm();
    });

}()); // use strict
