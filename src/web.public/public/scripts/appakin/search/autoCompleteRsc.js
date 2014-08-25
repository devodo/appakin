(function () {
    'use strict';

    angular.module('appAkin').factory('autoComplete', function($resource) {
        return $resource("http://localhost:3002/api/search/autocomplete");
    });

}()); // use strict
