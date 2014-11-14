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
                var saved = response[0];
                
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
                res.end("Invalid token.");
            }
        });
    });

    app.post('/apps/verify', function(req, res)
    {
        console.log("POST: /apps/verify");
        
        // 3rd party sends their single-use token along with a signature
        var challenge = req.body.challenge;
        var signature = req.body.signature;

        // First get the saved challenge data
        model.redis.get('challenge:'+challenge, function(error, response)
        {
            if(response)
            {
                var saved = JSON.parse(response);

                // Make sure this user has actually approved this app
                model.user.joined({app_id: saved.app_id, user_id: saved.user_id}, function(joined)
                {
                    if(joined)
                    {
                        // Now look up app and challenge data
                        async.parallel([
                            model.async(null, model.user.app, [{app_id: saved.app_id, user_id: saved.user_id}]),
                            model.async(null, model.app.get, [{app_id: saved.app_id}]),
                        ],

                        function(error, response)
                        {
                            console.log(error);
                            if(response)
                            {
                                console.log("AAAAAA!", response);
                                
                                console.log("Signature:", signature);

                                // Verify the signature based on the shared app secret and the stored random data
                    //            console.log("Server recieved:", error, response);
                                res.end("WOW HI");
                                // Delete the challenge from redis
                                // Loop through member permissions and send response
                                // Save the number of times a token has been used
                            }
                            else
                            {
                                res.end("Unable to fetch app data.");
                            }
                        });
                    }
                    else
                    {
                        res.end("User no longer authorizes this app.");
                    }
                });
            }
            else
            {
                res.end("Invalid challenge.");
            }
        }); 
    });
}
