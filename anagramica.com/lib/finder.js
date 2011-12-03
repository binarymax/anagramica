/***************************************************
 *
 * finder.js
 *
 * Loads dictionary and anagrams into memory
 * Offers functions for finding words and anagrams
 *
 ***************************************************/

var fs = require('fs'),
    util = require('util');

var Finder = module.exports = {};
Finder.Words = [];
Finder.Anagrams = [];
Finder.AnaIndex = [];
Finder.BinHash = [];

//Loads files into memory, prepares hash/cache
Finder.load = function() {
    parseDictFile('./lib/dict/words.txt',  Finder.Words);
    parseAnagrams('./lib/dict/anagrams.txt', Finder.Anagrams, Finder.AnaIndex);
    cacheBinary(Finder.BinHash,10);
};

//Returns 1/0 if a word is found in the dictionary
Finder.find = function(word) {
    if (find(word,Finder.Words)>-1) return 1;
    return 0;
};

//Finds the longest possible anagram of minimum length for a given letter set
Finder.best = function(letters,min) {
	letters = letters.toLowerCase().split('').sort().join(''); //sort the letters
	min = min || 2; //minimum length of a 'best' anagram

	//best anagram is 10 letters long
	if(Finder.Anagrams[letters]) return Finder.Anagrams[letters];

	//for each letter combination, greater than min
	for(var i=letters.length;i>=min;--i) {
		
		//use the precalculated binary hash to get combinations
		var hash = Finder.BinHash[i];
		for(var j=0,l=hash.length;j<l;j++) {
			var bin = hash[j];
			var ary = [];
			for(var k=0;k<10;k++) {
				if(bin[k]==='1') {
					//bit is 'on' for combination, add it to the letters to test 
					ary.push(letters[k]);
				}
			}
			//test the combined letter subset
			ary = ary.join('');
			if(Finder.Anagrams[ary]) return Finder.Anagrams[ary];
		}
	}

	//No anagrams found:	
	return [];	
	
};

//Finds all possible anagrams for a given letter set
Finder.all = function(letters) {
	var words = []; //anagrams found
	var min   = 2; //minimum length of an anagram

	letters = letters.toLowerCase().split('').sort().join(''); //sort the letters

	//best anagram is 10 letters long
	if(Finder.Anagrams[letters]) return Finder.Anagrams[letters];

	//for each letter combination, greater than min
	for(var i=letters.length;i>=min;--i) {
		
		//use the precalculated binary hash to get combinations
		var hash = Finder.BinHash[i];
		for(var j=0,l=hash.length;j<l;j++) {
			var bin = hash[j];
			var ary = [];
			for(var k=0;k<10;k++) {
				if(bin[k]==='1') {
					//bit is 'on' for combination, add it to the letters to test 
					ary.push(letters[k]);
				}
			}
			//test the combined letter subset
			ary = ary.join('');
			if(Finder.Anagrams[ary]) union(words,Finder.Anagrams[ary]);
		}
	}

	//Return found anagrams:
	return words;
	
};

//Unions array2 into array1.  Changes array1
function union(array1,array2) {
	for(var i=0,l=array2.length;i<l;i++) {
		if(array1.indexOf(array2[i])===-1) array1.push(array2[i]);
	}
}

//Binary search for a word:
function find(word,set) {
	var c,d,e;
	for(c=0,d=set.length;c<=d;) {
		if(word>set[e=0|(c+d)/2]) {
			c=e+1;
		} else { 
			d=(word==set[e])?-2:e-1;
		}
	}
	return(d>-2)?-1:e;
}

//Preloads the binary combinations based on 1's count
function cacheBinary(hash,len) {

	var parseBinary = function(array,len,count) {
		var M=1<<len; //mask to populate leading 0's with toString(2), ignore first bit.
		var x=(1<<len)-1;
		for(var y=x;y>0;y--) {
			var b=y.toString(2),j=0;
			for(var i=0,l=b.length;i<l;i++) {
				if(b[i]==='1') j++;
			}
			if(j===count) array.push((M|y).toString(2).substr(1));
		}
	}

	for(var k=0;k<=len;k++) {
		hash.push([]);
		parseBinary(hash[k],len,k);
	}
	
}

//Loads a dictionary file from disk into memory
function parseDictFile(dict,set) {

    fs.readFile(dict,'utf8',function(err,raw){
	    if (err) throw err;
	    var rows = raw.split('\n');
	    for(var i=0,l=rows.length;i<l;i++) {
			if (rows[i][0]!=' ') {
				var word = rows[i].replace(/\s.*$/gi,'');
		    	set.push(word);
			}
	    }
		 console.log("Loaded: " + dict);
	});

}

//Loads an anagram file from disk into memory
function parseAnagrams(anagrams,set,index) {

    fs.readFile(anagrams,'utf8',function(err,raw){
	    if (err) throw err;
	    var rows = raw.split('\n');
	    for(var i=0,l=rows.length;i<l;i++) {
			if (rows[i][0]!=' ') {
				var hary = rows[i].split('\t');
				var curr = set[hary[0]] = [];
				index.push(hary[0]);
				for(var h=1,hl=hary.length;h<hl;h++) {
					curr.push(hary[h]);
				}
			}
	    }
	    index = index.sort();
	    console.log("Loaded: " + anagrams);
	});

}