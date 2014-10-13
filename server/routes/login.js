module.exports = function(app)
{
    app.get('/login', function(req, res)
    {
        console.log("GET: /login");
        res.render('login', {
            title: 'Login',
            partials: {
                head: 'partials/head',
                foot: 'partials/foot'
            }
        });
    });

    app.post('/login', function(req, res)
    {
        console.log("POST: /login");
        res.send(JSON.stringify(req.body));
        res.end();
    });
}
