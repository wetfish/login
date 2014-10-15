// Required modules
var async = require('async');
var redis = require('redis');


// Variables passed from server.js
var client;


// Redis connection model
var model = {
    // Crazy function for generating functions to pass callbacks to async
    async: function(scope, func, args)
    {
        return function()
        {
            var callback, last = arguments.length - 1;
            
            for(var i = last; i >= 0; i--)
            {
                // The last argument should always be a callback
                if(i == last)
                    callback = arguments[i];

                // If there are any remaining arguments
                else
                    args.push(arguments[i]);
            }

            args.push(function(error, response) { callback(error, response); });
            func.apply(scope, args);
        }
    },
    
    connect: function(callback)
    {
        // Create connections for each of the redis databases we use
        client[0] = redis.createClient(6301);   // Express session store
        client[1] = redis.createClient(6301);   // Member account data
        client[2] = redis.createClient(6301);   // Username -> Member lookup
        client[3] = redis.createClient(6301);   // Email -> Member lookup
        client[4] = redis.createClient(6301);   // Email token -> Member lookup
        
        // Select databases for each for our connections
        async.parallel([
            model.async(client[0], client[0].select, [0]),
            model.async(client[1], client[1].select, [1]),
            model.async(client[2], client[2].select, [2]),
            model.async(client[3], client[3].select, [3]),
            model.async(client[4], client[4].select, [4])
        ],

        function(error, message)
        {
            callback(error, message);
        });
    }
};

module.exports = function(required)
{
    client = required.client;
    return model;
};
