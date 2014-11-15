// A demo server
var login = require("./sdk/server/wetfish-login");
var config = require("./config");

login.init(config);

var express = require('express')
var app = express()

var server = app.listen(3000, function ()
{
    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port);
})

app.use(function (req, res, next)
{
    console.log('Request!');
    next();
});

app.get('/success', function(req, res)
{
    login.verify(req.query.token, function(verified)
    {
        if(verified.status == "success")
            res.end("Here's the data you allowed to be shared:\n\n" + JSON.stringify(verified.data, null, 4));
        else
            res.end("There was an error!\n\n" + verified.message);
    });
});

app.use(express.static(__dirname + '/static'));
