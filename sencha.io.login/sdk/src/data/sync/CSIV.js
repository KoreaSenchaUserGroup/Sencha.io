
Ext.data.CSIV = Ext.extend(Object, { // Change Stamp Index Vector

	v: {},
	
	constructor: function() {
		this.v= {};
	},
	
	oidsFrom: function(csv) {
		var r= [];
		csv.forEach(function(cs){
			var csi= this.v[cs.r]
			if(csi){
				r= r.concat(csi.oidsFrom(cs.t));
			}
		},this);
		r= Ext.data.array.unique(r);
		return r;
	},
	
	add: function(cs,oid) {
		var csi= this.v[cs.r];
		if(csi===undefined){
			csi= this.v[cs.r]= new Ext.data.CSI();
		}
		csi.add(cs.t,oid);
	},

	addArray: function(a,oid) {
		var l= a.length;
		for(var i=0;i<l;i++){
			var cs= a[i];
			if(cs){
				this.add(a[i],oid);
			}
		}
	},

	addRecord: function(record) {
		var oid= record.oid();
		var v= record.getAllCS();
		var l= v.length;
		for(var i=0;i<l;i++){
			this.add(v[i],oid);
		}
	},

	remove: function(cs,oid) {
		var csi= this.v[cs.r];
		if(csi){
			csi.remove(cs.t,oid);
		}
	},	

	removeArray: function(a,oid) {
		var l= a.length;
		for(var i=0;i<l;i++){
			var cs= a[i];
			if(cs){
				this.remove(a[i],oid);
			}
		}
	},

	encode: function() {
		var r= {};
		for(var i in this.v){
			if (this.v.hasOwnProperty(i)) {
				r[i]= this.v[i].encode();
			}
		}
		var data= {};
		data.id= 'csiv';
		data[Ext.data.SyncModel.MODEL]= 'Ext.data.CSIV';
		data.r= r;
		return data;
	},
		
	decode: function(v) {
		this.v= {};
		if(v){
			for(var i in v.r){
				if (v.r.hasOwnProperty(i)) {
					this.v[i]= new Ext.data.CSI().decode(v.r[i]);
				}
			}		
		}
		return this;
	},
	
	to_s: function() {
		var r= "";
		for(var i in this.v){
			if (this.v.hasOwnProperty(i)) {
				r= r+i+"=>["+this.v[i].to_s()+"], ";
			}
		}
		return r;
	},
			
});
