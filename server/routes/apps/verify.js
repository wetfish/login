// Required modules
var async = require('async');
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
    model.redis.get('challenge:'+unique_id, function(error, response)
    {
        // If this ID is already in use, try generating again (hahah there was a collision, YEAH RIGHT)
        if(response)
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

    app.get('/apps/verify', function(req, res)
    {
        console.log("GET: /apps/verify");

        model.token.get(req.body.token, function(error, response)
        {
            if(response)
            {
                var saved = (response[0] || {});
                
                // Generate a single-use token
                generate_token(function(challenge)
                {
                    // Generate some random data
                    saved.challenge_data = crypto.randomBytes(32).toString('base64');

                    // Save in redis, set to expire after 60 seconds
                    model.redis.set('challenge:'+challenge, JSON.stringify(saved), 'ex', 60);
                    
                    // Output challenge
                    res.end(JSON.stringify({challenge: challenge, data: saved.challenge_data}));
                });
            }
            else
            {
                res.end(JSON.stringify({'status': 'error', 'message': "Invalid token."}));
            }
        });
    });

    app.post('/apps/verify', function(req, res)
    {
        console.log("POST: /apps/verify");
        
        // 3rd party sends their single-use token along with a signature
        var challenge = req.body.challenge;
        var client_signature = req.body.signature;

        // First get the saved challenge data
        model.redis.get('challenge:'+challenge, function(error, response)
        {
            if(response)
            {
                var saved = JSON.parse(response);
                saved.challenge_data = new Buffer(saved.challenge_data, 'base64');

                // Make sure this user has actually approved this app
                model.user.joined({app_id: saved.app_id, user_id: saved.user_id}, function(joined)
                {
                    if(joined)
                    {
                        // Now look up app and challenge data
                        async.parallel([
                            model.async(null, model.user.get, [{user_id: saved.user_id}]),
                            model.async(null, model.user.app, [{app_id: saved.app_id, user_id: saved.user_id}]),
                            model.async(null, model.app.get, [{app_id: saved.app_id}]),
                        ],

                        function(error, response)
                        {
                            if(!error && response)
                            {
                                var user = response[0][0];
                                var user_app = response[1][0];
                                var app_data = response[2][0];
                                
                                // Verify the signature based on the shared app secret and the stored random data
                                var server_signature = crypto.createHmac("sha256", app_data.app_secret).update(challenge + saved.challenge_data + app_data.app_id).digest("hex");

                                if(model.secure_compare(server_signature, client_signature))
                                {
                                    // Delete the challenge from redis
                                    model.redis.del('challenge:'+challenge);

                                    user.user_data = JSON.parse(user.user_data);
                                    user_app.user_permission = JSON.parse(user_app.user_permission);

                                    var output = {user_id: saved.user_id};

                                    // Loop through member permissions and send response
                                    for(var i = 0, keys = Object.keys(user_app.user_permission), l = keys.length; i < l; i++)
                                    {
                                        var key = keys[i];
                                        var value = user_app.user_permission[key];

                                        // Ignore user_data in this loop
                                        if(key != "user_data" && value == "on")
                                        {
                                            output[key] = user[key];
                                        }
                                    }

                                    for(var i = 0, keys = Object.keys(user_app.user_permission.user_data), l = keys.length; i < l; i++)
                                    {
                                        var key = keys[i];
                                        var value = user_app.user_permission.user_data[key];

                                        if(value == "on")
                                        {
                                            output[key] = user.user_data[key];
                                        }
                                    }

                                    // Save the number of times a token has been used
                                    model.token.use(saved.token_id);

                                    // Send user data back to the app
                                    res.end(JSON.stringify({'status': 'success', 'data': output}));                                    
                                }
                                else
                                {
                                    res.end(JSON.stringify({'status': 'error', 'message': "Invalid signature."}));
                                }
                            }
                            else
                            {
                                res.end(JSON.stringify({'status': 'error', 'message': "Unable to fetch app data."}));
                            }
                        });
                    }
                    else
                    {
                        res.end(JSON.stringify({'status': 'error', 'message': "User no longer authorizes this app."}));
                    }
                });
            }
            else
            {
                res.end(JSON.stringify({'status': 'error', 'message': "Invalid challenge."}));
            }
        }); 
    });
}
