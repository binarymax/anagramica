var htmlparser = require('htmlparser'),
    finder     = require('./finder');

var Parser = module.exports = {}
var strip = /\n|\t/g;
var space = /^\s*\w*$/;
var delim = '<br />';

Parser.parse = function(html,callback) {
    
    var handler = new htmlparser.DefaultHandler(function (err, dom) {
	    if (err) {
		callback(err);
	    } else {
		var arr = [], data = [];
		traverse(dom,arr);
		for(var i=0,l=arr.length-1;i<l;i++) {
		    if(arr[i]!==delim || arr[i+1]!==delim) data.push(arr[i]);
		}
		callback(data.join(delim));
	    }
	});
 
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);

};

function traverse(node,a) {

    for(i in node) {

	if(node[i].type==='text') {
	    var text = node[i].data.replace(strip,'');
	    if(text.length>20) a.push(space.test(text)?delim:text+delim+factify(text));
	}

	if(node[i].type!=='script' && node[i].children && node[i].children.length) {
	    traverse(node[i].children,a);
	}

    }

}

function factify(text) {
    var opinion = text.split(' ');
    var facts   = [];
    for(var i=0,l=opinion.length;i<l;i++) {
	if (!finder.find(opinion[i].toLowerCase())) facts.push(opinion[i]);
    }

    return '<em>' + facts.join(' ') + '</em>' + delim;
}