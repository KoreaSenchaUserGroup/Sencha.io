Ext.define('Ext.io.transports.PollingTransport', {

  mixins: {
      observable: 'Ext.util.Observable'
  },

  intervalId: null,

  config: {
    key: '',
    url: 'http://msg.sencha.io',
    clientId: '',
    piggybacking: true,
    maxEnvelopesPerReceive: 10,
    pollingDuration: 5000
  },

  constructor: function(config) {
    this.initConfig(config);
    this.mixins.observable.constructor.call(this);

    return this;
  },

  getReceiveInvoker: function() {
      var self = this;

      var callback = function(err, response) {
        self.responseHandler(err, response);
      }

      Ext.util.Logger.debug("PollingTransport receive...");

      self.ajaxRequest("/receive",
        {key: self.config.key, client_id: self.config.clientId,
          max: self.config.maxEnvelopesPerReceive},{}, callback);
  },

  start: function() {
    var self = this;
    this.intervalId = setInterval(function() { self.getReceiveInvoker()} , this.config.pollingDuration);
  },

  stop: function() {
    clearInterval(this.intervalId);
  },

  responseHandler: function(err, response) {
    var self = this;

    if(!err) {
      Ext.util.Logger.debug("PollingTransport responseHandler: " + response.responseText);
      var data = Ext.decode(response.responseText);

      if(data != null) {
        var envelopes = data.envelopes;
        var hasMore = data.hasMore;

        if(hasMore) { // if there are more messages, make another RECEIVE call immediately
          setTimeout(function() { self.getReceiveInvoker()}, 0);
        }

        if(envelopes != null) {
          for(var i = 0; i < envelopes.length; i++) {
             this.fireEvent('receive', envelopes[i]);
          }
        }
      }
    } else {
      Ext.util.Logger.debug('PollingTransport responseHandler error: ' + response.status);
    }
  },



  send: function(message, callback) {
    var self = this;

    this.ajaxRequest("/send", { key: this.config.key, max: this.config.maxEnvelopesPerReceive }, message, function(err, response) {
      callback(err, response);

      if(self.config.piggybacking) {
        self.responseHandler(err, response);
      }
    });
   },

   subscribe: function(params, callback) {
      this.ajaxRequest("/subscribe", params, {}, callback);
   },

   unsubscribe: function(params, callback) {
     this.ajaxRequest("/unsubscribe", params, {}, callback);
   },



  ajaxRequest: function(path, params, jsonData, callbackFunction) {
     if(!this.config.piggybacking) {
       params.pg = 0; // client has turned off piggybacking
     }

     Ext.Ajax.request({
 	    method: "POST",
 	    url: this.config.url + path,
 	    params: params,
 	    jsonData: jsonData,
 	    scope: this,
       success: function(response) {
 		    if(callbackFunction){
           callbackFunction(null, response);
 		    }
       },
       failure: function(response) {
 		    if(callbackFunction){
           callbackFunction('error', response);
 		    }
       }
     });
   }
});

