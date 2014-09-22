(function () {
    'use strict';

    angular.module('appAkin').factory('loading', function($timeout, usSpinnerService) {
        var loadingDelayedThresholdMs = 1000;
        var me = this;
        var timeoutPromise = null;

        me.service =  {
            loading: false,
            loadingDelayed: false,
            started: function() {
                me.service.reset();

                timeoutPromise = $timeout(
                    function() {
                        me.service.loadingDelayed = true;
                        usSpinnerService.spin('loading');
                        console.log('triggered spinner');
                    },
                    loadingDelayedThresholdMs);
            },
            reset: function() {
                me.service.loading = false;
                me.service.loadingDelayed = false;
                usSpinnerService.stop('loading');

                if (timeoutPromise) {
                    $timeout.cancel(timeoutPromise);
                    timeoutPromise = null;
                }
            }
        };

        return me.service;
    });

}()); // use strict
