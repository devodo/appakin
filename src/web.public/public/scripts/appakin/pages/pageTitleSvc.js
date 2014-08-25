(function () {
    'use strict';

    angular.module('appAkin').factory('pageTitle', function() {
        var self = this;
        var initialPageTitle = 'app Akin';

        self.service = {
            pageTitle: initialPageTitle,
            setPageTitle: function(value) {
                self.service.pageTitle = initialPageTitle + ' | ' + value;
            }
        };

        return self.service;
    });

}()); // use strict
