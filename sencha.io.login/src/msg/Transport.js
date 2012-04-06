
Ext.define('Ext.io.Transport', {
	
  naming: null,

  transport: null,

  oldConsoleLog: null,

  listeners: {},

  /** @private
  * Mapping of transport classes to short name
  * transportName provided by config used for transport lookup.
  */
  transportClasses: {
    "polling": 'Ext.io.transports.PollingTransport',
    "socket": "Ext.io.transports.SocketIoTransport",
  },

  config: {
    key: '',
    url: 'http://msg.sencha.io',
    clientId: '',
    piggybacking: true,
    maxEnvelopesPerReceive: 10,
    transportName: ""
  },

  constructor: function(config, naming) {
    this.initConfig(config);
    this.naming = naming;

    if(!this.getClientId()) {
      this.setClientId(this.naming.getClientId());
    }
    config.clientId = this.getClientId();
    var me = this;
    this.transportName = config.transportName || "polling";

    Ext.util.Logger.info("Using transport name ", this.transportName);

    this.transport = Ext.create(this.transportClasses[this.transportName], config);
    this.transport.start();
    this.transport.on('receive', function(envelope) {me.receive(envelope);});

    return this;
  },

  setListener: function(serviceName, listener, scope) {
    this.listeners[serviceName] = {listener:listener, scope:scope};
  },

  removeListener: function(serviceName) {
    delete this.listeners[serviceName];
  },

  sendToService: function(serviceName, payload, callbackFunction, scope) {
    this.send({service: serviceName, msg: payload}, callbackFunction, scope)
  },

  sendToClient: function(targetClientId, payload, callbackFunction, scope) {
    payload.to = targetClientId;
    this.send({service: "courier", msg: payload}, callbackFunction, scope);
  },

  send: function(envelope, callbackFunction, scope) {
    var self = this;

    envelope.from = this.getClientId();

    Ext.util.Logger.debug("Transport.send " + JSON.stringify(envelope));

    this.transport.send(envelope, function(err, response) {
      if(callbackFunction){
        callbackFunction.call(scope, err, response);
      }
    });

  },

  receive: function(envelope) {
    Ext.util.Logger.debug("Transport.receive " + JSON.stringify(envelope));

    // dispatch it to the correct service listener
    if(this.listeners[envelope.service]) {
      var map = this.listeners[envelope.service];
      map.listener.call(map.scope, envelope);
    } else {
      Ext.util.Logger.error("No listener for " + envelope.service);
    }
  },

  subscribe: function(serviceName, callbackFunction, scope) {
    Ext.util.Logger.debug("Transport.subscribe " + serviceName);

    var params = { key: this.getKey(), client_id: this.getClientId(), service: serviceName };

    this.transport.subscribe(params, function(err, response) {
      if(callbackFunction){
        callbackFunction.call(scope, err, response);
      }
    });

  },

  unsubscribe: function(serviceName, callbackFunction, scope) {
    Ext.util.Logger.debug("Transport.unsubscribe " + serviceName);

    var params = { key: this.getKey(), client_id: this.getClientId(), service: serviceName };

    this.transport.unsubscribe(params, function(err, response) {
      if(callbackFunction){
        callbackFunction.call(scope, err, response);
      }
    });

  }

});

