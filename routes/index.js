// Variables passed from server.js
var app;

module.exports = function(required)
{
    app = required.app;
    
    app.get('/', function(req, res)
    {
        console.log("GET: /");
        res.render('index', {
            title: 'About',
            user: req.session.user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
}
