// Required modules
var async = require('async');
var redis = require('redis');
var mysql = require('mysql');

// Redis connection model
var model =
{
    // Database connection variables
    redis: false,
    mysql: false,

    // Function to connect to our databases
    connect: function(config)
    {
        model.redis = redis.createClient(6301);
        model.mysql = mysql.createConnection(
        {
            host     : 'localhost',
            user     : config.mysql.username,
            password : config.mysql.password,
            database : config.mysql.database,
            timezone : 'utc' 
        });

        model.mysql.connect();
    },
    
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

    where: function(select, glue)
    {
        if(typeof glue == "undefined")
            glue = " and ";

        var where = [];
        var values = [];
        
        for(var i = 0, keys = Object.keys(select), l = keys.length; i < l; i++)
        {
            where.push(model.mysql.escapeId(keys[i]) + ' = ?');
            values.push(select[keys[i]]);
        }

        return {where: where.join(glue), values: values};
    },

    // Functions for getting and setting user data
    user:
    {
        get: function(select, callback)
        {
            select = model.where(select);
            model.mysql.query("Select * from `users` where "+select.where+" limit 1", select.values, callback);
        },

        set: function(select, data, callback)
        {
            select = model.where(select);
            select.values.unshift(data);

            model.mysql.query("Update `users` set ?, `user_active` = now() where "+select.where, select.values, callback);
        },

        register: function(data, callback)
        {
            model.mysql.query("Insert into `users` set ?, `user_created` = now()", data, function(error, response)
            {
                if(error)
                    callback(error, response);
                else
                {
                    // Escape the user ID just to be safe, even though it really should only ever be hex
                    var user_id = model.mysql.escape(data.user_id).replace(/'/g, '');

                    // Create an event to automatically purge new users after one day
                    var event = "Create event `"+user_id+"` on schedule at now() + interval 1 day do";
                    var action = "Delete from `users` where `user_id`='"+user_id+"'";
                    model.mysql.query(event+" "+action, callback);
                }
            });
        },
        
        verify: function(user_id, callback)
        {
            var user_data = JSON.stringify({verified: new Date().getTime()});
            model.mysql.query("Update `users` set `user_verified`='1', `user_data`= ? where `user_id` = ?", [user_data, user_id], function(error, response)
            {
                if(error)
                    cllback(error, response);
                else
                {
                    // Escape the user ID just to be safe, even though it really should only ever be hex
                    user_id = model.mysql.escape(user_id).replace(/'/g, '');
                    model.mysql.query("Drop event `"+user_id+"`", callback);
                }
            });
        },

        apps: function(user_id, callback)
        {
            var query = "Select * from `apps` as a, `app_users` as au " +
                        "where au.user_id = ? " +
                        "and au.app_id = a.app_id";
            
            model.mysql.query(query, user_id, callback);
        },

        // Helper function which returns true or false if a user has authorized an app
        joined: function(data, callback)
        {
            select = model.where(data);
            model.mysql.query("Select * from `app_users` where "+select.where, select.values, function(error, response)
            {
                if(error)
                {
                    console.log(error);
                    callback(false);
                }
                else
                {
                    if(response.length)
                        callback(true);
                    else
                        callback(false);
                }
            });
        }
    },

    app:
    {
        get: function(select, callback)
        {
            select = model.where(select);
            model.mysql.query("Select * from `apps` where "+select.where+" limit 1", select.values, callback);
        },

        set: function(select, data, callback)
        {
            select = model.where(select);
            select.values.unshift(data);
            
            model.mysql.query("Update `apps` set ? where "+select.where, select.values, callback);
        },

        create: function(data, callback)
        {
            var default_permissions = JSON.stringify({user_name: true, user_email: true, user_data: {}});
            model.mysql.query("Insert into `apps` set ?, `app_created` = now(), `app_permission` = ?", [data, default_permissions], callback);
        },

        delete: function()
        {

        },

        list: function(creator, callback)
        {
            model.mysql.query("Select * from `apps` where `app_creator` = ?", creator, callback);
        },

        join: function(data, callback)
        {
            async.parallel([
                model.async(model.mysql, model.mysql.query, ["Update `users` set `user_active` = now() where `user_id` = ?", data.user_id]),
                model.async(model.mysql, model.mysql.query, ["Update `apps` set `app_active` = now() where `app_id` = ?", data.app_id]),
                model.async(model.mysql, model.mysql.query, ["Insert into `app_users` set ?, `user_joined` = now()", data])
            ],

            function(error, response)
            {
                // Return the response to the callback
                callback(error, response);
            });
        },

        leave: function()
        {

        },
    },

    token:
    {
        get: function(token, callback)
        {
            model.mysql.query("Select `token_id` from `app_tokens` where `token_id` = ?", token, callback);
        },

        create: function(data, callback)
        {
            model.mysql.query("Insert into `app_tokens` set ?, `token_created` = now()", data, callback);
        }

    },

    secure_compare: function(str1, str2)
    {
        if(typeof str1 != "string" || typeof str2 != "string")
            throw "Error: Must compare two strings";

        str1 = str1.split('');
        str2 = str2.split('');

        var length = (str1.length > str2.length) ? str1.length : str2.length;
        var equal = true;

        for(var i = 0; i < length; i++)
        {
            if(typeof(str1[i]) == "undefined")
                equal = false;

            else if(typeof(str2[i]) == "undefined")
                equal = false;

            else if(str1[i] != str2[i])
                equal = false;
        }

        return equal;
    }
};

module.exports = model;
