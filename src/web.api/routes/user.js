'use strict';
var crypto = require('crypto');

function sanitiseInputToString(input) {
    if (!input && input !== 0) {
        return '';
    }

    return input.toString().trim();
}

exports.init = function init(app) {
    app.post('/api/user/login', function (req, res, next) {
        var username = req.body.username;
        var password = req.body.password;

        //query for user here to get password hash and salt

        crypto.pbkdf2('secret', 'salt', 1024, 256, 'sha256', function(err, key) {
            if (err) { return next(err); }
            console.log(key.toString('hex'));  // 'c5e478d...1469e50'
        });


        res.json({
            message: 'pong',
            date: new Date()
        });
    });

    app.post('/api/user/register', function (req, res, next) {
        var username = sanitiseInputToString(req.body.username);
        var email = sanitiseInputToString(req.body.email);
        var password = sanitiseInputToString(req.body.password);

        if (username.length === 0)
        {
            return res.status(400).json({error: 'username is required'});
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({error: 'username must be between 3 and 20 characters'});
        }

        if (!/^[A-Za-z0-9\-_]+$/g.test(username)) {
            return res.status(400).json({error: 'username must contain only letters, numbers, "-", and "_"'});
        }

        if (password.length < 6)
        {
            return res.status(400).json({error: 'the password must be at least 6 characters'});
        }

        if (!/^[^@]+@[^@]+$/g.test(email)) {
            return res.status(400).json({error: 'email address is invalid'});
        }

        //query for user here to get password hash and salt

        crypto.pbkdf2('secret', 'salt', 1024, 256, 'sha256', function(err, key) {
            if (err) { return next(err); }
            console.log(key.toString('hex'));  // 'c5e478d...1469e50'
        });


        res.json({
            message: 'pong',
            date: new Date()
        });
    });
};
