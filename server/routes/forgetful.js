var validator = require('validator');
var app;

module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/forgetful', function(req, res)
    {
        res.render('forgetful', {
            title: 'Forgot your password?',
            user: req.session.user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });

    app.post('/forgetful', function(req, res)
    {
        var account = validator.escape(req.body.forgetful);
        var select = {};

        // Check if the requested account is an email
        if(validator.isEmail(account))
            select['user_email'] = account;
        else
            select['user_name'] = account;

        model.user.get(select, function(error, response)
        {
            console.log(error, response);
        });
        
        res.end();
    });
}
