// Required modules
var async = require('async');


// Variables passed from server.js
var client, model, app;


module.exports = function(required)
{
    client = required.client;
    model = required.model;
    app = required.app;

    app.get('/apps/join/:id', function(req, res)
    {
        console.log("GET: /apps/join/"+req.params.id);

        // If the user isn't logged in, redirect to the login page
        if(typeof req.session.user == "undefined")
        {
            req.session.join = req.params.id;
            res.redirect('/login/join/'+req.params.id);
            return;
        }

        model.user.joined({app_id: req.params.id, user_id: req.session.user.id}, function(joined)
        {
            // If the user has already joined this app
            if(joined)
            {
                res.redirect('/apps/token/'+req.params.id);
                return;
            }
            else
            {
                model.app.get({app_id: req.params.id}, function(error, application)
                {
                    // TODO: Add actual error handling?
                    var error = false;
                    
                    if(!application.length)
                        error = true;
                    else
                    {
                        application = application[0];

                        // Create shortened variable names so we don't have to type as much in the templates
                        application.req = JSON.parse(application.app_permission);
                        application.req.ud = application.req.user_data;
                    }
                    
                    res.render('apps/join', {
                        title: 'Do you authorize this app?',
                        user: req.session.user,
                        app: application,
                        error: error,
                        partials: {
                            head: 'partials/head',
                            foot: 'partials/foot'
                        }
                    });
                });
            }
        });
    });

    app.post('/apps/join/:id', function(req, res)
    {
        console.log("GET: /apps/join/"+req.params.id);

        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }

        model.user.joined({app_id: req.params.id, user_id: req.session.user.id}, function(joined)
        {
            // If the user has already joined this app
            if(joined)
            {
                res.send(JSON.stringify({'status': 'error', 'message': "You've already joined this app!", 'redirect': {'url': '/apps/token/'+req.params.id, 'timeout': 2}}));
                res.end();
            }
            else
            {
                model.app.get({app_id: req.params.id}, function(error, application)
                {
                    if(!application.length)
                    {
                        res.send(JSON.stringify({'status': 'error', 'message': 'No app was found by this ID. It may have been deleted, or the URL is wrong.'}));
                        res.end();
                    }
                    else
                    {
                        application = application[0];
                        
                        // Sanitize data before saving it
                        var permissions = req.body.req;

                        if(typeof permissions != "object")
                            permissions = {};

                        if(typeof permissions.ud != "object")
                            permissions.ud = {};

                        permissions.user_data = permissions.ud;
                        delete(permissions.ud);

                        var data =
                        {
                            user_id: req.session.user.id,
                            app_id: req.params.id,
                            app_admin: (application.app_creator == req.session.user.id) ? 1 : 0,
                            user_permission: JSON.stringify(permissions)
                        };

                        // Save app information
                        model.app.join(data, function(error, response)
                        {
                            if(error)
                            {
                                console.error(error, response);
                                res.send(JSON.stringify({'status': 'error', 'message': 'An error occured while authorizing this app. Please try again'}));
                                res.end();
                            }
                            else
                            {
                                res.send(JSON.stringify({'status': 'success', 'message': 'App authorized', 'redirect': {'url': '/apps/token/'+req.params.id, 'timeout': 2}}));
                                res.end();
                            }
                        });
                    }
                });
            }
        });
    });
}
