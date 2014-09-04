(function () {
    'use strict';

    angular.module('appAkin').factory('platform', function($routeParams, $cookies) {
        var defaultPlatform = 'ios';
        var platformRegex = /(ios|android|winphone)/;

        var clientStrings = [
            {s: 'winphone', r: /Windows Phone/},
            {s: 'android', r: /Android/},
            {s: 'ios', r: /(iPhone|iPad|iPod|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/}
        ];

        function normalisePlatform(value) {
            return !platformRegex.test(value) ? undefined : value;
        }

        function getPlatformIfMobileClient() {
            for (var id in clientStrings) {
                var cs = clientStrings[id];
                if (cs.r.test(navigator.userAgent)) {
                    return cs.s;
                }
            }

            return undefined;
        }

        return {
            defaultPlatform: defaultPlatform,
            normalisePlatform: normalisePlatform,
            getInitialPlatform: function() {
                // TODO: active this return statement before launch.
                //return defaultPlatform;

                // First try setting platform from URL.
                var platform = normalisePlatform($routeParams.platform);
                console.log('platform from url: ' + platform);

                if (platform === undefined) {
                    // Set platform from cookie.
                    platform = normalisePlatform($cookies.platform);

                    console.log('platform from cookie: ' + platform);
                }

                if (platform === undefined) {
                    // Set platform to client if client is mobile.
                    platform = getPlatformIfMobileClient();

                    console.log('platform from mobile client: ' + platform);
                }

                if (platform === undefined) {
                    // Fallback.
                    platform = defaultPlatform;
                }

                console.log('Final initial platform: ' + platform);

                $cookies.platform = platform;
                return platform;
            },
            getFriendlyName: function(platform) {
                switch (platform) {
                    case 'ios':
                        return 'Apple';
                    case 'android':
                        return 'Android';
                    case 'winphone':
                        return 'Windows Phone';
                    default:
                        return platform;
                }
            },
            getShortFriendlyName: function(platform) {
                switch (platform) {
                    case 'ios':
                        return 'Apple';
                    case 'android':
                        return 'Android';
                    case 'winphone':
                        return 'Windows';
                    default:
                        return platform;
                }
            }
        };
    });

}()); // use strict
