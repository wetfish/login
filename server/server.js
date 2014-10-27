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

// TODO: Create custom middleware which checks to see if a user is logged in, if so, get the most recent version of their profile from MySQL
// TODO: Store the last time their profile was edited in redis, check against that instead of just getting it every time (expire after some amount of time)

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

require('./routes/index.js')(required);
require('./routes/register.js')(required);
require('./routes/verify.js')(required);
require('./routes/login.js')(required);
require('./routes/profile.js')(required);
require('./routes/logout.js')(required);
require('./routes/apps/list.js')(required);
require('./routes/apps/create.js')(required);
require('./routes/apps/edit.js')(required);
require('./routes/apps/join.js')(required);
require('./routes/apps/leave.js')(required);
require('./routes/apps/verify.js')(required);

app.use(express.static(path.join(__dirname, 'static')));

// Redirect to the home page on 404
app.use(function(req, res, next){
    res.redirect('/');
});

app.listen(2301);
