/**
 * {@img diagram.003.png Class Diagram}
 * 
 * The {Ex.io.Device} class represents the device on which an app instance
 * is running. There is a current device object, for the client code
 * currently running, and is always available. Instances of this class are
 * also used to represent other devices running the same app. We can
 * communicate with them using this class.
 *
 * Methods are provided for navigation through the graph of objects available
 * to the currently running client code.
 * 
 */
Ext.define('Ext.io.Device', {
    extend: 'Ext.io.Entity',

    statics: {
        /**
         * Get the current Device object.
         *
         * The current Device object is an instance of {Ext.io.Device} class. It represents
         * the device that this web app is running on. It is always available.
         *
         * @param {Function} callback Returns an Ext.io.Device
         * @param {Ext.io.Device} callback.device
         * @param {Object} scope
         */
        getCurrent: function(callback, scope) {
            var deviceId = Ext.util.Cookie.getItem("device.id");
            if (!deviceId) {
                callback.call(scope, {
                    message: "Device ID not found"
                },
                null);
            } else {
                Ext.create('Ext.io.Entities', "Instances", Ext.io.messaging).get(deviceId, callback, scope);
            }
        }
    },

    /** 
     * @private
     */
    constructor: function(bucket, key, data, messaging) {
        this.superclass.constructor.call(this, bucket, key, data, messaging);
    },

    /**
     * Get the App associated with this Device.
     *
     * Returns an instance of {Ext.io.App} for the current app.
     *
     * @param {Function} callback Returns an Ext.io.App
     * @param {Ext.io.App} callback.app
     * @param {Object} scope
     */
    getApp: function(callback, scope) {
        this.getSingleLink("Versions", this.data.version, null, "Ext.io.Entity", function(err, version) {
            if (err) {
                callback(err, null);
            } else {
                version.getSingleLink("Apps", null, "Ext.io.App", callback, scope);
            }
        },
        this);
    },

    /**
     * Get the User associated with this Device, if any.
     *
     * @param {Function} callback Returns an Ext.io.User, if any
     * @param {Ext.io.User} callback.user
     * @param {Object} scope
     */
    getUser: function(callback, scope) {
        this.getSingleLink("Users", null, null, "Ext.io.User", callback, scope);
    },

    /**
     * Send a message to this Device.
     *
     * The send method allow messages to be sent to another device. The message
     * is a simple Javascript object. The message is queued on the server until
     * the destination device next comes online, then it is delivered.
     *
     * See receive for receiving these device to device messages.
     *
     * @param {Object} message A simple Javascript object.
     * @param {Function} callback
     * @param {Object} scope
     */
    send: function(message, callback, scope) {
        this.messaging.transport.sendToClient(this.key, message, callback, scope);
    },

    /**
     * Receive messages for this Device.
     *
     * To receive messages sent directly to a device the app must use this 
     * method to register a handler function. Each message is passed to the
     * callback function as it is received. The message is a simple Javascript
     * object.
     *
     * See send for sending these device to device messages.
     *
     * @param {Function} callback
     * @param {Object} callback.from An object representing the source of the message. 
     *   A message received from another device would have a from of class {Ext.io.Device}.
     * @param {Object} callback.message A simple Javascript object.
     * @param {Object} scope
     */
    receive: function(callback, scope) {
        this.messaging.transport.setListener("courier", function(envelope) {
            // JCM we should turn the from into an Ext.io.User
            callback.call(scope, envelope.from, envelope.msg);
        },
        this);
    }

});
