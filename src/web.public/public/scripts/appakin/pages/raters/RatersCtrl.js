(function () {'use strict';

    angular.module('appAkin').controller('RatersCtrl', function($scope, search, pageTitle) {
        pageTitle.setPageTitle('Raters');
        search.resetSearchTerm();
    });

}()); // use strict
