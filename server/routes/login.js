// Required modules
var async = require('async');
var bcrypt = require('bcrypt');


// Variables passed from server.js
var client, model, app;


// Helper functions
function verify_login(req, callback)
{
    var error = false;
    var errors = {};
    var fields = ['username', 'password'];

    // Make sure all fields are entered
    for(var i = 0, l = fields.length; i < l; i++)
    {
        var field = fields[i];

        if(!req.body[field])
        {
            error = true;
            errors[field] = "This field is required";
        }
    }

    // Is there an error?
    if(error)
    {
        callback({'status': 'error', 'errors': errors});
    }
    else
    {
        model.user.get({user_name: req.body.username}, function(error, response)
        {
            if(!response.length)
            {
                callback({'status': 'error', 'message': "Sorry, this user doesn't exist."});
            }
            else
            {
                var user = response[0];
                var user_data = JSON.parse(user.user_data);

                if(!user.user_verified)
                {
                    callback({'status': 'error', 'message': "You must verify your email address before loggin in."});
                }
                else
                {
                    // Verify password
                    bcrypt.compare(req.body.password, user.user_password, function(error, valid)
                    {
                        if(!valid)
                        {
                            callback({'status': 'error', 'errors': {'password': 'Invalid password!'}});
                        }
                        else
                        {
                            // Save the first and last login date for this user
                            if(typeof user_data.logged_in == "undefined")
                                user_data.logged_in = {'first': new Date().getTime()};
                            
                            user_data.logged_in.last = new Date().getTime();

                            var where = {user_id: user.user_id};
                            var update = {user_data: JSON.stringify(user_data)};

                            // Save member information
                            model.user.set(where, update, function(error, response)
                            {
                                if(error)
                                {
                                    callback({'status': 'error', 'message': "You logged in, but an error occured while saving your account information. Please try again."});
                                }
                                else
                                {
                                    // Avoid saving passwords in session data
                                    var session =
                                    {
                                        id: user.user_id,
                                        name: user.user_name,
                                        email: user.user_email
                                    };
                                    
                                    req.session.user = session;
                                    req.session.user_data = user_data;
                                    
                                    callback({'status': 'success', 'message': "You are now logged in.", 'redirect': {'url': '/', 'timeout': 2}});
                                }
                            });
                        }
                    });
                }
            }
        });
    }
}

module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/login', function(req, res)
    {
        // Users shouldn't be here if they're already logged in
        if(typeof req.session.user != "undefined")
        {
            res.redirect('/');
            return;
        }
        
        console.log("GET: /login");
        res.render('login', {
            title: 'Login',
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });

    app.post('/login', function(req, res)
    {
        // Users shouldn't be here if they're already logged in
        if(typeof req.session.user_data != "undefined")
        {
            res.redirect('/');
            return;
        }

        console.log("POST: /login");

        verify_login(req, function(response)
        {
            res.send(JSON.stringify(response));
            res.end();
        });
    });
}
