/**
 * {@img diagram.003.png Class Diagram}
 *
 * The Ext.io.App class represents the web app itself. There is only one
 * app object, called the current app object, available in the client.
 * It is always available.
 *
 * Methods are provided for navigation through the graph of objects available
 * to the currently running client code. 
 *
 */
Ext.define('Ext.io.App', {
    extend: 'Ext.io.Entity',

    statics: {
        /**
         * Get the current App object.
         *
         * The current App object is an instance of the {Ext.io.App} class. It represents
         * the web app itself. It is always available, and serves as the root of
         * the server side objects available to this client.
         *
         * @param {Function} callback Returns an Ext.io.App
         * @param {Ext.io.App} callback.app
         * @param {Object} scope
         */
        getCurrent: function(callback, scope) {
            var appId = Ext.util.Cookie.getItem("app.id");
            if (!appId) {
                callback.call(scope, {
                    message: "No active apps."
                },
                null);
            } else {
                Ext.create('Ext.io.Entities', 'Apps', Ext.io.messaging).get(appId, callback, scope);
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
     * Get the current user Group, if any.
     *
     * The current user Group object is an instance of {Ext.io.Group}. It represents
     * the group associated with the app. If the app is not associated with a group,
     * then there will no current group.
     *
     * The group is used for registering and authenticating users, and for searching
     * for other users.
     *
     * @param {Function} callback Return an Ext.io.Group, if there is one.
     * @param {Ext.io.Group} callback.group
     * @param {Object} scope
     */
    getGroup: function(callback, scope) {
        this.getSingleLink("Realms", null, null, "Ext.io.Group", callback, scope);
    },

    /**
     * Find devices that match a query.
     * 
     * Returns all the device objects that match the given query. The query is a String
     * of the form name:value. For example, "location:austin", would search for all the
     * devices in Austin, assuming that the app is adding that attribute to all
     * its devices. 
     *
     * @param {Object} query
     * @param {Function} callback Returns matching devices.
     * @param {Ext.io.Device[]} callback.devices An array of devices.
     */
    findDevices: function(query, callback, scope) {
        this.findRelatedEntities("Apps", this.key, null, query, "Ext.io.Device",
        function(err, devices) {
            if (err) {
                callback.call(scope, err, null);
            } else {
                callback.call(scope, null, devices);
            }
        });
    },

    /**
     * Get a named queue
     *
     * All instances of an app have access to the same
     * named queues. If an app gets the same named queue on many devices then
     * those devices can communicate by sending messages to each other. Messages 
     * are simple javascript objects, which are sent by publishing them through 
     * a queue, and are received by other devices that have subscribed to the 
     * same queue.
     *
     * @param {Object} config
     * @param {String} config.name The name of the queue.
     * @param {Function} callback Return an Ext.io.Queue
     * @param {Ext.io.Queue} callback.queue
     * @param {Object} scope
     */
    getQueue: function(config, callback, scope) {
        this.messaging.getQueue(config.name, callback, scope);
    },

});

