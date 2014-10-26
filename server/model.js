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
            
            var query = model.mysql.query("Update `apps` set ? where "+select.where, select.values, callback);
            console.log(query.sql);
        },

        create: function(data, callback)
        {
            model.mysql.query("Insert into `apps` set ?, `app_created` = now()", data, callback);
        },

        delete: function()
        {

        },

        list: function(creator, callback)
        {
            model.mysql.query("Select * from `apps` where `app_creator` = ?", creator, callback);
        },

        join: function()
        {

        },

        leave: function()
        {

        }
    }
};

module.exports = model;
