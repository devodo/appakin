'use strict';

exports.init = function init(app) {

    app.get('/api/test/error-handling', function (req, res) {
        throw new Error('Deliberately thrown error.'); 
    });

    app.get('/api/test/ping', function (req, res) {
        res.json({
            message: 'pong',
            date: new Date()
        });
    });

    app.get('/api/test/not-found-handling', function (req, res) {
        var err = new Error('Deliberate Not Found');
        err.status = 404;
        throw err;
    });

};
