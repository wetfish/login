// Required modules
var async = require('async');
var validator = require('validator');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

// Variables passed from server.js
var client, model, app, sendgrid;


// Helper functions
function check_username(username, callback)
{
    client[2].get(username, callback);
}

function check_email(email, callback)
{
    client[3].get(email, callback);
}

function check_existing(username, email, callback)
{
    async.parallel([
        model.async(null, check_username, [username]),
        model.async(null, check_email, [email])
    ],

    function(error, response)
    {
        // Return the response to the callback
        callback(error, response);
    });
}

function generate_id(database, callback)
{
    var salt = crypto.randomBytes(32).toString('base64');
    var noise = crypto.randomBytes(32).toString('base64');
    var unique_id = crypto.createHmac("sha256", salt).update(noise).digest("hex");

    // Check to make sure the generated ID doesn't already exist in redis
    client[database].get(unique_id, function(error, response)
    {
        // If this user_id isn't taken
        if(response == null)
            callback(unique_id);

        // Otherwise try generating again (hahah there was a collision, YEAH RIGHT)
        else
            generate_token(database, callback);
    });
}

// Module called by express
module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    sendgrid = required.sendgrid;
    
    app.get('/register', function(req, res)
    {
        console.log("GET: /register");
        res.render('register', {
            title: 'Register',
            partials: {
                head: 'partials/head',
                foot: 'partials/foot'
            }
        });
    });

    // TODO: Split this stuff into separate functions to avoid the MASSIVE NESTING
    // TODO: Normalize error output
    app.post('/register', function(req, res)
    {
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
            if(response[0])
                errors.username = "This username is taken";

            if(response[1])
                errors.email = "This email is already in use";

            if(validator.isEmail(username))
                errors.username = "Your username cannot be an email";

            if(!validator.isEmail(email))
                errors.email = "Your email is invalid";
                
            if(req.body.password.length < 8)
                errors.password = "Your password is too short";

            if(req.body.password != req.body.confirm)
                errors.confirm = "Your passwords do not match";

            // If an error has been set
            if(Object.keys(errors).length)
            {
                res.send(JSON.stringify(errors));
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
                        generate_id(4, function(token)
                        {
                            // Generate user ID
                            generate_id(1, function(user_id)
                            {
                                var user_data =
                                {
                                    username: username,
                                    email: email,
                                    password: password,
                                    token: token,
                                    created: new Date().getTime(),
                                    verified: false
                                };

                                // Automatically delete new users after 24 hours
                                var timeout = 60 * 60 * 24;

                                // Save member information in redis
                                async.parallel([
                                    model.async(client[1], client[1].setex, [user_id, timeout, JSON.stringify(user_data)]),
                                    model.async(client[2], client[2].setex, [username, timeout, user_id]),
                                    model.async(client[3], client[3].setex, [email, timeout, user_id]),
                                    model.async(client[4], client[4].setex, [token, timeout, user_id]),
                                ],

                                function(error, response)
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
                                            html    : '<p>Your wetfish account (<strong>'+username+'</strong>) has been successfully registered!</p>' +
                                                      '<p>Please click the following link to activate your account.</p>' +
                                                      '<a href="https://login.wetfish.net/verify?token="'+token+'" target="_blank">https://login.wetfish.net/verify?token='+token+'</a>' +
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
                                        res.send(JSON.stringify({'status': 'error', 'errors': {'unknown': 'An error occured while saving your account information'}}));
                                        res.end();
                                    }
                                });
                            });
                        });
                    }
                    else
                    {
                        res.send(JSON.stringify({'unknown': 'An error occured while generating your password'}));
                        res.end();
                    }
                });
            }
        })
    });
}
