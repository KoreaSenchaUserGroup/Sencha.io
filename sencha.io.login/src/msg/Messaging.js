
Ext.define('Ext.io.Messaging', {

  proxyCache : {},

  queueCache: {},

  naming: null,

  transport: null,

  rpc: null,

  pubsub: null,

  config: {
  },

  constructor: function(config) {
    this.initConfig(config);

    this.naming = Ext.create('Ext.io.Naming', config, this);
    this.transport = Ext.create('Ext.io.Transport', config, this.naming);
    this.rpc = Ext.create('Ext.io.Rpc', config, this.transport);
    this.pubsub = Ext.create('Ext.io.PubSub', config, this.transport);

    return this;
  },

  getService: function(serviceName, callback, scope) {
    var self = this;

    var service = this.proxyCache[serviceName];
    if(service) {
      callback.call(scope, service);
    } else {
      self.naming.getServiceDescriptor(serviceName, function(serviceDescriptor) {
        if(serviceDescriptor == null) {
					Ext.util.Logger.error("Unable to load service descriptor for " + serviceName);
          callback.call(scope, null);
        } else {
          if(serviceDescriptor.kind == "rpc") {
            service = Ext.create('Ext.io.Proxy', serviceName, serviceDescriptor, self.rpc);
          } else {
            service = Ext.create('Ext.io.Service', serviceName, serviceDescriptor, self.transport);
          }
          self.proxyCache[serviceName] = service;
          callback.call(scope, service);
        }
      });
    }
  },

  getQueue: function(queueName, callback, scope) {
    var self = this;

    var queue = this.queueCache[queueName];
    if(queue) {
      callback.call(scope, queue);
    } else {
      queue = Ext.create('Ext.io.Queue', queueName, this.pubsub);
      this.queueCache[queueName] = queue;
      callback.call(scope, queue);
    }
  }

});



// EOF

