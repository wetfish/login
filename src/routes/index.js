module.exports = function(app)
{
    app.get('/', function(req, res)
    {
        console.log("Home page loaded!");
        res.status(200).send('Welcome to wetfish!');
        res.end();
    });
}
