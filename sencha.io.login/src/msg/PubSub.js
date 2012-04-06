
Ext.define('Ext.io.PubSub', {
	
  queueCallbackMap: {},

  transport: null,

  config: {

  },

  constructor: function(config, transport) {
    this.initConfig(config);
    this.transport = transport;

    return this;
  },

  handleIncoming: function(envelope) {
    var queueName = envelope.msg.queue;
    if(queueName && this.queueCallbackMap[queueName]) {
      var item = this.queueCallbackMap[queueName]
		  item.callback.call(item.scope,envelope.from, envelope.msg.data);
    } else {
      Ext.util.Logger.warn("PubSub: No callback for queueName " + queueName);
    }
  },

  publish: function(queueName, data, callbackFunction, scope) {
    this.transport.send({service:"client-pubsub", msg:{api:"publish", queue:queueName, data:data}}, callbackFunction, scope);
  },

  subscribe: function(queueName, callbackFunction, scope, errCallbackFunction) {
    var self = this;

    this.transport.setListener("client-pubsub", this.handleIncoming, this);

    this.transport.send({service:"client-pubsub", msg:{api:"subscribe", queue:queueName}}, function(err) {
      if(err) {
			  if (errCallbackFunction) {
        	errCallbackFunction.call(scope, err);
			  }
      } else {
        self.queueCallbackMap[queueName] = {callback:callbackFunction,scope:scope};
        Ext.util.Logger.info("client-pubsub: " + self.transport.getClientId() + " subscribed to " + queueName);
      }
    }, this);
  },

  unsubscribe: function(queueName, callbackFunction, scope) {
    var self = this;

    delete this.queueCallbackMap[queueName];
    this.transport.send({service:"client-pubsub", msg:{api:"unsubscribe", queue:queueName}}, function(err) {
      Ext.util.Logger.info("client-pubsub: " + self.transport.getClientId() + " unsubscribed to " + queueName);
		  if(callbackFunction){
        callbackFunction.call(scope,err);
		  }
    }, this);
  }
});

