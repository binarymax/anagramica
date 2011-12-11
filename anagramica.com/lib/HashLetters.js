//Takes the WordNet dictionary files, and outputs a file that has the aggregated occurrence of each letter

var fs = require('fs'),
    util = require('util'),
    root = '/home/max/apps/anagramica/anagramica.com/lib/dict/';

function load() {

	parseDictFiles([root+'words.txt'], function(hashArray,hashIndex) {
	    writeLettersFile(root+'letters.txt', hashArray,hashIndex);
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
	    var wd = /^[a-z]+$/gi;
	    var totalLetters = 0;
	    for(var i=0,l=rows.length;i<l;i++) {
			if (rows[i][0]!=' ') {
				//iterate through words and count each letter into a hash
				var word = rows[i].replace(re,'').toString().toLowerCase();
				if(word.length>=2 && word.length<=10 && wd.test(word)) {
					//word is valid, add total letter count 
					var k=word.length;
					totalLetters+=k;
					
					//for each letter in the word
					for(var j=0;j<k;j++) {
						var ltr = word[j];
						if(!hashArray[ltr]) {
							//first time letter seen, initialize
							hashArray[ltr]={count:0,percent:0.0};
							hashIndex.push(ltr);
						}
						
						hashArray[ltr].count++;
						
					}					
				}
			}
	    }
	    
	    //calc percentages
	    for(var g=0,h=hashIndex.length;g<h;g++) {
	    	var pct = hashArray[hashIndex[g]].count/totalLetters;
	    	hashArray[hashIndex[g]].percent = pct;
	    }

		 if(fi<fl) {
		 	rf(files[fi++]);
	 	 } else {
	 	 	//hashIndex = hashIndex.sort(function(a,b){ return hashArray[a].count>hashArray[b].count?-1:1; });
	 	 	hashIndex = hashIndex.sort(function(a,b){ return a<b?-1:1; });
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

var writeLettersFile = function(file,hashArray,hashIndex) {
	fs.open(file,'a', function(err,fd) {
		var appender = startAppender(fd,0), i;
		var total = 0;
		for(var i=0,l=hashIndex.length;i<l;i++) {
				var ha  = hashArray[hashIndex[i]];
				var pct = ha.percent.toString().substring(0,11);
				var pts = parseInt(Math.log(pct*1000))+1;
				if(!isNaN(pts) && pts>0) {
					
					var str = hashIndex[i] + '\t' + (6-pts) + '\t' + ha.count + '\t' + pct + '\t';
					
					for(var p=pts;p>0;p--) {
						str+= "+";
					}
	
					var buff = new Buffer(str + '\n');
					appender.append(buff,function(){});
					console.log(str);
					total += ha.count;
				}
		}
		var str 	= "Total letters: " + total;
		console.log(str);

	});
};

load();