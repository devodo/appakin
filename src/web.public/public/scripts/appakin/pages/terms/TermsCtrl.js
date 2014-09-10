(function () {'use strict';

    angular.module('appAkin').controller('TermsCtrl', function($scope, search, pageTitle) {
        pageTitle.setPageTitle('Terms & Conditions');
        search.resetSearchTerm();
    });

}()); // use strict
