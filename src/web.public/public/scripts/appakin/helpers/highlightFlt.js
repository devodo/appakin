(function () {
    'use strict';

    angular.module('appAkin').filter('formatDescription', function($sanitize) {
        return function (input) {
            return input.replace(/\n/g, '<br>');
        };
    });

    angular.module('appAkin').filter('highlight', function ($sanitize) {

        var escapedRegexValue = /[-\/\\^$*+?.()|[\]{}]/g;

        var escapeRegex = function(value) {
            return value.replace(escapedRegexValue, '\\$&');
        };

        return function (input, searchParam) {
            if (typeof input === 'function') {
                return '';
            }

            if (searchParam) {
                searchParam = escapeRegex(searchParam);

                var words = searchParam.split(/\ /);
                words.forEach(function(part, index, theArray) {
                    theArray[index] = '\\b' + part;
                });

                var exp = new RegExp('(' + words.join('|') + ')', 'gi');

                if (words.length) {
                    input = input.replace(exp, "<em>$1</em>");
                }
            }

            return $sanitize(input);
        };
    });

}()); // use strict
