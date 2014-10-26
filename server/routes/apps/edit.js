// Required modules
var async = require('async');
var validator = require('validator');


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


module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/apps/edit/:id', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        // If no app id is specified, bounce users back to the apps page
        if(typeof req.params.id == "undefined")
        {
            res.redirect('/apps');
            return;
        }

        model.app.get({app_id: req.params.id, app_creator: req.session.user.id}, function(error, app)
        {
            var error = false;
            
            if(!app.length)
                error = true;
            else
                app = app[0];
                
            console.log("GET: /apps/edit/" + req.id);
            res.render('apps/edit', {
                title: 'Edit an App',
                user: req.session.user,
                app: app,
                error: error,
                partials: {
                    head: 'partials/head',
                    header: 'partials/header',
                    foot: 'partials/foot'
                }
            });
        });        
    });

    app.post('/apps/edit/:id', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        // If no app id is specified, bounce users back to the apps page
        if(typeof req.params.id == "undefined")
        {
            res.redirect('/apps');
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

        // If an error has been set
        if(Object.keys(errors).length)
        {
            res.send(JSON.stringify({'status': 'error', 'errors': errors}));
            res.end();
        }
        else
        {
            // Sanitize data before saving it
            var name = validator.escape(req.body.name);
            var desc = validator.escape(req.body.desc);

            var data =
            {
                app_name: name,
                app_desc: desc,
                app_url: website,
                app_callback: callback
            };

            var select =
            {
                app_id: req.params.id,
                app_creator: req.session.user.id
            };

            // Save app information
            model.app.set(select, data, function(error, response)
            {
                if(error)
                {
                    console.error(error, response);
                    res.send(JSON.stringify({'status': 'error', 'message': 'An error occured while saving your app. Please try again'}));
                    res.end();
                }
                else
                {
                    res.send(JSON.stringify({'status': 'success', 'message': 'App updated, redirecting...', 'redirect': {'url': '/apps', 'timeout': 2}}));
                    res.end();
                }
            });
        }
    });
}
