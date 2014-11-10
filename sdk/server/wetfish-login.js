var request = require('request');
var crypto = require('crypto');

var login =
{
    ready: false,
    app_id: false,
    app_secret: false,

    init: function(config)
    {
        if(typeof config == "undefined")
        {
            console.log("No config options found!");
            return;
        }

        if(typeof config.app_id == "undefined" || typeof config.app_secret == "undefined")
        {
            console.log("Config must contain app_id and app_secret.");
            return;
        }

        login.app_id = config.app_id;
        login.app_secret = config.app_secret;
    },
    
    // A function for verifying tokens
    verify: function(token)
    {
        request.get('https://login.wetfish.net/apps/verify', {form: {token: token}}, function(error, response)
        {
            // Parse inputs
            var input = JSON.parse(response.body);
            var challenge = input.challenge;
            var data = new Buffer(input.data, 'base64');

            // Generate response
            var resp = crypto.createHmac("sha256", login.app_secret).update(challenge + data + login.app_id).digest("hex");

            // Post request
            request.post('https://login.wetfish.net/apps/verify', {form: {challenge: challenge, response: resp, app: login.app_id}}, function(error, response)
            {
                console.log("THIS IS THE BODY!", response.body);
            });
        
        });
    }
    
    // Maybe some day there will be SDKs for other languages too ^_~
    
    // An init function which requires a user ID and app ID
};

module.exports = login;
