
Ext.data.SyncStore = Ext.extend(Object, {
	
	asynchronous: false,
	
	constructor: function(config,callback,scope) {
		Ext.data.utilities.check('SyncStore', 'constructor', 'config', config, ['database_name','localStorageProxy']);
		this.local= config.localStorageProxy;
		var hasRecords= this.local.getIds().length>0
		this.readConfig('definition',function(data) {
			if(hasRecords && !data){
				console.log('Error: Tried to use an existing localstore,',config.id,', as a syncstore.');
				callback.call(scope,{r:'error'});
			}else{
				// ok
				this.readConfig('index',function(data) {
					this.index= data;
					this.readConfig('csiv',function(data) {
						this.csiv= data ? new Ext.data.CSIV().decode(data) : undefined;
						if(!this.index || !this.csiv){
							this.reindex(function(){
								callback.call(scope,{r:'ok',store:this});
							},this);
						}else{
							callback.call(scope,{r:'ok',store:this});
						}
					},this);
				},this);
			}
		},this);
  },

	// crud

  create: function(records, callback, scope) {
		//console.log('SyncStore - create -',records[0].getId(),Ext.encode(records[0].data))	
		var operation= Ext.create('Ext.data.Operation', {
        records: records
    });
		this.local.create(operation,callback,scope);
  },

  read: function(oid, callback, scope) {
		//console.log('SyncStore - read -',oid)
		var operation= Ext.create('Ext.data.Operation', {
			  action: 'read',
        id: oid
    });
		this.local.read(operation,function(operation2) {
			var record;
			if (operation2.resultSet.count==1) {
				record= operation2.resultSet.records[0];
				Ext.apply(record,Ext.data.SyncModel);
				//console.log('SyncStore - read -',oid,'=>',Ext.encode(record.data));
			} else {
				//console.log('SyncStore - read -',oid,'=> not_found')
			}
			callback.call(scope,record);
		},this);
  },

  update: function(records, callback, scope) {
		//console.log('SyncStore - update',Ext.encode(records))
		var operation= Ext.create('Ext.data.Operation', {
				action: 'update',
        records: records
    });
		this.local.update(operation,callback,scope);
  },

  destroy: function(oid, callback, scope) {
		//console.log('SyncStore - destroy -',oid)
		if(Ext.isArray(oid)){
			Ext.data.array.forEachAsync(oid,function(oid,next_callback,next_scope){
				this.destroy(oid,next_callback,next_scope);
			},this,callback,scope);
		}else{
			var data= {};
			data[Ext.data.SyncModel.OID]= oid;
			var records= [new this.local.model(data)];
			var operation= Ext.create('Ext.data.Operation', {
					action: 'destroy',
	        records: records
	    });
			this.local.destroy(operation,callback,scope);
		}
  },

	clear: function(callback, scope) {
		this.local.clear();
		this.index= {};
		this.removeConfig('index',function(){
			this.removeConfig('csiv',callback,scope);
		},this);
	},

  setModel: function(model, setOnStore) {
		//console.log('SyncStore - setModel',model)
		this.model= model;
		this.local.setModel(model, setOnStore);
  },

	// config

	readConfig: function(oid, callback, scope) {
		var item= this.local.getStorageObject().getItem(this.local.id+"-"+oid);
		var data= item ? Ext.decode(item) : {};
		callback.call(scope,data)
	},
	
	writeConfig: function(oid, data, callback, scope) {
		//console.log('write',this.local.id+"-"+oid,Ext.encode(data));
		this.local.getStorageObject().setItem(this.local.id+"-"+oid,Ext.encode(data));
		callback.call(scope,data);
	},
	
	removeConfig: function(oid, callback, scope) {
		//console.log('remove',this.local.id+"-"+oid);
		this.local.getStorageObject().removeItem(this.local.id+"-"+oid);
		callback.call(scope);
	},

	// id to oid index 

	updateIDIndex: function(id, oid, callback, scope) {
		if (!callback) { throw "ERROR - SyncStore - updateIDIndex - no callback provided" }
		//console.log('SyncStore - indexUpdate -',id,'=>',oid)
		this.index[id]= oid;
		this.writeConfig('index',this.index,callback,scope);
	},

	lookupIDIndex: function(id, callback, scope) {
		if (!callback) { throw "ERROR - SyncStore - lookupIDIndex - no callback provided" }
		var oid= this.index[id];
		//console.log('SyncStore - indexLookup -',id,'=>',oid)
		callback.call(scope,oid)
	},
	
	getIndex: function(callback,scope) {
		callback.call(scope,this.index);
	},

	setIndex: function(index,callback,scope) {
		if(index){
			this.index= index;
			this.writeConfig('index',this.index,callback,scope);
		}else{
			callback.call(scope);
		}
	},
	
	// cs index
	
	getCSIndex: function(callback,scope) {
		//console.log('getCSIndex local',this.csiv)
		callback.call(scope,this.csiv);
	},

	setCSIndex: function(csiv,callback,scope) {
		if(csiv){
			this.csiv= csiv;
			//console.log('setCSIndex local',this.csiv)
			this.writeConfig('csiv',this.csiv.encode(),callback,scope);
		}else{
			callback.call(scope);
		}
	},
	
	oidsFrom: function(csv){
		var r= this.csiv.oidsFrom(csv);
		//console.log('oidsFrom',csv.to_s(),'=>',r)
		// JCM get list of records changed since the csv
		return r;
	},
	
	reindex: function(callback,scope){
		this.index= {};
		this.csiv= new Ext.data.CSIV();
		this.forEachRecord(function(record){
			var oid= record.data[Ext.data.SyncModel.OID];
			var state= record.data[Ext.data.SyncModel.STATE];
			this.forEachCS(state,function(cs){
				this.csiv.add(cs,oid);
			},this);
			this.index[record.data['id']]= oid; // JCM should be this.idProperty, but we don't have the model here...
		},this,callback,scope);
	},
	
	forEachCS: function(state,callback,scope) {
		for(name in state) {
			if (state.hasOwnProperty(name)) {
				var next_state= state[name];
				if (typeof next_state==='string'){
					callback.call(scope,new Ext.data.CS(next_state));
				}else{
					callback.call(scope,new Ext.data.CS(next_state[0]));
					this.forEachCS(callback,scope,next_state[1]); // [cs,state]
				}
			}
		}
	},
	
	readValue: function(key, callback, scope) {
		var value= this.local.getStorageObject().getItem(key);
		callback.call(scope,value);
	},
	
	writeValue: function(key, value, callback, scope) {
		this.local.getStorageObject().setItem(key,value);
		callback.call(scope);
	},
	
	forEachRecord: function(each_callback, each_scope, done_callback, done_scope){
		var operation= Ext.create('Ext.data.Operation', {
			  action: 'read',
    });
		this.local.read(operation,function(operation){
			var records= operation.resultSet.records;
			var i, l= records.length;
			for(i=0;i<l;i++){
				each_callback.call(each_scope,records[i]);
			}
		},this);
		done_callback.call(done_scope);
	},

});

