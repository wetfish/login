// A demo server
var login = require("./sdk/server/wetfish-login");
var config = require("./config");

login.init(config);

var express = require('express')
var app = express()

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port);
})

app.use(function (req, res, next) {
  console.log('Request!');
  next();
});

app.get('/success', function(req, res)
{
    login.verify(req.query.token, function()
    {
        res.end('Demo!');
    });
});

app.use(express.static(__dirname + '/static'));
