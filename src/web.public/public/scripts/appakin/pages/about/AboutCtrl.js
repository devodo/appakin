(function () {'use strict';

    angular.module('appAkin').controller('AboutCtrl', function($scope, search, pageTitle, $document) {
        pageTitle.setPageTitle('About appAkin');
        search.resetSearchTerm();
        $document.scrollTo(0);
    });

}()); // use strict
