var express = require('express');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

var client = [];
var model = require('./model')({client: client});

// Required config file for saving secret information
var config = require('./config');
var sendgrid = require('sendgrid')(config.sendgrid.username, config.sendgrid.password);


// Connect to redis
model.connect(function()
{
    // Use the existing connection for session data
    app.use(session({
        store: new RedisStore({client: client[0]}),
        secret: config.session.secret
    }));
    
    // Do everything else!
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'hjs');

    // Required variables routes need access to
    var required = {app: app, client: client, model: model, sendgrid: sendgrid};

    require('./routes/index.js')(required);
    require('./routes/register.js')(required);
    require('./routes/verify.js')(required);
    require('./routes/login.js')(required);
    require('./routes/profile.js')(required);
    require('./routes/logout.js')(required);
    require('./routes/apps/list.js')(required);
    require('./routes/apps/create.js')(required);
    require('./routes/apps/verify.js')(required);

    app.use(express.static(path.join(__dirname, 'static')));

    // Redirect to the home page on 404
    app.use(function(req, res, next){
        res.redirect('/');
    });

    app.listen(2301);
});
