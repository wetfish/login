module.exports = function(required)
{
    app = required.app;
    
    app.get('/logout', function(req, res)
    {
        // Users shouldn't be here if they're not logged in
        if(typeof req.session.user == "undefined")
        {
            res.redirect('/');
            return;
        }
            
        console.log("GET: /logout");
        res.render('logout', {
            title: 'Logout',
            user: req.session.user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });

        req.session.destroy();
    });
};
