
Ext.data.Protocol = Ext.extend(Object, {

	constructor: function(config) {
		this.url= config.url;
		this.database_name= config.id;
		this.key= config.key;		
		var l= this.url.length;
		if (this.url[l-1]=='/') {
			this.url= this.url.substring(0,l-1); 
		}
		this.url= this.url+"/database/"+this.database_name;
		this.version= 1;
  },

	sync: function(local, callback, scope) {
		//
		// JCM callback if something is going to take a long time...
		// JCM like changing the replica number
		// JCM or clearing after a generation change
		//
	  this.send_create_database(local.definition,function(response) {
			switch (response.r) {
			case 'ok':
				this.updateCSV_and_Generator(local,response.csv,function(){
					//
					// And, now we synchronize.
					//
					this.sync_datastore(local,response.csv,callback,scope);
				},this);
				break;
			case 'new_replica_number':
				//
				// A replica number collision, or re-initialization, has occured. 
				// In either case we must change our local replica number.
				//
				console.log('new_replica_number',response.replica_number)
		    local.setReplicaNumber(response.replica_number,function(){
					callback.call(scope,{r:'again'});
				},scope);
				break;
			case 'new_generation_number':
				//
				// The database generation has changed. We clear out the database,
				// and update the definition. 
				//
				if (response.generation>local.definition.generation) {
					local.definition.set({generation:response.generation},function(){
						local.reset(function(){
							callback.call(scope,{r:'again'});
						},this);
					},this);
				} else {
					// local is the same, or greater than the server.
				}
				break;
			default:
				callback.call(scope,response);
				break;
			}
		},this);
	},
	
	// private
	
	updateCSV_and_Generator: function(local,csv,callback,scope) {
		new Ext.data.Transaction(local,function(t){
			//
			// The remote CSV describes the state of updated-ness of the
			// server this client is talking to. We add any replica numbers
			// that are new to us to our local CSV.
			//
		  t.updateReplicaNumbers(csv);
			//
			// And we update the CS generator with the maximum CS in the
			// CSV, so that the local time is bumped forward if one of 
			// the other replicas is ahead of us.
			//
			// We do this ahead of receiving updates to ensure that any
			// updates we generate will be ahead of the updates that
			// were just received. 
			//
			t.updateGenerator(csv);
			t.commit(callback,scope);
		},this);
	},

	send_create_database: function(definition,callback,scope) {
	  var request= definition.encode();
	  this.sendRequest('POST',definition.database_name,undefined,{},request,function(response){
			response.csv= new Ext.data.CSV().decode(response.csv);
			callback.call(scope, response);
		},this);
	},

	sync_datastore: function(local, remote_csv, callback, scope) {
		//
		// JCM In theory... we could send and receive at the same time...
		//
	  local.getUpdates(remote_csv,function(updates,updates_csv){
		  this.put_database_updates(local.definition,updates,updates_csv,function(response){
		  	if (remote_csv.dominates(local.csv)) {
					this.updateCSV_and_Generator(local,remote_csv,function(){
			  		this.get_database_updates(local,callback,scope);
					},this);
				} else {
					callback.call(scope,{r:'ok'});
				}
			},this);
		},this);
	},

	put_database_updates: function(definition,updates,updates_csv,callback,scope) {
		if((updates && !updates.isEmpty()) || (updates_csv && !updates_csv.isEmpty())){
			this.send_put_database_updates(definition,updates,updates_csv,function(response){
				callback.call(scope);
			},this);
		}else{
			callback.call(scope, {r:"ok"});
		}
	},

	send_put_database_updates: function(definition,updates,updates_csv,callback,scope) {
    var request= {
      updates: Ext.encode(updates.encode()),
	    csv: updates_csv.encode()
    };
		//console.log('sent',Ext.encode(request))
    this.sendRequest('POST',definition.database_name,'updates',{},request,callback,scope);
	},

	get_database_updates: function(local,callback,scope) {
		this.send_get_database_updates(local.definition,local.csv,function(response){
			if (response.r=='ok') {
			  local.putUpdates(response.updates,response.csv,callback,scope);
				// JCM if (response.remaining>0 && !response.updates.isEmpty()) {
				// JCM 	this.get_database_updates(local,callback,scope);
				// JCM } else {
			} else {
				callback.call(scope,response)
			}
		},this);
	},

	send_get_database_updates: function(definition,csv,callback,scope) {
	  var params= {
	    csv: csv.encode()
	  };
	  this.sendRequest('GET',definition.database_name,'updates',params,undefined,function(response){
			var updates_csv= new Ext.data.CSV();
			if (response.csv) {
				updates_csv.decode(response.csv);
			}
			response.csv= updates_csv;
			response.updates= new Ext.data.Updates().decode(response.updates);
			//if(!response.updates.isEmpty()){
			//console.log('received',Ext.encode(response))
			//}
			callback.call(scope, response);
		},this);
	},

	sendRequest: function(http_method,database_name,method,params,request,callback,scope) {
		var url= this.url;
		if (method) {
			url= url+"/"+method;
		}
		params.key= this.key;
		params.v= this.version;
		Ext.Ajax.useDefaultXhrHeader= false;
		Ext.Ajax.request({
			method: http_method,
			url: url,
			params: params,
			jsonData: request,
			success: function(response){
				callback.call(scope,Ext.decode(response.responseText));
			},
			failure: function(response, options) {
				callback.call(scope,{r:'error',status:response.status,statusText:response.statusText});
			}
		});
	},
	
});
