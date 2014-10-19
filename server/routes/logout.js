module.exports = function(required)
{
    app = required.app;
    
    app.get('/logout', function(req, res)
    {
        var user;

        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user_data == "undefined")
        {
            res.redirect('/');
            return;
        }
        else
        {
            user = req.session.user_data.username;
            req.session.destroy();
        }
        
        console.log("GET: /logout");
        res.render('logout', {
            title: 'Logout',
            user: user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
};
