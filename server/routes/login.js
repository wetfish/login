module.exports = function(app)
{
    app.get('/login', function(req, res)
    {
        if(typeof req.session.count == "undefined") req.session.count = 0
        req.session.count++;
        
        console.log("GET: /login");
        res.render('login', {
            title: 'Login',
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });

    app.post('/login', function(req, res)
    {
        console.log("POST: /login");
        console.log(JSON.stringify(req.body));
        res.send(JSON.stringify({'status': 'error', 'errors': {'unknown': 'GO BACK TO BED KAKAMA'}}));
        res.end();
    });
}
