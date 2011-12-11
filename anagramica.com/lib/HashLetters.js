//Takes the WordNet dictionary files, and outputs a file that has the aggregated anagram map

var fs = require('fs'),
    util = require('util');

function load() {

	parseDictFiles([
    	'/home/max/anagramica/lib/dict/index.adv',
    	'/home/max/anagramica/lib/dict/index.adj',
		'/home/max/anagramica/lib/dict/index.noun',
		'/home/max/anagramica/lib/dict/index.verb'
	], function(wordArray) {
	    writeWordFile('/home/max/anagramica/lib/dict/words.txt',wordArray);
	});
}

var parseDictFiles = function(files,callback) {

	 var wordArray = [];
	 var hashArray = [];
	 var fi = 0;
	 var fl = files.length;
    var rf = function(dict) {
    	fs.readFile(dict,'utf8',function(err,raw){
	    if (err) throw err;
	    var rows = raw.split('\n');
	    var re = /\s.*$/gi;
	    for(var i=0,l=rows.length;i<l;i++) {
			if (rows[i][0]!=' ') {
				var word = rows[i].replace(re,'');
				if(word.indexOf('_')===-1 && word.indexOf('.')===-1 && word.indexOf('-')===-1) {
					var hary = hashArray[word];
					if(!hary) {
						hary = true;
						wordArray.push(word);
					}
				}
			}
	    }

		 if(fi<fl) {
		 	rf(files[fi++]);
	 	 } else {
	 	 	callback(wordArray);
	 	 }   
		});
	}

 	rf(files[fi++]);

};

var startAppender = function(fd,startPos){
	var pos = startPos;
	return {
		append:function(buffer,callback){
			var old = pos;
			pos+=buffer;
			fs.write(fd,buffer,0,buffer.length,old,callback);
		}
	};
};

var writeWordFile = function(file,wordArray) {
	wordArray = wordArray.sort();
	fs.open(file,'a', function(err,fd) {
		var appender = startAppender(fd,0);
		for(var h=0,l=wordArray.length;h<l;h++) {
			var buff = new Buffer(wordArray[h] + '\n');
			appender.append(buff,function(){});
		}
	});
};

load();