(function () {
    'use strict';

    angular.module('appAkin').factory('url', function(search, $rootScope) {
        var appleAppStoreImageUrlRegex = /jpg$|png$|tif$/;

        return {
            createCategoryUrl: function(platform, urlName) {
                return '/' + platform + '/category/' + urlName;
            },
            createAppUrl: function(platform, urlName) {
                return '/' + platform + '/app/' + urlName;
            },
            createSearchUrl: function(query, searchType) {
                return '/search?q='+encodeURIComponent(query) +
                    '&p='+encodeURIComponent(search.platform) +
                    '&type='+encodeURIComponent(searchType);
            },
            createAppleAppStoreImageUrl: function(originalUrl, requiredSize) {
                var strippedUrl = originalUrl.replace(appleAppStoreImageUrlRegex, '');
                console.log(strippedUrl);
                return strippedUrl + requiredSize + 'x' + requiredSize + '-75.png';
            }
        };
    });

}()); // use strict
