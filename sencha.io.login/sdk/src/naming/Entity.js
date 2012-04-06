
Ext.define('Ext.io.Entity', {
	
  bucket: null,

  key: null,

  data: null,

	// JCM should have a local in-memory and on-disk cache of these objects

  constructor: function(bucket, key, data, messaging) {
    this.bucket = bucket;
    this.key = key;
    this.data = data;
    this.messaging = messaging;
  },

	/**
	* Update
	* (JCM ...)
	*/
  update: function(data, callback, scope) {
    var self = this;
    var res = false;

    //update data
    for (var k in data) {
      self.data[k] = data[k];
    }

    this.messaging.getService("naming-rpc",
      function(namingRpc) {
        namingRpc.update(
          function(result) {
            if(result.status == "success") {
              callback.call(scope, false);
            } else {
              callback.call(scope, true);
            }
          }, self.bucket, self.key, self.data);
      }, this);
  },

  getSingleLink: function(bucket, key, tag, entity, callback, scope) {
    var self = this;

    this.messaging.getService("naming-rpc", function(namingRpc) {
      namingRpc.getSingleLink(function(result) {
        if(result.status == "success") {
          var linkedEntity = null;
          if(result.value != null) { // it's possible there is no linked entity
            // Note we are taking bucket from result.value, not self._bucket because the linked entity
            // might be from a different bucket
            linkedEntity = Ext.create(entity, result.value._bucket, result.value._key, result.value.data, self.messaging);
          }
          callback.call(scope, false, linkedEntity);
        } else {
          callback.call(scope, true, null);
        }
      }, self.bucket, self.key, bucket, key, tag);
    }, this);
  },

  getRelatedEntities: function(bucket, tag, entity, callback, scope) {
    var self = this;

    this.messaging.getService("naming-rpc", function(namingRpc) {
      namingRpc.getRelatedEntities(function(result) {
        if(result.status == "success") {
          var objects = [];
          for(var i = 0; i < result.value.length; i++) {
            objects.push(Ext.create(entity, result.value[i]._bucket, result.value[i]._key, result.value[i].data, self.messaging));
          }
          callback.call(scope, false, objects);
        } else {
          callback.call(scope, true, null);
        }
      }, self.bucket, self.key, bucket, tag);
    }, this);
  },

  findRelatedEntities: function(bucket, key, tag, query, entity, callback, scope) {
    var self = this;

    this.messaging.getService("naming-rpc", function(namingRpc) {
      namingRpc.findRelatedEntities(function(result) {
        if(result.status == "success") {
          var objects = [];
          for(var i = 0; i < result.value.length; i++) {
            objects.push(Ext.create(entity, result.value[i]._bucket, result.value[i]._key, result.value[i].data, self.messaging));
          }
          callback.call(scope, false, objects);
        } else {
          callback.call(scope, true, null);
        }
      }, self.bucket, self.key, bucket, key, tag, query);
    }, this);
  }

});

