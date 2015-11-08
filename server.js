// Required local packages
var config = require('./config');
var model = require('./model');

// Required packages from npm
var path = require('path');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var RedisStore = require('connect-redis')(session);
var sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.password);

// Start express
var app = express();

// Connect to redis and MySQL
model.connect(config);

// Use the existing connection for session data
app.use(session({
    store: new RedisStore({client: model.redis}),
    secret: config.session.secret
}));

// Do everything else!
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// Required variables routes need access to
var required = {app: app, model: model, sendgrid: sendgrid};
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
    require('./routes/'+route+'.js')(required);
});

app.use(express.static(path.join(__dirname, 'static')));

// Redirect to the home page on 404
app.use(function(req, res, next)
{
    res.redirect('/');
});

app.listen(2301);
