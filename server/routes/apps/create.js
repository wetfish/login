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
        console.log(req.body);

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
            // Save app information
            // Save app meta-info in user data

            res.end();
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
