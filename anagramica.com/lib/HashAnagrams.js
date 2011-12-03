//Takes the WordNet dictionary files, and outputs a file that has the aggregated anagram map

var fs = require('fs'),
    util = require('util');

function load() {

	parseDictFiles([
    	'/home/max/anagramica/lib/dict/words.txt'
	], function(hashArray,hashIndex) {
	    writeAnagramFile('/home/max/anagramica/lib/dict/anagrams.txt', hashArray,hashIndex);
	});

}

var parseDictFiles = function(files,callback) {

	 var hashArray = [];
	 var hashIndex = [];
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
					var hash = word.split('').sort().join('');
					var hary = hashArray[hash];
					if(!hary) {
						hashIndex.push(hash);
						hary = hashArray[hash] = [word];
					} else if (hary.indexOf(word)===-1) {
						hary.push(word);
					}
				}
			}
	    }

		 if(fi<fl) {
		 	rf(files[fi++]);
	 	 } else {
	 	 	callback(hashArray,hashIndex);
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

var writeAnagramFile = function(file,hashArray,hashIndex) {
	hashIndex = hashIndex.sort();
	fs.open(file,'a', function(err,fd) {
		var appender = startAppender(fd,0);
		for(var h=0,l=hashIndex.length;h<l;h++) {
			var indx = hashIndex[h];
			var buff = new Buffer(indx + '\t' + hashArray[indx].join('\t') + '\n');
			appender.append(buff,function(){});
		}
	});
};

load();