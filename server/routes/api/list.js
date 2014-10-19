// Required modules
var async = require('async');


// Variables passed from server.js
var client, model, app;


module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/api', function(req, res)
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
        
        console.log("GET: /api");
        res.render('api/list', {
            title: 'API Credentials',
            user: user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
}
