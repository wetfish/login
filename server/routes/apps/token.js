// Required modules
var async = require('async');
var validator = require('validator');
var url = require('url');
var crypto = require('crypto');

// Variables passed from server.js
var client, model, app;


// TODO: This should be a general model function... 
function generate_token(callback)
{
    var salt = crypto.randomBytes(32).toString('base64');
    var noise = crypto.randomBytes(32).toString('base64');
    var unique_id = crypto.createHmac("sha256", salt).update(noise).digest("hex");

    // Check to make sure the generated ID doesn't already exist in the database
    model.token.get(unique_id, function(error, response)
    {
        // If this ID is already in use, try generating again (hahah there was a collision, YEAH RIGHT)
        if(response.length)
            generate_token(callback);

        // Otherwise, pass our generated ID to the callback
        else
            callback(unique_id);
    });
}


module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/apps/token/:id', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        // Get application data
        model.app.get({app_id: req.params.id}, function(error, application)
        {
            application = application[0];
            
            // Verify this user has joined the app
            model.user.joined({app_id: req.params.id, user_id: req.session.user.id}, function(joined)
            {
                if(!joined)
                {
                    // If the user hasn't joined yet, redirect to the join page
                    res.redirect('/apps/join/'+req.params.id);
                    return;
                }
                else
                {
                    generate_token(function(token)
                    {
                        var data =
                        {
                            app_id: req.params.id,
                            user_id: req.session.user.id,
                            token_id: token
                        };

                        // Save token
                        model.token.create(data, function(error, response)
                        {
                            if(error)
                            {
                                console.log(error);

                                // TODO: Make a general purpose error template?
                                res.end("An error occured while generating your authentication token...");
                            }
                            else
                            {                                
                                var callback = url.parse(application.app_callback, true);
                                callback.query.token = token;

                                // Redirect to the app callback URL with our generated token
                                res.redirect(url.format(callback));
                            }
                        });
                    });
                }
            });
        });
    });
}
