/**
 * Proxy
 *
 * Instances of {Ext.io.Proxy} represent proxy objects to services running in the backend. Any
 * RPC method defined by the service can be invoked on the proxy as if it were a local method.
 *
 * The first parameter to any RPC method is always a callback function, followed by the parameters
 * to the method being called on the server.
 *
 * For example:
 *
 * Ext.io.getService("calculator", function(calculator) {
 *   calculator.add(function(result) { // callback
 *       display("Calculator: " + number1 + " + " + number2 + " = " + result.value);
 *     },
 *     number1, number2 // arguments
 *   );
 * });
 *
 * The callback function to the RPC method is passed the result of the RPC call.
 */
Ext.define('Ext.io.Proxy', {

  name: null,

  /**
   * @private
   */
  descriptor: null,

  /**
   * @private
   */
  rpc: null,

  /**
   * @private
   */
  constructor: function(name, descriptor, rpc) {
    this.name = name;
    this.descriptor = descriptor;
    this.rpc = rpc;

    if(this.descriptor.kind != 'rpc') {
			Ext.util.Logger.error(this.name + " is not a RPC service");
      throw "Error, proxy does not support non-RPC calls";
    }

    this._createMethodProxies();

    return this;
  },

  /**
   * @private
   */
  _createMethodProxies: function() {
    var self = this;
    for(var i = 0; i < this.descriptor.methods.length; i++) {
      var methodName = this.descriptor.methods[i];
      self[methodName] = self._createMethodProxy(methodName);
    }
  },

  /**
   * @private
   */
  _createMethodProxy: function(methodName) {
    var self = this;

    return function() {
      arguments.slice = Array.prototype.slice;
      var serviceArguments = arguments.slice(0);
      var style = self.descriptor.style[0];
      if(self.descriptor.style.indexOf("subscriber") > 0) {
        style = "subscriber"; // prefer subscriber style if available
      }

      self.rpc.call(serviceArguments[0], self.name, style, methodName, serviceArguments.slice(1));
    }
  }

});
