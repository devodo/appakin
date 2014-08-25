(function () {
    'use strict';

    var appAkin = require('./appakin.js');

    appAkin.factory('navigationService', ['$cookies', '$routeParams', '$location', '$rootScope',
        function($cookies, $routeParams, $location, $rootScope) {

            var initialPageTitle = 'App Akin';
            var pageTitle = initialPageTitle;
            var onHomePage = getOnHomePage();

            function getOnHomePage() {
                var url = $location.url();
                return (url === '/' || /^\/\?/.test(url));
            }

            $rootScope.$on('$locationChangeSuccess', function () {

                onHomePage = getOnHomePage();
            });

            return {
                onHomePage: onHomePage,
                getOnHomePage: function() { return onHomePage; },
                getPageTitle: function() { return pageTitle; },
                setPageTitle: function(value) {
                    this.pageTitle = initialPageTitle + ' | ' + value;
                },
                setSection: function(value) {
                    var newValue = (value === 'home');

                    if (this.onHomePage !== newValue)
                    {
                        this.onHomePage = newValue;
                    }
                }
            };
        }]);

}()); // use strict
