var config = require('../config');
var model = require('../model');
var async = require('async');

model.connect(config);

function get_all_users(callback)
{
    model.redis.select(1, function(error, response)
    {
        model.redis.keys('*', function(error, response)
        {
            var users = [];
            var user_ids = [];

            for(i = 0, l = response.length; i < l; i++)
            {
                var user_id = response[i];

                user_ids[i] = user_id;
                users[i] = model.async(model.redis, model.redis.get, [user_id]);
            }
            
            async.parallel(users, function(error, response)
            {
                callback(error, response, user_ids);
            });
        });
        
    });
}

get_all_users(function(error, user_data, user_ids)
{
    for(i = 0, l = user_data.length; i < l; i++)
    {
        var data = JSON.parse(user_data[i]);
        var id = user_ids[i];
        
        console.log(id, data.username);
    }
    
    process.exit();
});

