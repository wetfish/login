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
        // Does this user exist?
        client[2].get(req.body.username.toLowerCase(), function(error, user_id)
        {
            if(!user_id)
            {
                callback({'status': 'error', 'message': "Sorry, this user doesn't exist."});
            }
            else
            {
                client[1].get(user_id, function(error, user_data)
                {
                    if(!user_data)
                    {
                        callback({'status': 'error', 'message': "Username is valid, but no user information was found. How strange!"});
                    }
                    else
                    {
                        user_data = JSON.parse(user_data);

                        // Verify password
                        bcrypt.compare(req.body.password, user_data.password, function(error, valid)
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

                                // Save member information in redis
                                client[1].set(user_id, JSON.stringify(user_data), function(error, response)
                                {
                                    if(error)
                                    {
                                        callback({'status': 'error', 'message': "You logged in, but an error occured while saving your account information. Please try again."});
                                    }
                                    else
                                    {
                                        req.session.user_id = user_id;
                                        req.session.user_data = user_data;
                                        
                                        callback({'status': 'success', 'message': "You are now logged in.", 'redirect': {'url': '/', 'timeout': 2}});
                                    }
                                });
                            }
                        });
                    }
                });
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
        if(typeof req.session.user_data != "undefined")
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
