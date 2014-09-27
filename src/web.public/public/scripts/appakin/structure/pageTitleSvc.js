(function () {
    'use strict';

    angular.module('appAkin').factory('pageTitle', function() {
        var self = this;
        var initialPageTitle = 'appAkin';

        self.service = {
            pageTitle: initialPageTitle,
            setPageTitle: function(value) {
                self.service.pageTitle = value;
            }
        };

        return self.service;
    });

}()); // use strict
