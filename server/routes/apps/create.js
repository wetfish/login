// Required modules
var async = require('async');
var validator = require('validator');
var crypto = require('crypto');

// Variables passed from server.js
var client, model, app;


// Helper functions
function check_url(url)
{
    // Trim whitespace
    url = validator.trim(url);
    
    if(validator.isURL(url))
    {
        if(url.indexOf('http') == 0)
            return url;

        return 'http://' + url;
    }

    return false;
}


function generate_id(callback)
{
    var salt = crypto.randomBytes(32).toString('base64');
    var noise = crypto.randomBytes(32).toString('base64');
    var unique_id = crypto.createHmac("sha256", salt).update(noise).digest("hex");

    // Check to make sure the generated ID doesn't already exist in the database
    model.app.get({app_id: unique_id}, function(error, response)
    {
        // If this ID is already in use, try generating again (hahah there was a collision, YEAH RIGHT)
        if(response.length)
            generate_token(callback);

        // Otherwise, pass our generated ID to the callback
        else
            callback(unique_id);
    });
}


module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;

    app.get('/apps/create', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        console.log("GET: /apps/create");
        res.render('apps/create', {
            title: 'Create an App',
            user: req.session.user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });

    app.post('/apps/create', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        var errors = {};
        var fields = ['name', 'desc', 'website', 'callback'];

        // Make sure all fields are entered
        for(var i = 0, l = fields.length; i < l; i++)
        {
            var field = fields[i];

            if(!req.body[field])
                errors[field] = "This field is required";
        }

        // Check other conditions
        if(req.body.name.length > 32)
            errors.name = "Your project name is too long";

        if(req.body.desc.length > 256)
            errors.desc = "Your project description is too long";

        var website = check_url(req.body.website);
        var callback = check_url(req.body.callback);

        if(!website)
            errors.website = "This field must be a URL";

        if(!callback)
            errors.callback = "This field must be a URL";

        if(req.body.terms != "on")
            errors.terms = "You must accept the <a href='/apps/terms'>Terms of Service</a>.";

        // If an error has been set
        if(Object.keys(errors).length)
        {
            res.send(JSON.stringify({'status': 'error', 'errors': errors}));
            res.end();
        }
        else
        {
            // Generate unique ID for the app
            generate_id(function(app_id)
            {
                // Generate secret key
                var salt = crypto.randomBytes(32).toString('base64');
                var noise = crypto.randomBytes(32).toString('base64');
                var secret_key = crypto.createHmac("sha256", salt).update(noise).digest("hex");

                // Sanitize data before inserting it
                var name = validator.escape(req.body.name);
                var desc = validator.escape(req.body.desc);

                var data =
                {
                    app_id: app_id,
                    app_secret: secret_key,
                    app_creator: req.session.user.id,
                    app_name: name,
                    app_desc: desc,
                    app_url: website,
                    app_callback: callback
                };

                // Save app information
                model.app.create(data, function(error, response)
                {
                    if(error)
                    {
                        console.error(error, response);
                        res.send(JSON.stringify({'status': 'error', 'message': 'An error occured while saving your app. Please try again'}));
                        res.end();
                    }
                    else
                    {
                        res.send(JSON.stringify({'status': 'success', 'message': 'App created, redirecting...', 'redirect': {'url': '/apps/edit/' + app_id, 'timeout': 2}}));
                        res.end();
                    }
                });
            });
        }
    });

    app.get('/apps/terms', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        console.log("GET: /apps/terms");
        res.render('apps/terms', {
            title: 'Developer Terms of Service',
            user: req.session.user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
}
