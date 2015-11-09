module.exports = function(model)
{
   // Crazy function for generating functions to pass callbacks to async
    model.async = function(scope, func, args)
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

    model.where = function(select, glue)
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

    // Helper function to generate unique IDs
    model.unique = function(type, source, select, callback)
    {
        // Generate a random ID
        var salt = crypto.randomBytes(32);
        var noise = crypto.randomBytes(32);
        var unique_id = crypto.createHmac("sha256", salt).update(noise).digest("hex");

        // Insert the ID into our select statement
        if(typeof select == 'string')
        {
            select = util.format('select', unique_id);
        }
        // Or stringify the select statement if necessary
        else
        {
            select = JSON.stringify(select);
            select = util.format('select', unique_id);            
            select = JSON.parse(select);
        }

        var data;

        // Convert standalone functions to objects
        if(typeof source == "function")
        {
            data = {source: source};

            // Add appropriate this values for the database we're selecting from
            if(type == 'redis')
            {
                data.self = model.redis;
            }
            else if(type == 'mysql')
            {
                data.self = model.mysql;
            }
        }
        // Or set data to the source directly, allowing for custom this values
        else
        {
            data = source;
        }

        // Check to see if the ID exists in the data source
        data.source.call(data.self, select, function(error, response)
        {
            // This unique id already exists!
            if(response && response.length)
            {
                model.unique(data, type, select, callback);
            }

            // Unique ID generated successfully
            else
            {
                callback(error, unique_id);
            }
        });
    },

    // Functions for getting and setting user data
    model.user =
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

        app: function(select, callback)
        {
            select = model.where(select);
            model.mysql.query("Select * from `app_users` where "+select.where+" limit 1", select.values, callback);
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

    model.app =
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

    model.token =
    {
        get: function(token, callback)
        {
            model.mysql.query("Select * from `app_tokens` where `token_id` = ?", token, callback);
        },

        create: function(data, callback)
        {
            model.mysql.query("Insert into `app_tokens` set ?, `token_created` = now()", data, callback);
        },

        use: function(token, callback)
        {
            model.mysql.query("Update `app_tokens` set `token_used` = `token_used` + 1 where `token_id` = ?", token, callback);
        }
    },

    model.secure_compare = function(str1, str2)
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
}
