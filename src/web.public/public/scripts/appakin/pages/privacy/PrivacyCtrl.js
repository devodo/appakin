(function () {'use strict';

    angular.module('appAkin').controller('PrivacyCtrl', function($scope, $document, search, pageTitle) {
        pageTitle.setPageTitle('appAkin Privacy & Cookie Policy');
        search.resetSearchTerm();
        $document.scrollTo(0);
    });

}()); // use strict
