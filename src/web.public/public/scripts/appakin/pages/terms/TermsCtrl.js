(function () {'use strict';

    angular.module('appAkin').controller('TermsCtrl', function($scope, $document, search, pageTitle) {
        pageTitle.setPageTitle('AppAkin Terms & Conditions');
        search.resetSearchTerm();
        $document.scrollTo(0);
    });

}()); // use strict
