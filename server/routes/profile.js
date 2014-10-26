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

function check_social(data)
{
    var valid = [];
    var errors = [];
    
    for(var i = 0, l = data.length; i < l; i++)
    {
        var key = data[i][0];
        var value = data[i][1];

        // Skip empty values
        if(typeof value == "undefined" || value.toString().length == 0)
            continue;

        var url = check_url(value);

        if(url)
            valid.push([key, url]);
        else
            errors.push([key, 'This field must be a URL']);
    }

    return {valid: valid, errors: errors};
}

function check_personal(data)
{
    var valid = [];
    var errors = [];

    for(var i = 0, l = data.length; i < l; i++)
    {
        var key = data[i][0];
        var value = data[i][1];

        // Skip empty values
        if(typeof value == "undefined" || value.toString().length == 0)
            continue;

        // Handlers for special fields
        if(key == "birth")
        {
            // Make sure only numbers are entered for birthdays
            var birth =
            {
                'year': parseInt(value.year),
                'month': parseInt(value.month),
                'day': parseInt(value.day)
            };

            valid.push([key, birth]);
        }
        else if(key == "address")
        {
            // Make sure a clever user didn't add extra address fields
            var address =
            {
                address: value.address,
                city: value.city,
                state: value.state,
                zip: value.zip
            };

            valid.push([key, address]);
        }
        else
        {
            valid.push([key, value]);
        }
    }

    return {valid: valid, errors: errors};
}

function check_nerdy(data)
{
    var valid = [];
    var errors = [];

    for(var i = 0, l = data.length; i < l; i++)
    {
        var key = data[i][0];
        var value = data[i][1];

        // Skip empty values
        if(typeof value == "undefined" || value.toString().length == 0)
            continue;

        if(key == "github")
        {
            var url = check_url(value);

            if(url)
                valid.push([key, url]);
            else
                errors.push([key, 'This field must be a URL']);
        }

        // TODO: Check to ensure pubkeys are in PEM format
        else if(key == "pubkey")
        {
            valid.push([key, value]);
        }
    }

    return {valid: valid, errors: errors};
}

module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/profile', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        console.log("GET: /profile");
        res.render('profile', {
            title: 'Profile',
            user: req.session.user,
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

    app.post('/profile', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        console.log("POST: /profile");        
        var user_data = JSON.parse(JSON.stringify(req.session.user_data));
        var errors = {};
        var error = false;

        var social = check_social(
        [
            ['website', req.body.website],
            ['twitter', req.body.twitter],
            ['facebook', req.body.facebook],
            ['soundcloud', req.body.soundcloud],
            ['bandcamp', req.body.bandcamp]
        ]);

        var personal = check_personal(
        [
            ['about', req.body.about],
            ['full_name', req.body.full_name],
            ['birth', req.body.birth],
            ['phone', req.body.phone],
            ['address', req.body.address],
        ]);

        var nerdy = check_nerdy(
        [
            ['github', req.body.github],
            ['pubkey', req.body.pubkey]
        ]);

        var error_list = social.errors.concat(personal.errors, nerdy.errors);
        var valid_list = social.valid.concat(personal.valid, nerdy.valid);

        for(var i = 0, l = error_list.length; i < l; i++)
        {
            var key = error_list[i][0];
            var value = error_list[i][1];

            errors[key] = value;
            error = true;
        }

        for(var i = 0, l = valid_list.length; i < l; i++)
        {
            var key = valid_list[i][0];
            var value = valid_list[i][1];

            user_data[key] = value;
        }

        if(error)
        {
            res.send(JSON.stringify({'status': 'error', 'errors': errors}));
            res.end();
        }
        else
        {
            user_data.profile_saved = new Date().getTime();

            // Save member information
            model.user.set({user_id: req.session.user_id}, {user_data: JSON.stringify(user_data)}, function(error, response)
            {
                if(error)
                {
                    res.send(JSON.stringify({'status': 'error', 'message': 'An error occured while saving your account information. Please try again.'}));
                    res.end();
                }
                else
                {
                    req.session.user_data = user_data;
                    
                    res.send(JSON.stringify({'status': 'success', 'message': 'Profile updated.', 'redirect': {'url': '/profile', 'timeout': 2}}));
                    res.end();
                }
            });
        }
    });
}
