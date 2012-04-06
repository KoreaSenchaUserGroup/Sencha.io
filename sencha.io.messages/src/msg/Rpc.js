
Ext.define('Ext.io.Rpc', {
	
  currentCallId: 0,

  callMap: {},

  transport: null,

  config: {
  },

  constructor: function(config, transport) {
    this.initConfig(config);
    this.transport = transport;

    return this;
  },

  generateCallId: function() {
    return ++this.currentCallId;
  },

  subscribe: function(envelope) {
    // got a response envelope, now handle it
    this.callback(envelope.msg["corr-id"], envelope);
  },

  dispatch: function(envelope, callbackFunction) {
    var corrId = this.generateCallId();
    envelope.msg["corr-id"] = corrId;
    envelope.from = this.transport.getClientId();

    this.callMap[corrId] = callbackFunction;

    // send the envelope
    this.transport.send(envelope, function() {
      // no-op
    }, this);
  },

  callback: function(corrId, envelope) {
    corrId = parseInt(corrId);
    if (!this.callMap[corrId]) {
      Ext.util.Logger.warn("No associated call with this envelope available: " + corrId);
    } else {
      this.callMap[corrId](envelope.msg.result);
      delete this.callMap[corrId];
    }
  },

  call: function(callbackFunction, serviceName, style, method, args) {
    // register for rpc-direct receive calls
    this.transport.setListener("rpc", this.subscribe, this);

    // register for serviceName receive calls (subscriber rpc)
    this.transport.setListener(serviceName, this.subscribe, this);

    switch(style) {
      case "subscriber":
        var envelope = {service: serviceName, from: this.transport.getClientId(), msg: {method: method, args: args}};
        this.dispatch(envelope, callbackFunction);
        break;
      case "direct":
        var envelope = {service: 'rpc', from: this.transport.getClientId(), msg: {service: serviceName, method: method, args: args}};
        this.dispatch(envelope, callbackFunction);
        break;
      default:
			  Ext.util.Logger.error(style + " is an invalid RPC style. Should be 'direct' or 'subscriber'");
        throw "Invalid RPC style: " + style;
        break;
    }
  }

});

