var app;

module.exports = function(required)
{
    app = required.app;
    
    app.get('/forgetful', function(req, res)
    {
        console.log("GET: /");
        res.render('forgetful', {
            title: 'Forgot your password?',
            user: req.session.user,
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
}
