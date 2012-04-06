Ext.ns('Ext.io.transports');

Ext.define('Ext.io.transports.SocketIoTransport', {
    mixins: {
        observable: 'Ext.util.Observable'
    },

    config: {
      key: '',
      url: 'http://msg.sencha.io',
      clientId: ''
    },

     constructor : function(config) {
       config = config || {};
       console.log("config", config);
       Ext.apply(this, config);
       /** @private
         * @event receive
         *  Connection recives an envelope from the server.
         * @param {Object} envelope from the server.
         */
         /** @private
          * @event error
          *  An error condition is recived via the socket connnection
          * @param {Object} error The error Message.
          */

      this.mixins.observable.constructor.call(this);

    },


    /** @private
    * connects to the server and registers to receive messages for the clientID passed
    *
    * @param {Object} clientID the id of this client.
    */
    start: function() {
      Ext.util.Logger.debug("connecting to ", this.url);
      var me = this;
      me.socket = io.connect(me.url);

      me.socket.on('receive', function(data) {
    	  me._receive(data);
    	});

      me.socket.on('connect', function () {
        Ext.util.Logger.debug("start", me.clientId);
        me.socket.emit('start', {"client_id":me.clientId});
      });
    },

    send: function(message, callback) {
      message.key = this.key;
      this._emit('send', message, callback);
    },

    subscribe: function(message, callback) {
      this._emit('subscribe', message, callback);
    },

    unsubscribe: function(message, callback) {
     this._emit('unsubscribe', message, callback);
    },

   _emit: function(channel, message, callback) {
      console.log("send socket", this.socket, message)
      if(this.socket){
        this.socket.emit(channel, message, callback);
      }
    },

    _receive: function(data){
      Ext.util.Logger.debug("_receive", data);

    	if(data.envelope) {
        this.fireEvent('receive', data.envelope);
      } else if(data.envelopes && data.envelopes.length > 0) {
         var l = data.envelopes.length;
        for(var i =0; i < l; i++ ) {
          this.fireEvent('receive', data.envelopes[i]);
        }
      }
    }
  });

