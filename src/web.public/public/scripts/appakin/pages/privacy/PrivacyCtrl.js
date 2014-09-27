(function () {'use strict';

    angular.module('appAkin').controller('PrivacyCtrl', function($scope, search, pageTitle) {
        pageTitle.setPageTitle('appAkin Privacy & Cookie Policy');
        search.resetSearchTerm();
    });

}()); // use strict
