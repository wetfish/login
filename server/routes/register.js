// Define variables this module requires
var async, validator, bcrypt, client, model, app;

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
    validator = required.validator;
    bcrypt = required.bcrypt;
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
            var fields = ['username', 'email', 'password', 'confirm'];

            // Make sure all fields are entered
            for(var i = 0, l = fields.length; i < l; i++)
            {
                var field = fields[i];

                if(!req.body[field])
                    errors[field] = "This field is required";
            }

            // Check other conditions
            if(response[0])
                errors.username = "This username is taken";

            if(response[1])
                errors.email = "This email is already in use";

            if(validator.isEmail(req.body.username))
                errors.username = "Your username cannot be an email";

            if(!validator.isEmail(req.body.email))
                errors.email = "Your email is invalid";
                
            if(req.body.password.length < 8)
                errors.password = "Your password is too short";

            if(req.body.password != req.body.confirm)
                errors.confirm = "Your passwords do not match";

            // If an error has been set
            if(Object.keys(errors).length)
            {
                res.send(JSON.stringify(errors));
                res.end();
            }
            else
            {
                async.waterfall([
                    // Generate random salt
                    model.async(null, bcrypt.genSalt, [13]),
                    // Hash password using salt
                    model.async(null, bcrypt.hash, [req.body.password])
                ],

                function(error, response)
                {
                    console.log(error, response);
                });
                
//                var salt = crypto.randomBytes(32).toString('base64');

//                var password = crypto.createHmac("sha256", config.secret).update(date + username + password).digest("hex");

                // Generate email verification code
                // Save member information in redis
                // Send verification email

                
                res.send("WOW YOU DID IT!");
                res.end();
            }
        })
    });
}
