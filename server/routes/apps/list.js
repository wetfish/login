// Required modules
var async = require('async');


// Variables passed from server.js
var client, model, app;


module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/apps', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        model.app.list(req.session.user.id, function(error, apps)
        {
            console.log("GET: /apps");
            res.render('apps/list', {
                title: 'Your Apps',
                user: req.session.user,
                apps: apps,
                partials: {
                    head: 'partials/head',
                    header: 'partials/header',
                    foot: 'partials/foot'
                }
            });
        });        
    });
}
