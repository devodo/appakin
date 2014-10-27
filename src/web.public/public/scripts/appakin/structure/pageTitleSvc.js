(function () {
    'use strict';

    angular.module('appAkin').factory('pageTitle', function() {
        var me = this;
        var initialPageTitle = 'AppAkin';

        me.service = {
            pageTitle: initialPageTitle,
            setPageTitle: function(value) {
                me.service.pageTitle = value;
            }
        };

        return me.service;
    });

}()); // use strict
