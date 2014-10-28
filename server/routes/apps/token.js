// Required modules
var async = require('async');
var validator = require('validator');


// Variables passed from server.js
var client, model, app;



module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/apps/token/:id', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        // Get app information and user permissions
        res.end("Nothing here yet!");
    });
}
