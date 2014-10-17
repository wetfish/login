// Required modules
var async = require('async');


// Variables passed from server.js
var client, model, app;


// Helper functions
function verify_token(req, callback)
{
    var message;

    // Is there a token?
    if(!req.query.token)
    {
        callback("Error: No token specified");
    }
    else
    {
        // Does this token exist?
        client[4].get(req.query.token, function(error, user_id)
        {
            if(!user_id)
            {
                callback("Error: Invalid token specified. Your account may have expired or is already validated.");
            }
            else
            {
                client[1].get(user_id, function(error, user_data)
                {
                    if(!user_data)
                    {
                        callback("Error: User not found. Your token was valid, but no user information was found. How strange!");
                    }
                    else
                    {
                        user_data = JSON.parse(user_data);
                        user_data.verified = new Date().getTime();

                        // Save member information in redis
                        async.parallel([
                            model.async(client[1], client[1].set, [user_id, JSON.stringify(user_data)]),
                            model.async(client[2], client[2].persist, [user_data.username]),
                            model.async(client[3], client[3].persist, [user_data.email]),
                            model.async(client[4], client[4].del, [req.query.token]),
                        ],

                        function(error, response)
                        {
                            if(error)
                            {
                                callback("Error: User found, but an error occured while saving your account information. How strange!");
                            }
                            else
                            {
                                callback("Thank you! Your account is now verified. You may now <a href='/login'>log in</a>.");
                            }
                        });
                    }
                });
            }
        });
    }

}


// Route definitions
module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;

    app.get('/verify', function(req, res)
    {
        verify_token(req, function(message)
        {
            console.log("GET: /verify");
            res.render('verify', {
                title: 'Email Verification',
                message: message,
                partials: {
                    head: 'partials/head',
                    foot: 'partials/foot'
                }
            });
        });
    });
}
