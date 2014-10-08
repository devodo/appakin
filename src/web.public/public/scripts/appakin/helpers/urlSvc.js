(function () {
    'use strict';

    angular.module('appAkin').factory('url', function($rootScope, $location) {
        var appleAppStoreImageUrlRegex = /jpg$|png$|tif$/;
        var searchResultsPagePath = '/search';
        var categoryPagePathRegex = /^\/(?:ios|android|winphone)\/category\//;

        return {
            createCategoryUrl: function(platform, urlName) {
                return '/' + platform + '/category/' + urlName;
            },
            createAppUrl: function(platform, urlName) {
                return '/' + platform + '/app/' + urlName;
            },
            createSearchUrl: function(query, searchType, platform) {
                return '/search?q='+encodeURIComponent(query) +
                    '&p='+encodeURIComponent(platform) +
                    '&type='+encodeURIComponent(searchType);
            },
            createAppleAppStoreImageUrl: function(originalUrl, requiredSize) {
                var strippedUrl = originalUrl.replace(appleAppStoreImageUrlRegex, '');
                return strippedUrl + requiredSize + 'x' + requiredSize + '-75.png';
            },
            searchResultsPagePath: searchResultsPagePath,
            onSearchResultsPage: function(path) {
                return path.indexOf(searchResultsPagePath) === 0;
            },
            onCategoryPage: function(path) {
                return path.match(categoryPagePathRegex);
            },
            removeHost: function(fullUrl) {
                return fullUrl.replace(/^https?:\/\/[^\/]+/, '');
            }
        };
    });

}()); // use strict
