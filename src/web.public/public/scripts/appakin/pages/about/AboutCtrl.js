(function () {'use strict';

    angular.module('appAkin').controller('AboutCtrl', function($scope, search, pageTitle) {
        pageTitle.setPageTitle('About appAkin');
        search.resetSearchTerm();
    });

}()); // use strict
