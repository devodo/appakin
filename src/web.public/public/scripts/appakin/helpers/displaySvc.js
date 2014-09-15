(function () {
    'use strict';

    angular.module('appAkin').factory('display', function($window) {
        function isHighDensity(){
            return (($window.matchMedia && ($window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || $window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || ($window.devicePixelRatio && $window.devicePixelRatio > 1.3));
        }

        function isRetina(){
            return (($window.matchMedia && ($window.matchMedia('only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx), only screen and (min-resolution: 75.6dpcm)').matches || $window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min--moz-device-pixel-ratio: 2), only screen and (min-device-pixel-ratio: 2)').matches)) || ($window.devicePixelRatio && $window.devicePixelRatio > 2)) && /(iPad|iPhone|iPod)/g.test($window.navigator.userAgent);
        }

        return {
            isHighDensity: isHighDensity(),
            isRetina: isRetina()
        };
    });

}()); // use strict
