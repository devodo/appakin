(function () {'use strict';

    angular.module('appAkin').controller('RatersCtrl', function($scope, $document, search, pageTitle) {
        pageTitle.setPageTitle('AppAkin Raters');
        search.resetSearchTerm();
        $document.scrollTo(0);
    });

}()); // use strict
