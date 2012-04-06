
Ext.define('Ext.io.Entities', {
	
  CLASS_MAP: {
    'Realms': 'Ext.io.Group',
    'Apps': 'Ext.io.App',
    'Users': 'Ext.io.User',
    'Instances': 'Ext.io.Device'
  },

  bucket: null,

	// JCM should have a local in-memory and on-disk cache of these objects

  constructor: function(bucket, messaging) {
    this.bucket = bucket;
    this.messaging = messaging;
  },

  get: function(key, callback, scope) {
    var self = this;

    this.messaging.getService("naming-rpc", function(namingRpc) {
      namingRpc.get(function(result) {
        if(result.status == "success") {
          callback.call(scope, false, Ext.create(self.CLASS_MAP[self.bucket], self.bucket, result.value._key, result.value.data, self.messaging));
        } else {
          callback.call(scope, true, null);
        }
      }, self.bucket, key);
    }, this);
  },

  find: function(query, start, rows, callback, scope) {
    var self = this;

    this.messaging.getService("naming-rpc", function(namingRpc) {
      namingRpc.find(function(result) {
        if(result.status == "success") {
          var objects = [];
          for(var i = 0; i < result.value.length; i++) {
            objects.push(Ext.create(self.CLASS_MAP[self.bucket], self.bucket, result.value[i]._key, result.value[i].data, self.messaging));
          }
          callback.call(scope, false, objects);
        } else {
          callback.call(scope, true, null);
        }
      }, self.bucket, query, start, rows);
    }, this);
  }

});

