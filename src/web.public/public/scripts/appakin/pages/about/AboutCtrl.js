(function () {'use strict';

    angular.module('appAkin').controller('AboutCtrl', function($scope, search, pageTitle) {
        pageTitle.setPageTitle('About');
        search.resetSearchTerm();
    });

}()); // use strict
