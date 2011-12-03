
/**
 * Module dependencies.
 */

var express = require('express'),
    finder  = require('./lib/finder');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  finder.load();

});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


// Routes

//Word finder
app.get('/lookup/:name', function(req, res) {
	res.send({found:finder.find(req.params['name'])});
});

//Return best anagrams
app.get('/best/:letters', function(req, res) {
	res.send({best:finder.best(req.params['letters'])});
});

//Return all anagrams
app.get('/all/:letters', function(req, res) {
	res.send({all:finder.all(req.params['letters'])});
});

//Home Page
app.get('/', function(req, res){
	res.sendfile('./public/index.html');
    });

//Privacy Policy Page
app.get('/privacy.html', function(req, res){
	res.sendfile('./public/privacy.html');
    });

//API Page
app.get('/api', function(req, res){
	res.sendfile('./public/api.html');
    });


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
