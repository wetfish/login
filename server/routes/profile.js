// Required modules
var async = require('async');
var validator = require('validator');

// Variables passed from server.js
var client, model, app;


// Helper functions
function get_years()
{
    // Get current year
    var year = new Date().getFullYear();
    var years = [];

    for(var i = year, l = year - 150; i >= l; i--)
    {
        years.push({'value': i, 'text': i});
    }

    return years;
}

function get_months()
{
    var month_list = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'November', 'December'];
    var months = [];

    for(var i = 0, l = month_list.length; i < l; i++)
    {
        months.push({'value': i + 1, 'text': month_list[i]});
    }

    return months;
}

function get_days()
{
    var days = [];

    for(var i = 1; i <= 31; i++)
    {
        days.push({'value': i, 'text': i});
    }

    return days;
}


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
            years: get_years(),
            months: get_months(),
            days: get_days(),
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
}
