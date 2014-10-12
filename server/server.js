var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

require('./routes/index.js')(app);
require('./routes/register.js')(app);
require('./routes/login.js')(app);
require('./routes/api/create.js')(app);
require('./routes/api/verify.js')(app);

app.use(express.static(path.join(__dirname, 'static')));

// Redirect to the home page on 404
app.use(function(req, res, next){
    res.redirect('/');
});

app.listen(2301);
