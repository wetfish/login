var express = require('express');
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
    // Do everything else!
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'hjs');

    require('./routes/index.js')(app);
    require('./routes/register.js')({app: app, client: client, model: model, sendgrid: sendgrid});
    require('./routes/verify.js')({app: app, client: client, model: model});
    require('./routes/login.js')(app);
    require('./routes/api/create.js')(app);
    require('./routes/api/verify.js')(app);

    app.use(express.static(path.join(__dirname, 'static')));

    // Redirect to the home page on 404
    app.use(function(req, res, next){
        res.redirect('/');
    });

    app.listen(2301);
});
