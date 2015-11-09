// Required gitignored config
var config = require('./config');

// Required packages from npm
var path = require('path');
var server = require('wetfish-server').createServer(config);
server.sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.password);

// Add our custom model
require('./model')(server.model);

// Array of routes to use
var routes =
[
    'index', 'register', 'verify',
    'login', 'logout', 'forgetful', 'profile',
    'apps/list', 'apps/create', 'apps/edit',
    'apps/join', 'apps/token', 'apps/manage',
    'apps/verify', 'apps/leave'
];

routes.map(function(route)
{
    require('./routes/'+route+'.js')(server);
});

// Redirect to the home page on 404
app.use(function(req, res, next)
{
    res.redirect('/');
});

app.listen(2301);
