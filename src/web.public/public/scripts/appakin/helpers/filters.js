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
        var maxSectionLength = 450;

        return function(input, maxLength) {
            maxLength = maxLength || maxSectionLength;

            if (!input) {
                return input;
            }

            if (input.length <= maxLength) {
                return input;
            }

            var trimmedInput = input.substring(0, maxLength).trim();
            var lengthThreshold = maxLength / 1.5;

            var indexOfNewline = trimmedInput.lastIndexOf('\n');
            if (indexOfNewline > lengthThreshold) {
                return trimmedInput.substring(0, indexOfNewline).trim();
            }

            var indexOfLastPeriod = trimmedInput.lastIndexOf('.');
            if (indexOfLastPeriod > lengthThreshold) {
                return trimmedInput.substring(0, indexOfLastPeriod + 1);
            }

            var indexOfLastSpace = trimmedInput.lastIndexOf(' ');
            if (indexOfLastSpace > lengthThreshold) {
                return trimmedInput.substring(0, indexOfLastSpace) + '&hellip;';
            }

            return trimmedInput + '&hellip;';
        };
    });

    angular.module('appAkin').filter('formatVoteCount', function() {
        return function(voteCount) {
            if (voteCount > 1000000) {
                return (Math.round(voteCount / 10000) / 100) + ' m';
            }

            if (voteCount >= 1000) {
                return Math.floor(voteCount / 1000) + ',' + ('000' + voteCount % 1000).slice(-3);
            }

            return voteCount;
        };
    });

    angular.module('appAkin').filter('formatBytes', function() {
        return function(fileSizeBytes) {
            if (fileSizeBytes < 1024) {
                return fileSizeBytes + ' B';
            } else if (fileSizeBytes < 1048576) {
                return Math.round(fileSizeBytes / 1024.0) + ' kB';
            } else {
                return Math.round(fileSizeBytes / 1048576.0) + ' MB';
            }
        };
    });

    angular.module('appAkin').filter('ordinalNumber', function() {
       return function getGetOrdinal(n) {
           var s = ["th","st","nd","rd"];
           var v = n % 100;
           return n + (s[(v-20)%10]||s[v]||s[0]);
       };
    });

    angular.module('appAkin').filter('createSupportedDevicesArray', function() {
        return function(supportedDevices) {
            var result = [];
            var device = null;
            var iPhone = false;
            var iPad = false;
            var iPodTouch = false;

            if (!supportedDevices) {
                return result;
            }

            for (var i = 0; i < supportedDevices.length; i++) {
                device = supportedDevices[i];

                if (!iPhone && device.indexOf('iPhone') === 0) {
                    iPhone = true;
                } else if (!iPad && device.indexOf('iPad') === 0) {
                    iPad = true;
                } else if (!iPodTouch && device.indexOf('iPodTouch') === 0) {
                    iPodTouch = true;
                }
            }

            if (iPhone) { result.push('iPHONE'); }
            if (iPad) { result.push('iPAD'); }
            if (iPodTouch) { result.push('iPOD'); }

            return result;
        };
    });

    angular.module('appAkin').filter('formatDate', function() {
        var monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

        return function(dateString) {
            var date = new Date(dateString);
            return monthNames[date.getMonth()] + ' ' + date.getFullYear();
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
            if (!value) {
                return value;
            }

            return value.replace(/(.)\1{5,}/g, ' ');
        };
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
