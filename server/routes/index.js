module.exports = function(app)
{
    app.get('/', function(req, res)
    {
        console.log("GET: /");
        res.render('index', {
            title: 'Hello!',
            partials: {
                head: 'partials/head',
                foot: 'partials/foot'
            }
        });
    });
}
