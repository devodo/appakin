(function () {
    'use strict';

    angular.module('appAkin').controller(
        'AppAkin',
        function($scope, $location, pageTitle, $rootScope, loading, $document, $timeout, url, search, cache) {
            $scope.pageTitle = pageTitle;

            var scrollCanBeCaptured = false;
            var viewContentLoadedTimeout = null;

            // Perform actions that crosscut the controllers.
            $rootScope.$on('$viewContentLoaded', function() {
                if (viewContentLoadedTimeout) {
                    $timeout.cancel(viewContentLoadedTimeout);
                }

                viewContentLoadedTimeout = $timeout(
                    function() {
                        var urlKey = $location.url();
                        var onSearchResultsPage = url.onSearchResultsPage(urlKey);
                        var onCategoryPage = url.onCategoryPage(urlKey);

                        // set scroll position.
                        if (onSearchResultsPage || onCategoryPage) {
                            // get the scroll position from the cache.

                            var key = createScrollCacheKey(urlKey);
                            var scrollValue = cache.get(key);

                            //console.log('Got scroll key: ' + key + ' - value ' + scrollValue);

                            if (scrollValue > 0) {
                                console.log('Scrolling to ' + scrollValue);
                                $document.scrollTop(scrollValue);
                            } else {
                                console.log('Scrolling to top');
                                $document.scrollTop(0);
                            }
                        } else {
                            // scroll to the top of the page
                            $document.scrollTop(0);
                        }

                        // reset the search term on all pages except the search results page.
                        if (!onSearchResultsPage) {
                            search.resetSearchTerm();
                        }

                        // Ensure the global spinner disappears if it is visible.
                        loading.reset();

                        scrollCanBeCaptured = true;
                    },
                    0);
            });

            $document.on('scroll', function() {
                if (!scrollCanBeCaptured) {
                    return;
                }

                var urlKey = $location.url();

                if (url.onSearchResultsPage(urlKey) || url.onCategoryPage(urlKey)) {
                    var key = createScrollCacheKey(urlKey);
                    var value = $document.scrollTop();
                    cache.set(key, value, false);
                }
            });

            $rootScope.$on('$locationChangeStart', function(event, nextLocation, currentLocation) {
                scrollCanBeCaptured = false;
            });

            function createScrollCacheKey(urlKey) {
                return 'scroll ' + urlKey;
            }
        });

}()); // use strict
