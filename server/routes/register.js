// Define variables this module requires
var async, client, model, app;

// Helper functions
function check_username(username, callback)
{
    client[2].get(username, callback);
}

function check_email(email, callback)
{
    client[3].get(email, callback);
}

function check_existing(username, email, callback)
{
    async.parallel([
        model.async(null, check_username, [username]),
        model.async(null, check_email, [email])
    ],

    function(error, response)
    {
        // Return the response to the callback
        callback(error, response);
    });
}

// Module called by express
module.exports = function(required)
{
    async = required.async;
    client = required.client;
    model = required.model;
    app = required.app;
    
    app.get('/register', function(req, res)
    {
        console.log("GET: /register");
        res.render('register', {
            title: 'Register',
            partials: {
                head: 'partials/head',
                foot: 'partials/foot'
            }
        });
    });

    app.post('/register', function(req, res)
    {
        console.log("POST: /register");

        check_existing(req.body.username, req.body.email, function(error, response)
        {
            var errors = {};
            
            if(response[0])
                errors.username = "This username is taken";

            if(response[1])
                errors.email = "This email is already in use";
                
            res.send(JSON.stringify(errors));
            res.end();

        })
    });
}
