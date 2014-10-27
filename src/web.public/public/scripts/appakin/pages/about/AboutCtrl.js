(function () {'use strict';

    angular.module('appAkin').controller('AboutCtrl', function($scope, search, pageTitle, $document) {
        pageTitle.setPageTitle('About AppAkin');
        search.resetSearchTerm();
        $document.scrollTo(0);
    });

}()); // use strict
