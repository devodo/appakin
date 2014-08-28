(function () {
    'use strict';

    angular.module('appAkin').filter('platformFriendlyName', function () {
        return function (item) {
            switch (item) {
                case 'ios':
                    return 'iOS';
                case 'android':
                    return 'Android';
                case 'winphone':
                    return 'Windows Phone';
                default:
                    return item;
            }
        };
    });

}()); // use strict
