
Ext.data.ClientDatabaseDirectoryModel= Ext.define("Sencha.ClientDatabaseDirectory.Model", {extend: "Ext.data.Model",
  fields: [
		{name:'key',type:'string'},
		{name:'database_name',type:'string'},
		{name:'system_name',type:'string'},
		{name:'generation',type:'int'},
		{name:'replica_number',type:'int'},
		{name:'local',type:'boolean'},
		{name:'remote',type:'boolean'},		
  ],
	idProperty: 'database_name',
	proxy: {
		id: 'sencha-io-database-directory',
		type: 'localstorage'
  }
});

Ext.data.ClientDatabaseDirectory= Ext.extend(Object, {

	store: undefined,

	constructor: function(config) {
		this.store = new Ext.data.Store({
				model: 'Sencha.ClientDatabaseDirectory.Model',
		});
		this.store.load();
  },
  
  getDatabaseDefinition: function(database_name) {
		var record= this.store.findRecord('database_name',database_name);
		return record ? new Ext.data.DatabaseDefinition(record.data) : undefined;
  },
  
  putDatabaseDefinition: function(definition,callback,scope) {
		var existingRecord= this.store.findRecord('database_name',definition.database_name);
		if(existingRecord){
			existingRecord.set(definition);
			existingRecord.save();
		}else{
			this.store.add(definition);
		}
		this.store.sync();
  },

});



