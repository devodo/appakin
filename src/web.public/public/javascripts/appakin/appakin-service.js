(function () {'use strict';

    var appAkin = require('./appakin.js');

    // rename to appState
    appAkin.factory('appService', ['$cookies', '$routeParams',
        function($cookies, $routeParams) {

            function normalisePlatform(platform) {
                if (!(/(ios|android|winphone)/).test(platform)) {
                    return undefined;
                }

                return platform;
            }

            function getInitialPlatform() {
                var defaultPlatform = 'ios';
                return defaultPlatform;

                // TODO: remove the above return line when App Akin supports multiple platforms.

                var initialPlatform = normalisePlatform($routeParams.platform);

                if (initialPlatform === undefined) {
                    initialPlatform = normalisePlatform($cookies.platform);
                }

                if (initialPlatform === undefined) {
                    var clientStrings = [
                        {s: 'winphone', r: /Windows Phone/},
                        {s: 'android', r: /Android/},
                        {s: 'ios', r: /(iPhone|iPad|iPod|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/}
                    ];

                    for (var id in clientStrings) {
                        var cs = clientStrings[id];
                        if (cs.r.test(navigator.userAgent)) {
                            initialPlatform = cs.s;
                            break;
                        }
                    }
                }

                if (initialPlatform === undefined) {
                    initialPlatform = defaultPlatform;
                }

                $cookies.platform = initialPlatform;

                return initialPlatform;
            }

            function getInitialPageTitle() { return 'App Akin'; }

            // maybe turn this into events.
            return {
                pageTitle: getInitialPageTitle(),
                platform: getInitialPlatform(),
                onHomePage: true,
                setPageTitleSection: function(section) {
                    this.pageTitle = getInitialPageTitle() + ' | ' + section;
                },
                setSection: function(section) {
                    var newValue = (section === 'home');

                    if (this.onHomePage !== newValue)
                    {
                        this.onHomePage = newValue;
                    }
                },
                setPlatform: function(platform) {
                    if (platform !== this.platform)
                    {
                        this.platform = platform;
                        $cookies.platform = this.platform;
                    }
                }
            };
    }]);

}()); // use strict