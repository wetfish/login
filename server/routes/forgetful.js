var extend = require('util')._extend;
var validator = require('validator');
var async = require('async');
var bcrypt = require('bcrypt');
var events = require('events')
var event = new events.EventEmitter();
var client, model, app, sendgrid;

event.on('message', function(req, res, data)
{
    res.end(JSON.stringify(data));
});

event.on('render', function(req, res, options)
{
    var defaults =
    {
        user: req.session.user,
        partials:
        {
            head: 'partials/head',
            header: 'partials/header',
            foot: 'partials/foot'
        }
    };

    options = extend(defaults, options);
    res.render(options.view, options);
});

module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    sendgrid = required.sendgrid;
    
    app.get('/forgetful', function(req, res)
    {
        if(req.query.token)
        {
            // Check if token is valid
            model.redis.get('forgotten:' + req.query.token, function(error, response)
            {
                if(error || !response)
                {
                    // Display error message
                    event.emit('render', req, res, {view: 'message', title: 'Reset your password', message: {type: 'danger', message: "<strong>Error!</strong> This token is invalid. It may have expired."}});
                    return;
                }

                // Display password reset page
                event.emit('render', req, res, {view: 'reset', title: 'Reset your password', token: req.query.token});
            });
        }
        else
        {
            // Display forgotten password page
            event.emit('render', req, res, {view: 'forgetful', title: 'Forgot your password?'});
        }
    });

    app.post('/forgetful', function(req, res)
    {
        var account = validator.escape(req.body.forgetful);
        var select = {};
        var type;

        // Check if the requested account is an email
        if(validator.isEmail(account))
        {
            select['user_email'] = account;
            type = 'email';
        }
        else
        {
            select['user_name'] = account;
            type = 'username';
        }
        
        model.user.get(select, function(error, response)
        {
            if(error)
            {
                event.emit('message', req, res, {'status': 'error', 'message': 'There was an error while communicating with the database. Please try again later!'});
                return;
            }

            if(!response.length)
            {
                event.emit('message', req, res, {'status': 'error', 'message': "This "+type+" doesn't exist in our records!"});
                return;
            }

            var user = response[0];

            // Generate a unique email verification token
            model.unique('redis', model.redis.get, 'forgotten:%s', function(error, token)
            {
                if(error)
                {
                    event.emit('message', req, res, {'status': 'error', 'message': 'There was an error while communicating with the database. Please try again later!'});
                    return;
                }

                // Save token for 24 hours
                model.redis.set('forgotten:' + token, JSON.stringify(user), 'ex', '86400');

                var message =
                {
                    to      : user.user_email,
                    from    : 'noreply@wetfish.net',
                    fromname: 'wetfish.net',
                    subject : 'Password Reset Requested',
                    
                    text    : 'Looks like you forgot the password for your wetfish account ('+user.user_name+')\n\n' +
                              'Please paste the following link into your browser address bar to reset your password.\n\n' +
                              'https://login.wetfish.net/forgetful?token='+token+'\n\n' +
                              'If you did not request your password to be reset, please contact support@wetfish.net',

                    html    : '<p>Looks like you forgot the password for your wetfish account (<strong>'+user.user_name+'</strong>)</p>' +
                              '<p>Please click the following link to reset your password.</p>' +
                              '<a href="https://login.wetfish.net/forgetful?token='+token+'" target="_blank">https://login.wetfish.net/forgetful?token='+token+'</a>' +
                              '<p>If you did not request your password to be reset, please contact support@wetfish.net</p>'
                };

                // Send email
                sendgrid.send(message, function(error, response)
                {
                    if(error)
                    {
                        console.error(error);
                        event.emit('message', req, res, {'status': 'error', 'message': 'An error occured while sending your verification email'});
                        return;
                    }

                    event.emit('message', req, res, {'status': 'success', 'message': 'A reset code has been emailed to you!'});
                });
            });
        });
    });

    app.post('/reset', function(req, res)
    {
        // Verify if token is still valid
        model.redis.get('forgotten:' + req.query.token, function(error, response)
        {
            if(error || !response)
            {
                event.emit('message', req, res, {'status': 'error', 'message': 'This token is invalid. It may have expired.'});
                return;
            }

            var errors = {};
            var fields = ['password', 'confirm'];

            // Make sure all fields are entered
            for(var i = 0, l = fields.length; i < l; i++)
            {
                var field = fields[i];

                if(!req.body[field])
                    errors[field] = "This field is required";
            }

            if(req.body.password.length < 8)
                errors.password = "Your password is too short";

            if(req.body.password != req.body.confirm)
                errors.confirm = "Your passwords do not match";

            // If an error has been set
            if(Object.keys(errors).length)
            {
                event.emit('message', req, res, {'status': 'error', 'errors': errors});
                return;
            }

            async.waterfall(
            [
                // Generate random salt
                model.async(null, bcrypt.genSalt, [14]),
                // Hash password using salt
                model.async(null, bcrypt.hash, [req.body.password])
            ],

            function(error, password)
            {
                if(!error && response)
                {
                    event.emit('message', req, res, {'status': 'error', 'message': 'YEEEHAW RESET THAT HO DANGIE!! ' + req.query.token});
                    
                    // Save new password

                    // Delete token
                }
            });

        });
    });
}
