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

    // Functions for displaying member profiles and saving information that can be made available to apps
    // Should be considered public! But maybe apps would need to request these things?
    // And unlike stupid phone apps on unrooted phones, users should be able to "nope" things they don't want to share.

    /*
     * Some ideas
     *
     * Full name
     * Birthday
     * Phone number
     * Address
     * City
     * State
     * Zip
     * Github profile
     * Social media accounts
     * Public key
     */
    
    app.get('/profile', function(req, res)
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
        
        console.log("GET: /profile");
        res.render('profile', {
            title: 'Profile',
            user: user,
            user_data: req.session.user_data,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
}
