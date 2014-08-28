(function () {
    'use strict';

    angular.module('appAkin').factory('url', function() {
        return {
            createCategoryUrl: function(platform, urlName) {
                console.log('category url');
                return '/' + platform + '/category/' + urlName;
            },
            createAppUrl: function(platform, urlName) {
                return '/' + platform + '/app/' + urlName;
            }
        };
    });

}()); // use strict
