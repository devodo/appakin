'use strict';

exports.init = function init(app) {

    app.get('/api/name', function (req, res) {
        res.json({name: 'Steve!'});
    });
	
};
