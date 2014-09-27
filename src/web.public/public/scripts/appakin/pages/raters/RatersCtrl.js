(function () {'use strict';

    angular.module('appAkin').controller('RatersCtrl', function($scope, search, pageTitle) {
        pageTitle.setPageTitle('appAkin Raters');
        search.resetSearchTerm();
    });

}()); // use strict
