(function () {
    'use strict';

    angular.module('appAkin').factory('classifiedApps',
        function() {
            var me = this;

            me.service = {
                seedCategoryId: 1,
                include: true,
                boost: 10,
                skip: 0,
                take: 400,
                imageCount: 2
            };

            return me.service;
        });

    angular.module('appAkin').directive('whenScrolled', function() {
        return function(scope, elm, attr) {
            var raw = elm[0];
            elm.bind('scroll', function() {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.whenScrolled);
                }
            });
        };
    });

}()); // use strict
