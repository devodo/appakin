(function () {'use strict';

    var appAkin = angular.module('appAkin', [
        'ngRoute',
        'ngCookies',
        'ngResource',
        'ui.bootstrap.pagination',
        'autocomplete'
    ]);

    appAkin.config(function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'appakin/pages/home/home.html',
                controller: 'HomeCtrl'
            })
            .when('/raters', {
                templateUrl: 'appakin/pages/raters/raters.html',
                controller: 'RatersCtrl'
            })
            .when('/about', {
                templateUrl: 'appakin/pages/about/about.html',
                controller: 'AboutCtrl'
            })
            .when('/terms', {
                templateUrl: 'appakin/pages/terms/terms.html',
                controller: 'TermsCtrl'
            })
            .when('/search', {
                templateUrl: 'appakin/pages/search-results/search-results.html',
                controller: 'SearchResultsCtrl',
                reloadOnSearch: false
            })
            .when('/category/:platform/:categoryName', {
                templateUrl: 'appakin/pages/category/category.html',
                controller: 'CategoryCtrl'
            })
            .when('/app/:platform/:platformName', {
                templateUrl: 'appakin/pages/app/app.html',
                controller: 'AppCtrl'
            })
            .when('/privacy', {
                templateUrl: 'appakin/pages/privacy/privacy.html',
                controller: 'PrivacyCtrl'
            })
            .otherwise({
                redirectTo: '/'
            });

        $locationProvider.html5Mode(true);
    });

}()); // use strict
