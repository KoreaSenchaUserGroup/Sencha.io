
Ext.data.SyncDatabaseDirectory= Ext.create('Ext.data.ClientDatabaseDirectory');

Ext.define('Ext.data.proxy.SyncStorage', {
    extend: 'Ext.data.proxy.Client',
    alias: 'proxy.syncstorage',
	
	proxyLock: true, // prevent sync() re-entry
	
	constructor: function(config,callback,scope) {
		//
		// Sync Storage Proxy (combines local and remote storage proxies)
		//
		// JCM ensure that the url ends with a '/'
		config.url= config.url || "http://sync.sencha.io/";
		Ext.data.utilities.check('SyncStorageProxy', 'constructor', 'config', config, ['id','url','key']);
		config.database_name= config.id;
		config.datastore_name= 'data';
		//
		this.callParent([config]);
		//
		// Check the Database Directory
		//   The store might be known about, but was cleared.
		//
		config.definition= Ext.data.SyncDatabaseDirectory.getDatabaseDefinition(config.database_name);
		//
		// Local Storage Proxy
		//
		config.localStorageProxy= config.localStorageProxy || Ext.create('proxy.localstorage',{
			id: config.database_name
		});
		this.localProxy= config.localStorageProxy;
		//
		var f= function(config){
			this.localStore= config.store;
			//
			// Sync Protocol
			//
			this.protocol= new Ext.data.Protocol(config);
			//
			// Remote Storage Proxy
			//
			new Ext.data.SyncProxy(config,function(r){
				if(r.r==='ok'){
					this.remoteProxy= r.proxy;
					Ext.data.utilities.delegate(this,r.proxy,['create','read','update','destroy','setModel']);
					//
					this.setDatabaseDefinitionLocal(true); // we have a local copy of the data now
					//
					this.proxyLock= false; // we're open for business
				}
				if(callback){
					callback.call(scope,{r:'ok',proxy:this});
				}
			},this);
		};
		//
		if(config.store){
			f.call(this,config);
		}else{
			new Ext.data.SyncStore(config,function(r){
				if(r.r==='ok'){
					config.store= r.store;
					f.call(this,config);
				}else{
					if(callback){
						callback.call(scope,r);
					}
				}
			},this);
		}
  },

  sync: function(store,callback,scope) {
		//
		// 'store', is the store that's calling this sync function
		// 
		if(this.protocol) {
			store.fireEvent('beforesync');
			if(this.proxyLock){
				console.log('Warning: Tried to access proxy, whilst another operation was in progress.');
			} else {
				this.proxyLock= true;
				try {
					// JCM use a timer to fire a 'syncing' event with progress information
					//store.fireEvent('syncing');
					this.do_sync(store,function(r){
						// JCM fire 'aftersync' event with progress information
						this.proxyLock= false;
						store.fireEvent('aftersync');
						if(callback){
							callback.call(scope,r);
						}
					},this);
				} catch (e) {
					this.proxyLock= false;
					console.log(e)
					console.log(e.stack)
					throw e
				}
			}
		} else {
			console.log('Error: Tried to access proxy, but it has been cleared.');
		}
	},
	
	do_sync: function(store,callback,scope) {
		var changes= Ext.data.Store.superclass.sync.call(store);
		store.removed= []; // clear the list of records to be deleted
		this.protocol.sync(this.remoteProxy,function(r){
			console.log('sync',r.r);
			switch(r.r){
			case 'ok':
				this.setDatabaseDefinitionRemote(true); // the server knows about the database now
				break;	
			case 'again':
				this.updateDatabaseDefinition(); // the replica_number or generation might have changed
				this.do_sync(store,callback,scope); // call sync again, to actually do the sync
				break;	
			}
			var createdRecords= r.created;
			var updatedRecords= r.updated;
			var removedRecords= r.removed;
			if(createdRecords && createdRecords.length>0) {
				store.data.addAll(createdRecords);
        store.fireEvent('add', this, createdRecords, 0);
			}
			if(updatedRecords && updatedRecords.length>0) {
				store.data.addAll(updatedRecords);
        store.fireEvent('update', this, updatedRecords);
			}
			if(removedRecords && removedRecords.length>0) {
				var l= removedRecords.length;
				for(var i=0;i<l;i++){
					var id= removedRecords[i].getId();
					store.data.removeAt(store.data.findIndexBy(function(i){ // slower, but will match
						return i.getId()===id;
					}));
				}
        store.fireEvent('remove', this, removedRecords);
			}
			callback.call(scope,{r:r.r})
		},this);
	},
	
	clear: function() {
		if(this.remoteProxy) {
			this.proxyLock= true;
			this.setDatabaseDefinitionLocal(false); // we no longer have a local copy of the data
			this.remoteProxy.clear(function(){
				delete this.localProxy;
				delete this.remoteProxy;
				delete this.protocol;
				// JCM In Ext this store object can be used after a clear...
			},this);
		}else{
			console.log('Error: Tried to clear a proxy, but it has been cleared.');
			// JCM send back an error?
		}
	},
	
	setDatabaseDefinitionLocal: function(flag){
		this.remoteProxy.definition.local= flag;
		Ext.data.SyncDatabaseDirectory.putDatabaseDefinition(this.remoteProxy.definition);
	},
	
	setDatabaseDefinitionRemote: function(flag){
		this.remoteProxy.definition.remote= flag;
		Ext.data.SyncDatabaseDirectory.putDatabaseDefinition(this.remoteProxy.definition);
	},

	updateDatabaseDefinition: function(){
		Ext.data.SyncDatabaseDirectory.putDatabaseDefinition(this.remoteProxy.definition);
	},

});
