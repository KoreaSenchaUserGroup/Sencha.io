
Ext.data.Transaction = Ext.extend(Object, {

	constructor: function(proxy,callback,scope) {
		this.proxy= proxy;
		this.store= proxy.store;
		this.generatorChanged= false;
		this.originalGenerator= proxy.generator;
		this.modifiedGenerator= new Ext.data.CSGenerator(proxy.generator);
		this.csvChanged= false;
		this.originalCSV= proxy.csv;
		this.modifiedCSV= new Ext.data.CSV(proxy.csv); // copy the csv
		this.cache= {}; // read cache of records
		this.toCreate= []; // records to create
		this.toUpdate= []; // records to update
		this.toDestroy= []; // records to destroy
		this.store.getIndex(function(index){
			this.indexChanged= false;
			this.index= index; // id to oid index
			this.store.getCSIndex(function(csiv){
				this.csivChanged= false;
				this.csiv= csiv
				callback.call(scope,this);
			},this);
		},this);
	},
	
	generateChangeStamp: function() {
		var cs= this.modifiedGenerator.generateChangeStamp();
		this.modifiedCSV.addCS(cs);
		this.generatorChanged= true;
		this.csvChanged= true;
		return cs;
	},

  create: function(records) {
		this.addToCache(records);
		this.addToList(this.toCreate,records);
  },

  read: function(oid, callback, scope) {
		var record= this.cache[oid];
		if(record){
			callback.call(scope,record);
		}else{
			this.store.read(oid,function(record){
				this.addToCache(record);
				callback.call(scope,record);
			},this);
		}
  },

  update: function(records) {
		this.addToCache(records);
		this.addToList(this.toUpdate,records);
  },

  destroy: function(oid) {
		this.toDestroy.push(oid);
  },

	updateIDIndex: function(id,oid) {
		this.indexChanged= this.index[id]!=oid;
		this.index[id]= oid;
	},

	lookupIDIndex: function(id,callback,scope) {
		callback.call(scope,this.index[id]);
	},
	
	updateCS: function(from,to,oid) {
		if(from && to){
			if(!from.equals(to)){
				this.csvChanged= this.modifiedCSV.addX(to) || this.csvChanged;
				this.csivChanged= true;
				//this.csiv.remove(from,oid);
				this.csiv.add(to,oid);
			}
		}else if(from){
			//this.csivChanged= true;
			//this.csiv.remove(from,oid);
		}else if(to){
			this.csvChanged= this.modifiedCSV.addX(to) || this.csvChanged;
			this.csivChanged= true;
			this.csiv.add(to,oid);
		}
	},
	
	updateCSV: function(csv) {
		this.csvChanged= this.modifiedCSV.addX(csv) || this.csvChanged;
	},
	
	updateReplicaNumbers: function(csv) {
		this.csvChanged= this.modifiedCSV.addReplicaNumbers(csv) || this.csvChanged;
	},
	
	updateGenerator: function(csv) {
		this.generatorChanged= this.originalGenerator.seenCSV(csv);
	},
	
	commit: function(callback, scope) {
		//
		// Work out which records are to be created or updated.
		//
		var start= new Date().getTime();
		this.toCreate= Ext.data.array.unique(this.toCreate);
		this.toUpdate= Ext.data.array.unique(this.toUpdate);
		this.toUpdate= Ext.data.array.minus(this.toUpdate,this.toCreate);
		var createRecords= this.getRecordsForList(this.toCreate);
		var updateRecords= this.getRecordsForList(this.toUpdate);
		this.store.create(createRecords,function(){
			this.store.update(updateRecords,function(){
				this.store.destroy(this.toDestroy,function(){
					this.store.setIndex(this.indexChanged ? this.index : undefined,function(){
						this.store.setCSIndex(this.csivChanged ? this.csiv : undefined,function(){
							if(this.generatorChanged){
								this.originalGenerator.set(this.modifiedGenerator);
							}
							if(this.csvChanged){
								this.originalCSV.addCSV(this.modifiedCSV);
								this.generatorChanged= this.originalGenerator.seenCSV(this.originalCSV);
							}
							this.proxy.writeConfig_Generator(this.generatorChanged ? this.originalGenerator : undefined,function(){
								this.proxy.writeConfig_CSV(this.csvChanged ? this.originalCSV : undefined,function(){
									var stop= new Date().getTime();
									var took= stop-start;
									if(took>9){
										console.log('commit',took,'ms')
									}
									callback.call(scope,createRecords,updateRecords);
								},this);
							},this);
						},this);
					},this);
				},this);
			},this);
		},this);
	},
	
	addToCache: function(records) {
		if(records){
			if(Ext.isArray(records)){
				var l= records.length;
				for(var i=0;i<l;i++){
					var record= records[i];
					var oid= record.data[Ext.data.SyncModel.OID]
					this.cache[oid]= record;
				}
			}else{
				this.cache[records.data[Ext.data.SyncModel.OID]]= records;
			}
		}
	},
	
	addToList: function(list,records) {
		if(records){
			if(Ext.isArray(records)){
				var l= records.length;
				for(var i=0;i<l;i++){
					var record= records[i];
					var oid= record.data[Ext.data.SyncModel.OID]
					list.push(oid);
				}
			}else{
				list.push(records.data[Ext.data.SyncModel.OID]);
			}
		}
	},
	
	getRecordsForList: function(list) {
		var records= [];
		var l= list.length;
		for(var i=0;i<l;i++){
			var id= list[i];
			records.push(this.cache[id]);
		}
		return records;
	}
		
});

  
  
