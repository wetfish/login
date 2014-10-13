module.exports = function(app)
{
    app.get('/register', function(req, res)
    {
        console.log("GET: /register");
        res.render('register', {
            title: 'Register',
            partials: {
                head: 'partials/head',
                foot: 'partials/foot'
            }
        });
    });

    app.post('/register', function(req, res)
    {
        console.log("POST: /register");
        res.send(JSON.stringify(req.body));
        res.end();
    });
}
