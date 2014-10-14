// Define variables this module requires
var app, client, async;

var whatever = function(e, r) { cb(e, r) };

// Helper functions
function check_username(username, callback)
{
    async.series([
        function(cb) {
            client.select(2, function(e, r) { cb(e, r) })
        },
        
        function(cb) {
            client.get(username, function(e, r) { cb(e, r); })
        }
    ],

    function(error, response)
    {
        // Return the username to the callback
        callback(false, response[1]);
    });
}

function check_email(email, callback)
{
    async.series([
        function(cb) {
            client.select(3, function(e, r) { cb(e, r) })
        },
        
        function(cb) {
            client.get(email, function(e, r) { cb(e, r); })
        }
    ],

    function(error, response)
    {
        // Return the email to the callback
        callback(false, response[1]);
    });
}

function check_existing(username, email, callback)
{
    async.series([
        function(cb) {
            check_username(username, function(e, r) { cb(e, r) });
        },
        
        function(cb) {
            check_email(email, function(e, r) { cb(e, r) });
        }
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
        check_existing(req.body.username, req.body.email, function(error, response)
        {
            if(response[0] || response[1])
            {
                console.log("TAKEN!");
            }
            console.log(error, response);
        })
        
        console.log("POST: /register");
        res.send(JSON.stringify(req.body));
        res.end();
    });
}
