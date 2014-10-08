var express = require('express');
var app = express();

//app.use(express.static(__dirname + '/static'));

app.get('/', function(req, res)
{
    console.log("Page loaded!");
    res.sendFile(__dirname + '/static/index.html');
});

app.listen(2301);
