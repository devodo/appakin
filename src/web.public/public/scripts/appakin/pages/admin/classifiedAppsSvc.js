(function () {
    'use strict';

    angular.module('appAkin').factory('classifiedApps',
        function() {
            var me = this;

            me.service = {
                seedCategoryId: 176,
                include: true
            };

            return me.service;
        });

}()); // use strict
