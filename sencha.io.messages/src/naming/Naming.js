
Ext.define('Ext.io.Naming', {
	
  messaging: null,

  config: {
	},

  constructor: function(config, messaging) {
    this.initConfig(config);
    this.messaging = messaging;

    return this;
  },

  generateClientId: function() {
    return Ext.util.UUIDGenerator.generate();
  },

  getClientIdFromLocalStorage: function() {
    var clientId = null;

    try {
      if('localStorage' in window && window['localStorage'] !== null) {
        clientId = window.localStorage["sencha.io.client.uuid"]; // JCM ... now we use device.id
      }
    } catch(e) {
      clientId = null;
    }

    return clientId;
  },

  storeClientIdInLocalStorage: function(clientId) {
    window.localStorage["sencha.io.client.uuid"] = clientId; // JCM ... now we use device.id
  },

  getClientId: function() {
    var clientId = this.getClientIdFromLocalStorage();
    if(!clientId) {
      clientId = this.generateClientId();
      this.storeClientIdInLocalStorage(clientId);
    }
    return clientId;
  },

  getServiceDescriptor: function(serviceName, callback, scope) {
    if(serviceName == "naming-rpc") {
      callback.call(scope, {
        kind: "rpc",
        style: ["subscriber"],
        access: ["clients", "servers"],
        depends: ["messaging", "naming"],
        methods: [
					"getServiceDescriptor",
          "get", 
					"find",
					"update",
          "getSingleLink", 
					"getRelatedEntities", 
					"findRelatedEntities"
				]
      });
    } else {
      this.messaging.getService("naming-rpc", function(namingRpc) {
        namingRpc.getServiceDescriptor(
          function(result) {
            if(result.status == "success") {
              callback.call(scope, result.value);
            } else {
              callback.call(scope, null);
            }
          }, serviceName);
      }, this);
    }
  }
});

