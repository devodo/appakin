(function () {
    'use strict';

    angular.module('appAkin.config', [])
        //.constant('webApiUrl', 'http://10.0.1.6:3002/')
        //.constant('webApiUrl', 'http://10.0.1.2:3002/')
        //.constant('webApiUrl', 'http://192.168.0.4:3002/')
        .constant('webApiUrl', 'http://localhost:3003/')
        .constant('cacheApiRequests', false)
        .constant('angularDebugInfo', false)
        .constant('googleAnalyticsTracking', false);

}()); // use strict
