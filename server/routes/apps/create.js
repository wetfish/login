// Required modules
var async = require('async');


// Variables passed from server.js
var client, model, app;

module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;

    app.get('/apps/create', function(req, res)
    {
        var user;

        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user_data == "undefined")
        {
            res.redirect('/');
            return;
        }
        else
        {
            user = req.session.user_data.username;
        }

        console.log("GET: /apps/create");
        res.render('apps/create', {
            title: 'Create an App',
            user: user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });

    app.post('/apps/create', function(req, res)
    {
        // TODO!
        // Make some bogus terms of service

        // Verify user aggreed to the terms
        // Verify app name and description is set
        // Verify app URL is valid
        // Verify callback is a valid
        
        // Generate unique ID for the app
        // Save app information
        // Save app meta-info in user data
        
        res.end();
    });
}
