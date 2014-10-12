module.exports = function(app)
{
    app.get('/', function(req, res)
    {
        console.log("Home page loaded!");
        res.render('index', { title: 'Wetfish!', message: 'Hello World :)' });
    });
}
