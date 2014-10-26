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
        model.user.get({user_token: req.query.token, user_verified: 0}, function(error, response)
        {
            console.log(error, response, req.query);
            
            if(!response.length)
            {
                callback({'status': 'error', 'message': "Invalid token specified. Your account may have expired or is already validated."});
            }
            else
            {
                var user = response[0];

                model.user.verify(user.user_id, function(error, response)
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
                message = '<div class="alert alert-success redirect" role="alert" redirect-url="/login" redirect-timeout="2"><strong>Success!</strong> '+response.message+'</div>';
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
