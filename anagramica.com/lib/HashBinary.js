function cacheCombos(hash,len,max) {

	var parseBinary = function(array,len,max) {
		var M=1<<len;
		var x=(1<<len)-1;
		for(var y=x;y>0;y--) {
			var b=y.toString(2),j=0;
			for(var i=0,l=b.length;i<l;i++) {
				if(b[i]==='1') j++;
			}
			if(j===max) array.push((M|y).toString(2));
		}
	}

	for(var k=0;k<=max;k++) {
		hash.push([]);
		parseBinary(hash[k],len,k);
	}

}

var hash=[];
cacheCombos(hash,10,5);
console.log(hash);