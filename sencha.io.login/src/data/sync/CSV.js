
Ext.data.CSV = Ext.extend(Object, {

	v: undefined, // change stamps

	constructor: function(config) {
		this.v= {};
		if (config===undefined){
		}else if (config instanceof Ext.data.CSV) {
			this.addX(config);
		}else{
			this.addX(config.v);
		}
	},
	
	get: function(x) {
		if (x instanceof Ext.data.CS) {
			return this.v[x.r];
		}else{
			return this.v[x];
		}
	},
	
	setReplicaNumber: function(replica_number) {
		this.addReplicaNumbers([replica_number]);
	},
	
	addReplicaNumbers: function(x) {
		var t= [];
		if (x instanceof Array) {
			t= Ext.data.array.collect(x,function(r){return this.addX(new Ext.data.CS({r:r}))},this);
		} else if (x instanceof Ext.data.CSV) {
			t= Ext.data.array.collect(x,function(cs){return this.addX(new Ext.data.CS({r:cs.r}))},this);
		}
		return Ext.data.array.includes(t,true);
	},

	addX: function(x) { // CSV, CS, '1-2-3', [x]
		var changed= false;
		if (x===undefined){
		} else if (x instanceof Ext.data.CSV || x instanceof Array) {
			var t= Ext.data.array.collect(x,this.addX,this);
			changed= Ext.data.array.includes(t,true);
		} else if (x instanceof Ext.data.CS) {
			changed= this.addCS(x);
		} else if (typeof x == 'string' || x instanceof String) {
			changed= this.addX(new Ext.data.CS(x));
		}
		return changed;
	},

	addCS: function(x) {
		var changed= false;
		if (x!==undefined){
			var r= x.r;
			var t= this.v[r];
			if (!t || x.greaterThan(t)) {
			  this.v[r]= new Ext.data.CS({r:x.r,t:x.t,s:x.s})
				changed= true;
			}
		}
		return changed;
	},

	addCSV: function(x) {
		var changed= false;
		if (x!==undefined){
			var t= Ext.data.array.collect(x,this.addCS,this);
			changed= Ext.data.array.includes(t,true);
		}
		return changed;
	},

	changeReplicaNumber: function(old_replica_number,new_replica_number) {
		var t= this.v[old_replica_number];
		var changed= false;
		if (t) {
			t.r= new_replica_number;
			this.v[old_replica_number]= undefined;
			this.v[new_replica_number]= t;
			changed= true;
		}
		return changed;
	},

	isEmpty: function() {
		for(var i in this.v) {
			return false;
		}
		return true;
	},
		
	maxChangeStamp: function() {
		if (!this.isEmpty()) {
			var r= new Ext.data.CS();
			this.forEach(function(cs){
				var t= new Ext.data.CS({t:cs.t,s:cs.s});
				r= (t.greaterThan(r) ? cs : r);
			},this)
			return r;
		}
	},

	minChangeStamp: function() {
		if (!this.isEmpty()) {
			var r;
			this.forEach(function(cs){
				if(cs.t!=0 || cs.s!=0){
					var t= new Ext.data.CS({t:cs.t,s:cs.s});
					r= (!r || t.lessThan(r) ? cs : r);
				}
			},this)
			return r;
		}
	},
	
	intersect: function(x) {
		this.v= Ext.data.array.select(x,function(i){ return this.v[i.r]!==undefined },this);
	},

	dominates: function(x) { // true if this csv dominates x
		return Ext.data.array.any(this.compare(x),function(i){ return i>0 });
	},
	
	dominated: function(x) { // returns a list of the dominated cs in x
		return Ext.data.array.select(x,function(i){ return this.compare(i)>0 },this);
	},

	dominant: function(x) { // returns a list of the dominant cs in this
		return Ext.data.array.select(this,function(i){ return x.compare(i)<0 },this);
	},
	
	equals: function(x) {
		return Ext.data.array.all(this.compare(x),function(i){ return i===0 });
	},
	
	compare: function(x) {
		if (x instanceof Ext.data.CS) {
			var cs= this.get(x);
			var cs2= x;
			return [cs ? cs.compare(cs2) : -1];
		} else if (x instanceof Ext.data.CSV) {		
			var r= [];
			for(i in this.v) {
				var cs= this.v[i];
				if (cs instanceof Ext.data.CS) {
					var cs2= x.get(cs);
					r.push(cs2 ? cs.compare(cs2) : 1);
				}
			}
			return r;
		} else {
			throw "Error - CSV - compare - Unknown type: "+(typeof x)+": "+x
		}
		return [-1];
	},
	
	forEach: function(fn,scope) {
		for(var i in this.v){
			if(this.v.hasOwnProperty(i)){
				fn.call(scope||this,this.v[i]);
			}
		}
	},
	
	encode: function() { // for the wire
		return Ext.data.array.collect(this,function(){
			// JCM can we safely ignore replicas with CS of 0... except for the highest known replica number...
			return this.to_s();
		}).join('.');
	},
	
	decode: function(x) { // from the wire
		if(x){
			this.addX(x.split('.'));
		}
		return this;
	},
	
	to_s: function(indent) {
		var r= "CSV: "
		this.forEach(function(cs){
			r+= cs.to_s()+", "
		},this)
		return r;
	},

	as_data: function() { // for the disk
		var data= {
			v: Ext.data.array.collect(this,function(){return this.to_s();}),
			id: 'csv'
		};
		data[Ext.data.SyncModel.MODEL]= 'Ext.data.CSV';
		return data;
	},
		
});