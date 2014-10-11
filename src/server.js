var express = require('express');
var app = express();


require('./routes/index.js')(app);
require('./routes/register.js')(app);
require('./routes/login.js')(app);
require('./routes/api/create.js')(app);
require('./routes/api/verify.js')(app);


// Redirect to the home page on 404
app.use(function(req, res, next){
    res.redirect('/');
});

app.listen(2301);
