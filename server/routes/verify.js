// Required modules
var async = require('async');


// Variables passed from server.js
var client, model, app;


// Helper functions
function verify_token(req, callback)
{
    // Is there a token?
    if(!req.query.token)
    {
        callback({'status': 'error', 'message': "No token specified"});
    }
    else
    {
        // Does this token exist?
        client[4].get(req.query.token, function(error, user_id)
        {
            if(!user_id)
            {
                callback({'status': 'error', 'message': "Invalid token specified. Your account may have expired or is already validated."});
            }
            else
            {
                client[1].get(user_id, function(error, user_data)
                {
                    if(!user_data)
                    {
                        callback({'status': 'error', 'message': "User not found. Your token was valid, but no user information was found. How strange!"});
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
                                callback({'status': 'error', 'message': "User found, but an error occured while saving your account information. How strange!"});
                            }
                            else
                            {
                                callback({'status': 'success', 'message': "Your account is now verified. You may now log in."});
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
        verify_token(req, function(response)
        {
            var message;
            
            if(response.status == 'success')
            {
                message = '<div class="alert alert-success" role="alert"><strong>Success!</strong> '+response.message+'</div>';
            }
            else
            {
                message = '<div class="alert alert-danger" role="alert"><strong>Error:</strong> '+response.message+'</div>';
            }
            
            console.log("GET: /verify");
            res.render('verify', {
                title: 'Email Verification',
                message: message,
                partials: {
                    head: 'partials/head',
                    header: 'partials/header',
                    foot: 'partials/foot'
                }
            });
        });
    });
}
