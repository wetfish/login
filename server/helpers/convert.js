var config = require('../config');
var model = require('../model');
var async = require('async');

model.connect(config);

function get_all_users(callback)
{
    model.redis.select(1, function(error, response)
    {
        if(error) console.log(error);

        model.redis.keys('*', function(error, response)
        {
            if(error) console.log(error);

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
    if(error) console.log(error);
    var finished = 0;
    
    for(i = 0, l = user_data.length; i < l; i++)
    {
        var data = JSON.parse(user_data[i]);
        var id = user_ids[i];

        var username    = data.username;    delete(data.username);
        var email       = data.email;       delete(data.email);
        var password    = data.password;    delete(data.password);
        var token       = data.token;       delete(data.token);
        var verified    = 0;

        if(data.verified)
            verified = 1;

        console.log("Converting " + username + "...");
        model.mysql.query("Insert into `users` values (?, ?, ?, ?, ?, ?, ?)", [id, username, email, password, token, verified, JSON.stringify(data)], function(error, response)
        {
            if(error) console.log(error);
            else
            {
                finished++;

                if(finished == user_data.length)
                {
                    console.log("Conversion complete!");
                    process.exit();
                }
            }
        });
    }
});
