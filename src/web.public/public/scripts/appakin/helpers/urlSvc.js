(function () {
    'use strict';

    angular.module('appAkin').factory('url', function(search) {
        return {
            createCategoryUrl: function(platform, urlName) {
                return '/' + platform + '/category/' + urlName;
            },
            createAppUrl: function(platform, urlName) {
                return '/' + platform + '/app/' + urlName;
            },
            createSearchUrl: function(query) {
                return '/search?q='+encodeURIComponent(query) +
                    '&p='+encodeURIComponent(search.platform) +
                    '&type='+encodeURIComponent(search.searchType);
            }
        };
    });

}()); // use strict
