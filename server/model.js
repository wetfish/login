// Define variables this module requires
var async, redis, client;

// Redis connection model
var model = {
    // Crazy function for generating functions to pass callbacks to async
    async: function(scope, func, args)
    {
        return function(callback)
        {
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
        
        // Select databases for each for our connections
        async.parallel([
            model.async(client[0], client[0].select, [0]),
            model.async(client[1], client[1].select, [1]),
            model.async(client[2], client[2].select, [2]),
            model.async(client[3], client[3].select, [3])
        ],

        function(error, message)
        {
            callback(error, message);
        });
    }
};

module.exports = function(required)
{
    async = required.async;
    redis = required.redis;
    client = required.client;

    return model;
};
