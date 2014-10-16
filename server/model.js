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
        // 0: Express session store
        // 1: Member account data
        // 2: Username -> Member lookup
        // 3: Email -> Member lookup
        // 4: Email token -> Member lookup

        var select = [];

        for(i = 0; i < 5; i++)
        {
            client[i] = redis.createClient(6301);
            select[i] = model.async(client[i], client[i].select, [i]);
        }
        
        // Select databases for each for our connections
        async.parallel(select, function(error, message)
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
