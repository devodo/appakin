(function () {'use strict';

    var appAkin = require('./app.js');

    appAkin.factory('appService', function() {
        var appService = {pageTitle: 'Ham'};
        return appService;
    });

}()); // use strict