// Variables passed from server.js
var app;

module.exports = function(required)
{
    app = required.app;
    
    app.get('/', function(req, res)
    {
        var user;

        if(typeof req.session.user != "undefined")
            user = req.session.user.name;
        
        console.log("GET: /");
        res.render('index', {
            title: 'About',
            user: user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
}
