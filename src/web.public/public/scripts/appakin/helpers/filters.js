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

    angular.module('appAkin').filter('firstSection', function($window) {
        var maxSectionLength = 400;

        return function(input, maxLength) {
            maxLength = maxLength || maxSectionLength;

            if (input.length <= maxLength) {
                return input;
            }

            var trimmedInput = input.substring(0, maxLength).trim();

            var indexOfNewline = trimmedInput.lastIndexOf('\n');

            if (indexOfNewline > 0) {
                return input.substring(0, indexOfNewline);
            }

            var indexOfLastSpace = trimmedInput.lastIndexOf(' ');

            if (indexOfLastSpace > (maxLength / 2)) {
                return trimmedInput.substring(0, indexOfLastSpace) + ' ...';
            }

            return trimmedInput + ' ...';
        };
    });

    angular.module('appAkin').filter('formatPrice', function() {
        return function(price) {
            if (price === 0) {
                return 'Free';
            } else if (price < 100) {
                return price + '¢';
            }

            return '$' + price / 100;
        };
    });

    angular.module('appAkin').filter('removeRules', function() {
        return function(value) {
            return value.replace(/-{3,}/g, '');
        }
    });

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
