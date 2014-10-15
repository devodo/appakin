(function () {'use strict';

    angular.module('appAkin').controller('TermsCtrl', function($scope, $document, search, pageTitle) {
        pageTitle.setPageTitle('appAkin Terms & Conditions');
        search.resetSearchTerm();
        $document.scrollTo(0);
    });

}()); // use strict
