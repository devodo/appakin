(function () {
    'use strict';

    angular.module('appAkin').factory('classifiedApps',
        function() {
            var me = this;

            me.service = {
                seedCategoryId: 1,
                include: true,
                boost: 1
            };

            return me.service;
        });

}()); // use strict
