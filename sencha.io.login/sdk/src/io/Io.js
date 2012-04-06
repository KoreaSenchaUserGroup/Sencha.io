/**
 * {@img diagram.003.png Class Diagram}
 *
 * Ext.io is the namespace and entry point for Sencha.io SDK.
 *
 * It has static methods to get hold of the current {Ext.io.App}, {Ext.io.Device}, {Ext.io.User} or 
 * {Ext.io.Group} objects.
 *
 * A factory method is available for getting a named queue through which messages can be 
 * passed between clients.
 * 
 */
Ext.define('Ext.io', {

    statics: {

        config: {
            key: null,
            url: 'http://msg.sencha.io',
        },

        /**
         * @private
         */
        messaging: null,

        /**
         * Setup Ext.io for use.
         *
         * @param {Object} config
         * @param {String} config.url the server URL. Defaults to http://msg.sencha.io
         * @param {String} config.logLevel logging level. Should be one of "none", "debug", "info", "warn" or "error". Defaults to "error".
         * @param {String} config.transportName the transport type to use for communicating with the server. Should be one of "polling" (HTTP polling) or "socket" (SocketIO). Defaults to "polling".
         * @param {Boolean} config.piggybacking for "polling" transport, if HTTP responses can carry piggybacked envelopes from the server. Defaults to true.
         * @param {Number} config.maxEnvelopesPerReceive for "polling" transport, the maximum number of envelopes to return in one poll request. Defaults to 10.
         * @param {Number} config.pollingDuration for "polling" transport, the duration in milliseconds between poll requests. Defaults to 5 seconds.
         *
         * Calling this method is optional. It assumes the defaults mentioned above if not called.
         */
        setup: function(config) {
            Ext.apply(Ext.io.config, config);
        },

        /**
         * @private
         */
        init: function() {
            if (!Ext.io.messaging) {
                if (Ext.io.config.logLevel) {
                    Ext.util.Logger.setLevel(Ext.io.config.logLevel);
                }

                if (!Ext.io.config.key) {
                    Ext.io.config.key = Ext.util.Cookie.getItem("connect.sid");
                }

                Ext.io.messaging = Ext.create('Ext.io.Messaging', Ext.io.config);
            }
        },

        /**
         * Get the current App.
         *
         * The current App object is an instance of the {Ext.io.App} class. It represents
         * the web app itself. It is always available, and serves as the root of
         * the server side objects available to this client.
         *
         * @param {Function} callback Returns an Ext.io.App
         * @param {Ext.io.App} callback.app
         * @param {Object} scope
         */
        getCurrentApp: function(callback, scope) {
            Ext.io.init();
            Ext.io.App.getCurrent(callback, scope);
        },

        /**
         * Get the current Device.
         *
         * The current Device object is an instance of {Ext.io.Device} class. It represents
         * the device that this web app is running on. It is always available.
         *
         * @param {Function} callback Returns an Ext.io.Device
         * @param {Ext.io.Device} callback.device
         * @param {Object} scope
         */
        getCurrentDevice: function(callback, scope) {
            Ext.io.init();
            Ext.io.Device.getCurrent(callback, scope);
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
         * @param {Function} callback Returns an Ext.io.Group, if there is one
         * @param {Ext.io.Group} callback.group
         * @param {Object} scope
         */
        getCurrentGroup: function(callback, scope) {
            Ext.io.init();
            Ext.io.Group.getCurrent(callback, scope);
        },

        /**
         * Get the current User, if any.
         *
         * The current User object is an instance of {Ext.io.User}. It represents
         * the user of the web app. If there is no group associated with the app,
         * then there will not be a current user object. If there is a group, and
         * it has been configured to authenticate users before download then the
         * current user object will be available as soon as the app starts running.
         * If the group has been configured to authenticate users within the app
         * itself then the current user object will not exist until after a 
         * successful call to Ext.io.Group.authenticate has been made.
         *
         * @param {Function} callback Returns an Ext.io.User, if there is one
         * @param {Ext.io.User} callback.user
         * @param {Object} scope
         */
        getCurrentUser: function(callback, scope) {
            Ext.io.init();
            Ext.io.User.getCurrent(callback, scope);
        },

        /**
         * Get a proxy interface for a service.
         *
         * For RPC services, an instance of {Ext.io.Proxy} is returned, whereas for
         * async message based services, an instance of {Ext.io.Service} is returned.
         *
         * @param {String} name
         * @param {Function} callback Returns an {Ext.io.Service} or {Ext.io.Proxy}
         * @param {Ext.io.Service|Ext.io.Proxy} callback.service
         * @param {Object} scope
         */
        getService: function(name, callback, scope) {
            Ext.io.init();
            Ext.io.messaging.getService(name, callback, scope);
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
         * @param {String} name
         * @param {Function} callback Returns an {Ext.io.Queue}
         * @param {Ext.io.Queue} callback.queue
         * @param {Object} scope
         */
        getQueue: function(name, callback, scope) {
            Ext.io.init();
            Ext.io.messaging.getQueue(name, callback, scope);
        }
    }
});
