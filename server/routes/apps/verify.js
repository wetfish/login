// Required modules
var async = require('async');


// Variables passed from server.js
var client, model, app;


module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;

    // Generate a single-use token
    // Generate some random data
    // Save in redis
    // Send back the token with some random data
    app.get('/apps/verify', function(req, res)
    {

    });

    // 3rd party sends their single-use token along with a signature
    // We verify the signature based on the shared app secret and the stored random data
    // Delete the random data from redis
    // Save the number of times a token has been used
    app.post('/apps/verify', function(req, res)
    {

    });
}
