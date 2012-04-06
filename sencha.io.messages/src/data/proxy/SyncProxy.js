
Ext.data.SyncProxy = Ext.extend(Ext.data.Proxy, {
	
	definition: undefined,
	csv: undefined,
	generator: undefined,
	model: undefined,
	store: undefined,
	idProperty: undefined,
	idDefaultProperty: undefined,
	
	// JCM constructor should not be async, delay until first operation
	
	constructor: function(config,callback,scope) {
		//
		Ext.data.utilities.check('SyncProxy', 'constructor', 'config', config, ['store','database_name','key']);
		//
		this.store= config.store;
		//
		// Get or Create a System Name.
		//
		this.getSystemName(function(system_name){
			config.system_name= system_name;
			//
			// Load Configuration
			//
			Ext.data.utilities.apply(this,[
				'readConfig_DatabaseDefinition',
				'readConfig_CSV',
				'readConfig_Generator'],[config],function(){
				//console.log("SyncProxy - Opened database '"+config.key+"/"+config.database_name+"/"+config.datastore_name+"'")
				callback.call(scope,{r:'ok',proxy:this});
			},this);
		},this);
  },

  create: function(operation, callback, scope) {
		new Ext.data.Transaction(this,function(t){
			operation.records.forEach(function(record) {
				record.setCreateState(t);
				// if there's no user id, then use the oid.
				if (record.get(this.idProperty)===this.idPropertyDefaultValue) {
					var p= record.getPair(Ext.data.SyncModel.OID);
					record.data[this.idProperty]= p.v;
				}
			},this)
			var records= this.encodeRecords(operation.records);
			t.create(records);
			this.indexCreatedRecords(t,operation.records); // JCM t should do this?
			t.commit(function(){
				operation.records.forEach(function(record) {
					record.needsAdd= false;
					record.phantom= false;
				},this)
        operation.setSuccessful();
        operation.setCompleted();
				this.doCallback(callback,scope,operation);
			},this);
		},this);
  },

  read: function(operation, callback, scope) {
	
		function makeResultSet(operation,records) {
			records= this.decodeRecords(records);
			records= Ext.data.array.select(records,function(record){
				return record.isNotDestroyed() && !record.phantom;
			},this);
      operation.resultSet = Ext.create('Ext.data.ResultSet', {
          records: records,
          total  : records.length,
          loaded : true
      });
      operation.setSuccessful();
      operation.setCompleted();
		};
		
		if (operation.id!==undefined) {
			this.store.lookupIDIndex(operation.id,function(oid) {
				// JCM if the id is not in the index, then it doesn't exist, so we can return now...
				this.store.read(oid,function(record) {
					makeResultSet.call(this,operation,[record]);
					this.doCallback(callback,scope,operation);
				},this);
			},this);
		} else if (operation[Ext.data.SyncModel.OID]!==undefined) {
				this.store.read(operation[Ext.data.SyncModel.OID],function(record) {
					makeResultSet.call(this,operation,[record]);
					this.doCallback(callback,scope,operation);
				},this);
		} else {
			var records= [];
			this.forEachRecord(false,function(record,next_callback,next_scope) { // include_system_records==false
				records.push(record);
				next_callback.call(next_scope);
			},this,function(){
				makeResultSet.call(this,operation,records);
				this.doCallback(callback,scope,operation);
			},this);
		}
  },

  update: function(operation, callback, scope) {
		new Ext.data.Transaction(this,function(t){
			operation.records.forEach(function(record) {
				record.setUpdateState(t);
			},this);
			var records= this.encodeRecords(operation.records);
			t.update(records);
			t.commit(function(){
        operation.setSuccessful();
        operation.setCompleted();
				this.doCallback(callback,scope,operation);
			},this);
		},this);
  },

  destroy: function(operation, callback, scope) {
		new Ext.data.Transaction(this,function(t){
			var records= [];
			Ext.data.array.forEachAsync(operation.records,function(record,next_callback,next_scope){
				record.setDestroyState(t);
				var oid= record.oid();
				if (!oid) {
					var id= record.data[this.idProperty];
					t.lookupIDIndex(id,function(oid) {
						// JCM if the id is not in the index, then it doesn't exist, so we don't need to try deleting it.
						if (oid) {
							record.data[Ext.data.SyncModel.OID]= oid;
							records.push(record);
						}
						next_callback.call(next_scope);
					},this);
				} else {
					records.push(record);
					next_callback.call(next_scope);
				}
			},this,function(){
				records= this.encodeRecords(records);
				t.update(records);
				this.indexDestroyedRecords(t,operation.records);
				t.commit(function(){
	        operation.setSuccessful();
	        operation.setCompleted();
					operation.action= 'destroy';
					this.doCallback(callback,scope,operation);
				},this);
			},this);
		},this);
  },

	clear: function(callback,scope) {
		this.store.clear(function(){
			this.store.removeConfig('definition',function(){
				this.store.removeConfig('csv',function(){
					this.store.removeConfig('generator',callback,scope);
				},this);
			},this);
		},this);
	},

	reset: function(callback,scope) {
		this.store.clear(function(){
			this.store.removeConfig('csv',function(){
				readConfig_CSV({},callback,scope);
			},this);
		},this);
	},

  setModel: function(model, setOnStore) {
		this.model= model;
		this.idProperty= this.model.prototype.idProperty;
		var fields = this.model.prototype.fields.items,
	      length = fields.length,
	      field, i;
	  for (i = 0; i < length; i++) {
	      field = fields[i];
				if (field.name===this.idProperty) {
					this.idPropertyDefaultValue= field.defaultValue;
				}
	  }
		this.definition.set({idProperty:this.idProperty,idPropertyDefaultValue:this.idPropertyDefaultValue},function(){},this);
		// extend the user's model with the replication state data,
		Ext.apply(model.prototype, Ext.data.SyncModel);
		// and create a local storage model, based on the user's model.
		this.storageModel= model.prototype.createReplStorageModel(this.modelName); // JCM shouldn't need to pass the name in
		this.store.setModel(this.storageModel, setOnStore);
  },

	replicaNumber: function() {
		return this.generator.r;
	},

	addReplicaNumbers: function(csv,callback,scope) {
		this.csv.addReplicaNumbers(csv);
		this.writeConfig_CSV(this.csv,callback,scope);
	},

	setReplicaNumber: function(new_replica_number,callback,scope) {
		if (!callback) { throw "ERROR - SyncProxy - setReplicaNumber - no callback provided." }
  	var old_replica_number= this.replicaNumber();
		console.log('SyncProxy.setReplicaNumber from',old_replica_number,'to',new_replica_number)
    this.changeReplicaNumber(old_replica_number,new_replica_number,function(){
			this.definition.setReplicaNumber(new_replica_number,function(){
		  	this.csv.changeReplicaNumber(old_replica_number,new_replica_number);
			  this.generator.setReplicaNumber(new_replica_number);
				this.writeConfig_Generator(this.generator,function(){
					this.writeConfig_CSV(this.csv,callback,scope);
				},this);
			},this);
		},this);
	},

  changeReplicaNumber: function(old_replica_number,new_replica_number,callback,scope) {
		console.log('SyncProxy.changeReplicaNumber from',old_replica_number,'to',new_replica_number)
		console.log(this.csv.to_s());
		if (!callback) { throw "ERROR - SyncProxy - changeReplicaNumber - no callback provided." }
		this.forEachRecord(false,function(record,next_callback,next_scope) { // include_system_records==false
			var old_oid= record.oid();
			if (record.changeReplicaNumber(old_replica_number,new_replica_number)) {
				var records= this.encodeRecords([record])
				this.store.create(records,function(){
					this.store.destroy(old_oid,next_callback,next_scope);
				},this);
			} else {
				next_callback.call(next_scope);
			}
		},this,function(){
			this.store.reindex(callback,scope);
		},this);
	},

	getUpdates: function(csv,callback,scope) {
	  csv.addReplicaNumbers(this.csv);
		var dominated= this.csv.dominated(csv);
		var l= dominated.length;
		console.log('getUpdates from',csv.to_s(),' dominated=',Ext.encode(dominated));
		if(l==0){
	    callback.call(scope,new Ext.data.Updates(),undefined);
		}else{
			this.start= new Date().getTime()
			//
			// Use the CS index to get a list of records that have changed since csv
			//
			var oids= this.store.oidsFrom(csv);
			console.log('getUpdates oids',Ext.encode(oids));
			this.getUpdates_candidateList(csv,oids,function(updates,update_csv){
				this.getUpdates_done(csv,updates,callback,scope);
			},this);
			//
			// Otherwise, we have to perform a full scan of the database.
			//
			//this.getUpdates_fullScan(csv,function(updates,update_csv){
			//	this.getUpdates_done(csv,updates,callback,scope);
			//},this);
		}
  },

	getUpdates_done: function(csv,updates,callback,scope) {
		//
		// This sequence of updates will bring the client up to the point
		// described by the csv received plus the csv here. Note that there
		// could be no updates, but that the csv could have still been brought
		// forward. 
		//
		var update_csv= new Ext.data.CSV();
		update_csv.addCSV(this.csv.dominant(csv)); // we only need to send the difference in the csv's
		var stop= new Date().getTime();
		var took= stop-this.start;
		if(took>10){
			console.log('getUpdates',updates.length,'updates took',took,'ms')
		}
		callback.call(scope,new Ext.data.Updates(updates),update_csv)
	},

	getUpdates_fullScan: function(csv,callback,scope) {
		// JCM full scan - expensive
		// JCM might also be too big... perhaps there should be a limit on the number
		// JCM of updates that can be collected...
		// JCM could also exhaust the stack
		// JCM could have a fixed sized list, discarding newest to add older
		// JCM could have a full update protocol as well as an incremental protocol
		var updates= [];
		//
		// JCM if the store is async, then do async
		// JCM if the store is sync, then just iterate
		// JCM if(this.store.asynchronous){
		//
		this.forEachRecord(false,function(record,next_callback,next_scope) {  // include_system_records==false
			updates= updates.concat(record.getUpdates(csv));
			next_callback.call(next_scope);
		},this,function(){
	    callback.call(scope,updates);
		},this);
  },

	getUpdates_candidateList: function(csv,oids,callback,scope) {
		var updates= [];
		this.forEachRecordFromOids(oids,function(record,next_callback,next_scope){
			updates= updates.concat(record.getUpdates(csv));
			next_callback.call(next_scope);
		},this,function(){
			callback.call(scope,updates);
		},this);
	},

	putUpdates: function(updates,updates_csv,callback,scope) {
		//console.log('putUpdates',updates.length(),'updates')
		if(updates.isEmpty()){
			new Ext.data.Transaction(this,function(t){
				t.updateCSV(updates_csv);
				t.commit(function(){
					callback.call(scope,{r:'ok'});
				},this);
			},this);
		}else{
			//
			// JCM Also, on the client, hogging the cpu can cause the UI to feel
			// JCM unresponsive to the user. So, we chunk the updates and process
			// JCM each in turn, yielding the cpu between them.  
			//
			// JCM var chunks= updates.chunks(10);
			// JCM Ext.data.array.forEachYielding(chunks,function(chunk,next_callback,next_scope){
			//
			this.start= new Date().getTime();
			new Ext.data.Transaction(this,function(t){
				var computed_csv= new Ext.data.CSV();
				if(this.store.asynchronous){
					updates.forEachAsync(function(update,next_callback,next_scope) {
						this.applyUpdate(t,update,function(){
							computed_csv.addCS(update.c);
							next_callback.call(next_scope);
						},this);
					},this,function(){
						this.putUpdates_done(t,updates,updates_csv,computed_csv,callback,scope);
					},this);
				}else{
					updates.forEach(function(update) {
						this.applyUpdate(t,update,function(){},this);
						computed_csv.addCS(update.c);
					},this);
					this.putUpdates_done(t,updates,updates_csv,computed_csv,callback,scope);
				}
			},this);
		}
	},
	
	putUpdates_done: function(t,updates,updates_csv,computed_csv,callback,scope) {
		//
		// This sequence of updates will bring the client up to the point
		// described by the csv received plus the csv here. Note that there
		// could be no updates, but that the csv could have still been brought
		// forward. 
		//
		// We also compute a new csv from all the updates received, just in
		// case the peer didn't send one, or sent a bad one.
		//
		// Make sure to bump forward our clock, just in case one of our peers 
		// has run ahead.
		//
		t.updateCSV(computed_csv);
		t.updateCSV(updates_csv);
		t.commit(function(createdRecords,updatedRecords){
			// discard the created, then deleted
			createdRecords= Ext.data.array.select(createdRecords,Ext.data.SyncModel.isNotDestroyed);
			// move the updated, then deleted
			var x= Ext.data.array.partition(updatedRecords,Ext.data.SyncModel.isDestroyed);
			var destroyedRecords= x[0];
			updatedRecords= x[1];
			createdRecords= this.decodeRecords(createdRecords);
			updatedRecords= this.decodeRecords(updatedRecords);
			destroyedRecords= this.decodeRecords(destroyedRecords);
			var stop= new Date().getTime();
			var took= stop-this.start;
			if(took>10){
				console.log('putUpdates took',took,'ms')
			}
			callback.call(scope,{
				r: 'ok',
				created: createdRecords,
				updated: updatedRecords,
				removed: destroyedRecords
			});
		},this);
	},
	
  applyUpdate: function(t,update,callback,scope,last_ref) { // Attribute Value - Conflict Detection and Resolution
		//if (last_ref) {
		//	console.log('ref ==> ',this.us(update));
		//} else {
		//	console.log('applyUpdate',this.us(update));
		//}
		t.read(update.i,function(record) {
			if (record) {
				var ref= record.ref();
				if (ref && update.p[0]!='_') { // JCM this is a bit sneaky
					if (update.i===ref) {
						console.log("Error - applyUpdate - Infinite loop following reference. ",ref);
					} else {
						update.i= ref;
						this.applyUpdate(t,update,callback,scope,ref);
						// no callback!
					}
				} else {
					if (update.p===this.idProperty) {
						this.applyUpdateToRecordForUniqueID(t,record,update,callback,scope);
					} else {
						this.applyUpdateToRecord(t,record,update);
						callback.call(scope);
					}
				}
			} else {
				this.applyUpdateCreatingNewRecord(t,update);
				callback.call(scope);
			}
		},this);
  },

	applyUpdateCreatingNewRecord: function(t,update) {
		var record;
		// no record with that oid is in the local store...
		if (update.p===Ext.data.SyncModel.OID) {
			// ...which is ok, because the update is intending to create it
			record= this.createNewRecord(t,update.v,update.c);
			//console.log('applyUpdate',Ext.encode(record.data),'( create )');
		} else {
			// ...which is not ok, because given the strict ordering of updates
			// by change stamp the update creating the object must be sent first.
			// But, let's be forgiving and create the record to receive the update. 
			//console.log("Warning - Update received for unknown record "+update.i,this.us(update));
			record= this.createNewRecord(t,update.i,update.i);
			record.setPair(t,update.p,update.v,update.c);
		}
		t.create([record]);
	},
	
	applyUpdateToRecordForUniqueID: function(t,record,update,callback,scope) {
		// update is to the id, for which we maintain uniqueness
		if (record.data[update.p]===update.v) {
			// re-asserting same value for the id
			this.applyUpdateToRecordForUniqueId(t,record,update);
			callback.call(scope);
		} else {
			// different value for the id, so check if a record already exists with that value
			t.lookupIDIndex(update.v,function(existing_record_oid){
				if (existing_record_oid) {
					this.readById(t,update.v,existing_record_oid,function(existing_record) {
						this.applyUpdateToRecordForUniqueId(t,record,update);
						var r_cs= new Ext.data.CS(record.oid());
						var er_cs= new Ext.data.CS(existing_record.oid());
						var r_before, r_after;
						if (r_cs.greaterThan(er_cs)) {
							// the record being updated is more recent then the existing record
							//console.log(this.us(update),'existing record is older');
							r_before= existing_record;
							r_after= record;
						} else {
							// the existing record is more recent than the record being updated
							//console.log(this.us(update),'existing record is newer');
							r_before= record;
							r_after= existing_record;
						}
						this.resolveUniqueIDConflict(t,r_before,r_after);
						t.updateIDIndex(update.v,r_before.oid());
						callback.call(scope);
					},this);
				} else {
					// the new id value did not exist at the time of the update
					this.applyUpdateToRecordForUniqueId(t,record,update);
					callback.call(scope)
				}
			},this);
		}
	},

	applyUpdatesToRecord: function(t,record,updates) {
		var l= updates.length;
		for(var i=0;i<l;i++){
			this.applyUpdateToRecord(t,record,updates[i]);
		}
	},

	applyUpdateToRecordForUniqueId: function(t,record,update) {
		var value_before= record.data[update.p];
		var value_after= update.v;
		if(this.applyUpdateToRecord(t,record,update)){
			t.updateIDIndex(value_after,record.oid());
			if (value_before) {
				t.updateIDIndex(value_before,undefined);
			}
		}
	},

	applyUpdateToRecord: function(t,record,update) {
		if (record.putUpdate(t,update)) {
			//console.log(this.us(update),'accepted')		
			t.update([record])
			return true;
		} else {
			//console.log(this.us(update),'rejected')
			return false;
		}
	},

	readById: function(t,id,oid,callback,scope) { // JCM move into applyUpdateToUniqueID?
		t.lookupIDIndex(id,function(oid){
			t.read(oid,function(record) {
				if (record) {
					callback.call(scope,record);
				} else {
					console.log('ERROR - SyncProxy - applyUpdateToUniqueID - ID Index refers to an non-existant object:',id,'=>',oid,'(This should not be possible.)');
				}
			},this);
		},this);
	},

	resolveUniqueIDConflict: function(t,r1,r2) { // JCM move into applyUpdateToUniqueID?
		var updates= this.updatesForMergeRecords(r1,r2);
		this.applyUpdatesToRecord(t,r1,updates);
		var updates= this.updatesForMakeReference(t,r2,r1);
		this.applyUpdatesToRecord(t,r2,updates);
	},
	
	updatesForMergeRecords: function(r1,r2) { // merge r2 into r1 // JCM move into applyUpdateToUniqueID?
		// r1 receives all updates from r2
		var csv= r1.getCSV();
		var updates1= r2.getUpdates(csv);
		var updates2= [];
		var r1_oid= r1.oid();
		updates1.forEach(function(update) {
			if (update.p!==this.idProperty && update.p!==Ext.data.SyncModel.OID) {
				update.i= r1_oid;
				updates2.push(update);
			}
		},this);
		//console.log('updatesForMergeRecords - csv',csv);
		//console.log('updatesForMergeRecords - r1',r1.data);
		//console.log('updatesForMergeRecords - r2',r2.data);
		//console.log('updatesForMergeRecords - updates',updates2);
		return updates2;
	},

	updatesForMakeReference: function(t,r1,r2) { // JCM move into applyUpdateToUniqueID?
		if (r1.oid()===r2.oid()) { 
			console.log('updatesForMakeReference',r1.data,r2.data);
			throw "Error - SyncProxy - Tried to create reference to self."
		}
		var cs1= t.generateChangeStamp();
		var cs2= t.generateChangeStamp();
		var updates= [{
			i: r1.oid(),
			p: Ext.data.SyncModel.REF,
			v: r2.oid(),
			c: cs1
		},{
			i: r1.oid(),
			p: Ext.data.SyncModel.TOMBSTONE,
			v: cs2.to_s(),
			c: cs2
		}];
		//console.log('updatesForMakeReference',updates);
		return updates; 
	},
	
	createNewRecord: function(t,oid,cs) {
		var record= new this.storageModel();
		record.phantom= false;
		Ext.apply(record,Ext.data.SyncModel);
		record.setPair(t,Ext.data.SyncModel.OID,oid,cs);
		return record;
	},
	
	indexCreatedRecords: function(t, records) {
		records.forEach(function(record){
			var record_id= record.data[this.idProperty];
			if (record_id) {
				t.updateIDIndex(record_id,record.data[Ext.data.SyncModel.OID]);
			}
		},this);
	},

	indexDestroyedRecords: function(t, records) {
		records.forEach(function(record){
			var record_id= record.data[this.idProperty];
			if (record_id) {
				t.updateIDIndex(record_id,undefined);
			}
		},this);
	},

	equals: function(x,callback,scope) { // for testing
		if (this.csv.equals(x.csv)) {
			this.hasSameRecords(x,function(r){
				if (r) {
					x.hasSameRecords(this,callback,scope);
				} else {
					callback.call(scope,r)
				}
			},this);
		} else {
			callback.call(scope,false);
		}
	},

	hasSameRecords: function(x,callback,scope) { // for testing
		this.forEachRecord(false,function(r1,next_callback,next_scope){ // include_system_records==false
			this.store.read(r1.oid(),function(r2) {
				if (r2) {
					r= r1.equals(r2);
					if (r) {
						next_callback.call(next_scope);
					} else {
						console.log('hasSameRecords - false - ',this.replicaNumber(),x.replicaNumber())
						callback.call(scope,false);
					}
				} else {
					console.log('hasSameRecords - false - ',this.replicaNumber(),x.replicaNumber())
					callback.call(scope,false);
				}
			},this);
		},this,function(){
			callback.call(scope,true);
		},this);
	},

	console_log: function(text,callback,scope) { // for testing
		console.log('==== ',text);
		this.forEachRecord(false,function(r1,next_callback,next_scope){  // include_system_records==false
			console.log(Ext.encode(r1.data));
			next_callback.call(next_scope);
		},this,function(){
			console.log('----');
			this.store.getIndex(function(index){
				console.log(index);
				this.store.getCSIndex(function(csiv){
					console.log(csiv.to_s());
					console.log('====');
					callback.call(scope);
				},this);
			},this);
		},this);
	},
		
	forEachRecord: function(include_system_records, each_callback, each_scope, done_callback, done_scope) {
		var Model= this.model;
		var start= new Date().getTime();
		if(this.store.asynchronous){
			this.store.forEachRecord(function(record,next_callback,next_scope){
				if(include_system_records || (!include_system_records && !this.isSystemRecord(record))){
					each_callback.call(each_scope,new Model(record.data),next_callback,next_scope); 
				}else{
					next_callback.call(next_scope);
				}
			},this,function(){
				var stop= new Date().getTime();
				var took= stop-start;
				if(took>10){
					console.log('SyncProxy.forEachRecord took',stop-start,'ms')
				}
				done_callback.call(done_scope)
			},this);
		}else{
			this.store.forEachRecord(function(record){
				if(include_system_records || (!include_system_records && !this.isSystemRecord(record))){
					each_callback.call(each_scope,new Model(record.data),function(){}); 
				}
			},this,done_callback,done_scope);
			var stop= new Date().getTime();
			var took= stop-start;
			if(took>10){
				console.log('SyncProxy.forEachRecord took',stop-start,'ms')
			}
		}
	},
	
	forEachRecordFromOids: function(oids, each_callback, each_scope, done_callback, done_scope) {
		if(this.store.asynchronous){
			Ext.data.array.forEachAsync(oids,function(oid,next_callback,next_scope){
				this.store.read(oid,function(record){
					each_callback.call(each_scope,record,next_callback,next_scope);
				},this);
			},this,done_callback,done_scope);
		}else{
			var i, l= oids.length;
			for(i=0;i<l;i++){
				this.store.read(oids[i],function(record){
					each_callback.call(each_scope,record,function(){});
				},this);
			}
			done_callback.call(done_scope);
		}
	},
	
	isSystemRecord: function(record) {
		var model_name= record.data[Ext.data.SyncModel.MODEL];
		return model_name!==undefined && model_name!=='' && model_name.indexOf("Ext.data.",0)===0;
	},

	encodeRecords: function(records) {
		var Model= this.storageModel;
		return Ext.data.array.collect(records,function(){ 
			var record= new Model(this.data);
			record.internalId= this.internalId;
			record.phantom= false;
			return record; 
		});
	},

	decodeRecords: function(records) {
		var Model= this.model;
		return Ext.data.array.collect(records,function(){
			var record= new Model(this.data);
			record.internalId= this.internalId;
			record.phantom= false;
			return record; 
		});
	},
	
	getSystemName: function(callback,scope){
		this.store.readValue('sencha.io.client.uuid',function(system_name){
			if(system_name){
				callback.call(scope,system_name);
			}else{
				var system_name= Ext.util.UUIDGenerator.generate();
				console.log('Created new Sencha Sync System Name:',system_name)
				this.store.writeValue('sencha.io.client.uuid',system_name,function(){
					callback.call(scope,system_name);
				},this);
			}
		},this);
	},

	readConfig_DatabaseDefinition: function(config,callback,scope) {
		var default_data= {
			key: config.key,
			system_name: config.system_name,
			generation: (config.definition ? config.definition.generation : 0) || 0,
			replica_number: (config.definition ? config.definition.replica_number : 0) || 0
		};
		var overwrite_data= {
			database_name: config.database_name, 
			replica_type: config.replica_type
		};
		this.readConfig(Ext.data.DatabaseDefinition,'definition',default_data,overwrite_data,function(r,definition) {
			this.definition= definition;
			callback.call(scope,r,definition);
		},this);
	},

	readConfig_Generator: function(config,callback,scope) {
		var overwrite_data= {
			r: this.definition.replica_number,
			clock: config.clock
		};
		this.readConfig(Ext.data.CSGenerator,'generator',{},overwrite_data,function(r,generator){
			this.generator= generator;
			callback.call(scope,r,generator);
		},this); 
	},

	readConfig_CSV: function(config,callback,scope) {
		this.readConfig(Ext.data.CSV,'csv',{},{},function(r,csv){
			this.csv= csv;
			callback.call(scope,r,csv);
		},this); 
	},
	
	writeConfig_Generator: function(generator,callback,scope) {
		if(generator){
			this.store.writeConfig('generator',generator.as_data(),callback,scope);
		}else{
			callback.call(scope);
		}
	},

	writeConfig_CSV: function(csv,callback,scope) {
		if(csv){
			//console.log('writeConfig_CSV',csv.as_data())
			this.store.writeConfig('csv',csv.as_data(),callback,scope);
		}else{
			callback.call(scope);
		}
	},
				
	writeConfig: function(id, object, callback, scope) {
		this.store.writeConfig(id,object.as_data(),function(data){
			callback.call(scope)
		},this);
	},

	readConfig: function(Klass, id, default_data, overwrite_data, callback, scope) {
		this.store.readConfig(id,function(data) {
			var r= (data===undefined) ? 'created' : 'ok';
			if (default_data!==undefined) {
				if (data===undefined) {
					data= default_data;
				} else {
					for(var name in default_data) {
						if (data[name]===undefined) {
							data[name]= default_data[name];
							changed= true;
						}
					}
				}
			}
			if (overwrite_data!==undefined) {
				if (data===undefined) {
					data= overwrite_data;
				} else {
					for(var name in overwrite_data) {
						if (data[name]!==overwrite_data[name]) {
							data[name]= overwrite_data[name];
							changed= true;
						}
					}
				}
			}
			var me= this;
			data.config_id= id;
			data.write_fn= function(object, write_callback, write_scope) { 
				me.writeConfig.call(me,id,object,write_callback,write_scope);
			};
			callback.call(scope,r,new Klass(data));
		},this);
	},

	doCallback: function(callback, scope, operation) {
    if (typeof callback == 'function') {
			callback.call(scope || this, operation);
    }
	},

	us: function(u) {
		var p= Ext.isArray(u.p) ? u.p.join() : u.p;
		var v= u.v;
		switch (typeof u.v) {
			case 'object':
				v= Ext.encode(u.v);
		}
		return '('+u.i+' . '+p+' = \''+v+'\' @ '+u.c.to_s()+')';
	},

});

