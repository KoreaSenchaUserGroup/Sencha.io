/**
 * Service
 *
 * Instances of {Ext.io.Service} represent proxy object to async message based services running in the backend.
 * You can use the proxy to send async messages to the service, to receive async messages from the service,
 * and if the service is a PubSub type of service, to subscribe/unsubscribe to updates from the service.
 *
 * For example:
 *
 * Ext.io.getService("weather", function(weatherService) {
 *   weatherService.send({temperature: temperature}, function() {
 *     display("Weather Sensor: sent temperature update " + temperature);
 *   }, this);
 * });
 *
 *
 * Ext.io.getService("weather", function(weatherService) {
 *   weatherService.subscribe(function(service, msg) {
 *     display(service + " got temperature update: " + msg.temperature);
 *   }, this, function(err, response) {
 *     console.log("Error during subscribe!");
 *   });
 * });
 *
 */
Ext.define('Ext.io.Service', {

  name: null,

  /**
   * @private
   */
  descriptor: null,

  /**
   * @private
   */
  transport: null,

  /**
   * @private
   */
  constructor: function(name, descriptor, transport) {
    this.name = name;
    this.descriptor = descriptor;
    this.transport = transport;

    return this;
  },

  /**
   * Send an async message to the service
   *
   * @param {Object} message to send to the service
   * @param {Function} callback
   * @param {Object} scope
   */
  send: function(message, callback, scope) {
    this.transport.sendToService(this.name, message, callback, scope);
  },

  /**
   * Receive async messages from the service
   *
   * For PubSub type of services, which need subscription to start getting messages, see the 'subscribe' method.
   *
   * @param {Function} callback
   * @param {String} callback.from the service the message originated from, i.e. the name of this service
   * @param {Object} callback.msg the message from the service
   * @param {Object} scope
   */
  receive: function(callback, scope) {
    this.transport.setListener(this.name, function(envelope) {
      callback.call(scope, envelope.from, envelope.msg);
    }, this);
  },

  /*
   * Subscribe to receive messages from this service.
   *
   * This method must be used only for PubSub type of services.
   * Some services do not need subscription for delivering messages. Use 'receive' to get messages
   * from such services.
   *
   * @param {Function} callback the callback is called once for each incoming message from the service
   * @param {String} callback.service the service the message originated from, i.e. the name of this service
   * @param {Object} callback.msg the message from the service
   * @param {Object} scope
   * @param {Function} errCallback the error callback
   *
   */
  subscribe: function(callback, scope, errCallback) {
    var self = this;

    self.transport.subscribe(self.name, function(err, response) {
      if(err) {
        if(errCallback) {
          errCallback.call(scope, err, response);
        }
      } else {
        self.transport.setListener(self.name, function(envelope) {
          callback.call(scope, envelope.service, envelope.msg);
        }, self);
      }
    }, self);
  },

  /*
   * Unsubscribe from receiving messages from this service.
   *
   * This method must be used only for PubSub type of services.
   *
   * @param {Function} callback called on success
   * @param {Object} scope
   * @param {Function} errCallback called on errors
   *
   */
  unsubscribe: function(callback, scope, errCallback) {
    Ext.io.messaging.transport.unsubscribe(this.name, function(err, response) {
      if(err) {
        if(errCallback) {
          errCallback.call(scope, err, response);
        }
      } else {
        callback.call(scope, err, response);
      }
    }, this);
  }
});
