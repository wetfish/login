module.exports = function(app)
{
    app.get('/', function(req, res)
    {
        console.log("GET: /");
        res.render('index', {
            title: 'About',
            partials: {
                head: 'partials/head',
                header: 'partials/header',
                foot: 'partials/foot'
            }
        });
    });
}
