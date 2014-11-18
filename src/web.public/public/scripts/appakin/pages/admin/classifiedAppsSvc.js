(function () {
    'use strict';

    angular.module('appAkin').factory('classifiedApps',
        function() {
            var me = this;

            me.service = {
                seedCategoryId: 1,
                include: true,
                boost: 1,
                skip: 0,
                take: 400
            };

            return me.service;
        });

}()); // use strict
