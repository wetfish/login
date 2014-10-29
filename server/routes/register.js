// Required modules
var async = require('async');
var validator = require('validator');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

// Variables passed from server.js
var client, model, app, sendgrid;


function check_existing(username, email, callback)
{
    async.parallel([
        model.async(null, model.user.get, [{user_name: username}]),
        model.async(null, model.user.get, [{user_email: email}])
    ],

    function(error, response)
    {
        // Return the response to the callback
        callback(error, response);
    });
}

function generate_id(type, callback)
{
    var salt = crypto.randomBytes(32).toString('base64');
    var noise = crypto.randomBytes(32).toString('base64');
    var unique_id = crypto.createHmac("sha256", salt).update(noise).digest("hex");

    var select = {};
    select[type] = unique_id;

    // Check to make sure the generated ID doesn't already exist in the database
    model.user.get(select, function(error, response)
    {
        // If this ID is already in use, try generating again (hahah there was a collision, YEAH RIGHT)
        if(response.length)
            generate_id(type, callback);

        // Otherwise, pass our generated ID to the callback
        else
            callback(unique_id);
    });
}

// Module called by express
module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    sendgrid = required.sendgrid;
    
    app.get('/register/:action?/:id?', function(req, res)
    {
        // Users shouldn't be here if they're already logged in
        if(typeof req.session.user != "undefined")
        {
            res.redirect('/');
            return;
        }
        
        console.log("GET: /register");
        res.render('register', {
            title: 'Register',
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });

    // TODO: Split this stuff into separate functions to avoid the MASSIVE NESTING
    // TODO: Normalize error output
    app.post('/register', function(req, res)
    {
        // Users shouldn't be here if they're already logged in
        if(typeof req.session.user != "undefined")
        {
            res.redirect('/');
            return;
        }

        console.log("POST: /register");

        var username = validator.escape(req.body.username);
        var email = validator.escape(req.body.email);

        check_existing(username, email, function(error, response)
        {
            var errors = {};
            var fields = ['username', 'email', 'password', 'confirm'];

            // Make sure all fields are entered
            for(var i = 0, l = fields.length; i < l; i++)
            {
                var field = fields[i];

                if(!req.body[field])
                    errors[field] = "This field is required";
            }

            // Check other conditions
            if(response[0].length)
                errors.username = "This username is taken";

            if(response[1].length)
                errors.email = "This email is already in use";

            if(validator.isEmail(username))
                errors.username = "Your username cannot be an email";

            if(username.length > 32)
                errors.username = "Your username is too long";

            if(!validator.isEmail(email))
                errors.email = "Your email is invalid";
                
            if(req.body.password.length < 8)
                errors.password = "Your password is too short";

            if(req.body.password != req.body.confirm)
                errors.confirm = "Your passwords do not match";

            // If an error has been set
            if(Object.keys(errors).length)
            {
                res.send(JSON.stringify({'status': 'error', 'errors': errors}));
                res.end();
            }
            else
            {
                async.waterfall([
                    // Generate random salt
                    model.async(null, bcrypt.genSalt, [14]),
                    // Hash password using salt
                    model.async(null, bcrypt.hash, [req.body.password])
                ],

                function(error, password)
                {
                    if(!error && response)
                    {
                        // Generate email verification token
                        generate_id('user_token', function(token)
                        {
                            // Generate user ID
                            generate_id('user_id', function(user_id)
                            {
                                var data =
                                {
                                    user_id: user_id,
                                    user_name: username,
                                    user_email: email,
                                    user_password: password,
                                    user_token: token,
                                    user_verified: 0
                                };
                                
                                model.user.register(data, function(error, response)
                                {
                                    if(!error)
                                    {
                                        // Send verification email
                                        var message =
                                        {
                                            to      : email,
                                            from    : 'noreply@wetfish.net',
                                            fromname: 'wetfish.net',
                                            subject : 'Account Activation Code',
                                            
                                            text    : 'Your wetfish account ('+username+') has been successfully registered!\n\n' +
                                                      'Please paste the following link into your browser address bar to activate your account.\n\n' +
                                                      'https://login.wetfish.net/verify?token='+token+'\n\n' +
                                                      'If you did not create this account, simply ignore this message and the account will be automatically deleted in 24 hours.',

                                            html    : '<p>Your wetfish account (<strong>'+username+'</strong>) has been successfully registered!</p>' +
                                                      '<p>Please click the following link to activate your account.</p>' +
                                                      '<a href="https://login.wetfish.net/verify?token='+token+'" target="_blank">https://login.wetfish.net/verify?token='+token+'</a>' +
                                                      '<p>If you did not create this account, simply ignore this message and the account will be automatically deleted in 24 hours.</p>'
                                        };

                                        sendgrid.send(message, function(error, response)
                                        {
                                            if(!error)
                                            {
                                                res.send(JSON.stringify({'status': 'success', 'message': 'Thank you for registering! You should recieve an account activation email shortly.'}));
                                            }
                                            else
                                            {
                                                console.error(error);
                                                res.send(JSON.stringify({'status': 'error', 'errors': {'unknown': 'An error occured while sending your verification email'}}));
                                            }

                                            res.end();
                                        });
                                    }
                                    else
                                    {
                                        console.error(error);
                                        res.send(JSON.stringify({'status': 'error', 'errors': {'unknown': 'An error occured while saving your account information. Please try again'}}));
                                        res.end();
                                    }
                                });
                            });
                        });
                    }
                    else
                    {
                        res.send(JSON.stringify({'status': 'error', 'errors': {'unknown': 'An error occured while generating your password'}}));
                        res.end();
                    }
                });
            }
        });
    });
}
