(function () {
    'use strict';

        angular.module('appAkin').filter('trim', function($window) {
            return function(input, noOfChars) {
                if (input.length > noOfChars)
                    return input.substring(0, noOfChars - 3) + '...';
                else
                    return input;
            };
    });

}()); // use strict
