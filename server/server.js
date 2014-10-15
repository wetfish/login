var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var redis = require('redis');
var async = require('async');
var validator = require('validator');
var bcrypt = require('bcrypt');
var app = express();

var client = [];
var model = require('./model')({async: async, redis: redis, client: client});

// Connect to redis
model.connect(function()
{    
    // Do everything else!
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'hjs');

    require('./routes/index.js')(app);
    require('./routes/register.js')({async: async, app: app, client: client, model: model, validator: validator, bcrypt: bcrypt});
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
