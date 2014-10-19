module.exports = function(app)
{
    app.get('/', function(req, res)
    {
        var user;

        if(typeof req.session.user_data != "undefined")
            user = req.session.user_data.username;
        
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
