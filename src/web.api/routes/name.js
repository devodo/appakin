'use strict';

exports.init = function init(app) {

    app.get('/name', function (req, res) {
        res.json({name: 'Steve!'});
    });
	
};
