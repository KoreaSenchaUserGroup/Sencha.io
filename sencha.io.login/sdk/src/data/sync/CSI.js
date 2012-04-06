
Ext.data.CSI = Ext.extend(Object, { // Change Stamp Index
	
	map: {}, // t => list of oids
	v: [],   // t, in order
	dirty: false, // if v needs rebuild
	
	constructor: function() {
		this.clear();
	},
	
	clear: function() {
		this.map= {};
		this.v= [];
		this.dirty= false;
	},
	
	add: function(t,oid) {
		var l= this.map[t];
		if(l){
			l[oid]= true;
		}else{
			var l= {};
			l[oid]= true;
			this.map[t]= l;
			this.dirty= true;
		}
	},

	remove: function(t,oid) {
		var l= this.map[t];
		if(l){
			delete l[oid];
			this.dirty= true;
		}
	},

	oidsFrom: function(t) {
		var r= [];
		var keys= this.keysFrom(t);
		var l= keys.length;
		for(var i=0;i<l;i++){
			r= r.concat(this.oToA(this.map[keys[i]]));
		}
		return r;
	},
	
	keysFrom: function(t) {
		var r= [];
		var keys= this.keys();
		var l= keys.length;
		for(var i=0;i<l;i++){ // JCM should be a binary search, or reverse iteration
			var j= keys[i];
			if(j>=t){ // '=' because we only index by t, there could be updates with the same t and greater s
				r.push(j);
			}
		}
		return r;
	},

	//searchArray = function(needle, haystack, case_insensitive) {
	//	if (typeof(haystack) === 'undefined' || !haystack.length) return -1;
  //
	//	var high = haystack.length - 1;
	//	var low = 0;
	//	case_insensitive = (typeof(case_insensitive) === 'undefined' || case_insensitive) ? true:false;
	//	needle = (case_insensitive) ? needle.toLowerCase():needle;
  //
	//	while (low <= high) {
	//		mid = parseInt((low + high) / 2)
	//		element = (case_insensitive) ? haystack[mid].toLowerCase():haystack[mid];
	//		if (element > needle) {
	//			high = mid - 1;
	//		} else if (element < needle) {
	//			low = mid + 1;
	//		} else {
	//			return mid;
	//		}
	//	}
  //
	//	return -1;
	//};
	
	encode: function() {
		var r= {};
		for(var i in this.map){
			if (this.map.hasOwnProperty(i) && !this.isEmpty(this.map[i])) {
				r[i]= this.oToA(this.map[i]);
			}
		}
		return r;
	},
	
	decode: function(v) {
		this.clear();
		for(var i in v){
			if (v.hasOwnProperty(i)) {
				var oids= v[i];
				for(var j=0;j<oids.length;j++){
					this.add(i,oids[j])
				}
			}
		}
		return this;
	},
	
	keys: function() {
		if(this.dirty){
			this.v= [];
			for(var i in this.map){
				if (this.map.hasOwnProperty(i) && !this.isEmpty(this.map[i])) {
					this.v.push(i);
				}
			}
			this.dirty= false; 
		}
		return this.v;
	},
	
	isEmpty: function(o) {
		for(var i in o) {
			return false;
		}
		return true;
	},
	
	oToA: function(o){
		var r= [];
		if(o){
			for(var i in o){
				if (o.hasOwnProperty(i)) {
					r.push(i);
				}
			}
		}
		return r;
	},
	
	to_s: function(){
		var r= "";
		for(var i in this.map){
			if (this.map.hasOwnProperty(i) && !this.isEmpty(this.map[i])) {
				r= r+i+':'+this.oToA(this.map[i]);
			}
			r= r+", ";
		}
		return r;
	},
	
	
});
