var http = require('http'),
    URL  = require('url'),

Getter = module.exports = {};

Getter.get = function(url,callback) {
    
    url = URL.parse(url);
    var options = {
	host:url.hostname,
	path:url.pathname
    };

    http.request(url,function(res) {
	    var data=""
	    res.setEncoding('utf8');
	    res.on('data',function(chunk) {
		    data+=chunk;
		});
	    res.on('end',function() {
		    callback(data);
		});
	}).on('error',function(err) {
		console.log(err);
		callback(err);
	}).end();
}