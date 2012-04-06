/**
 * {@img diagram.003.png Class Diagram}
 *
 * The Ext.io.User class represents a user. If the current app is associated
 * with a user group and that user group has been configured appropriatly, 
 * then a current user object will be available for the user currently 
 * using the app. Instances of this class are also used to represent other users
 * using the same app. We can communicate with them using this class.
 *
 * Methods are provided for navigation through the graph of objects available
 * to the currently running client code. 

 */
Ext.define('Ext.io.User', {
    extend: 'Ext.io.Entity',

    statics: {
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
         * @params {Function} callback Returns an Ext.io.User, if any.
         * @param {Ext.io.User} callback.user
         * @param {Object} scope
         */
        getCurrent: function(callback, scope) {
            var userId = Ext.util.Cookie.getItem("user.id");
            if (!userId) {
                callback.call(scope, {
                    message: "User not logged in."
                }, null);
            } else {
                Ext.create('Ext.io.Entities', "Users", Ext.io.messaging).get(userId, callback, scope);
            }
        },

    },

    /** 
     * @private
     */
    constructor: function(bucket, key, data, messaging) {
        this.superclass.constructor.call(this, bucket, key, data, messaging);
        this.userQueueName = bucket + '/' + key;
        // name of the user queue (inbox)
    },

    /**
     * Get all devices that belong to this user
     *
     * @param {Function} callback Returns an array of Ext.io.Device objects
     * @param {Object} scope
     */
    getDevices: function(callback, scope) {
        this.getRelatedEntities("Instances", null, "Ext.io.Device", callback, scope);
    },

    /**
     * Get the user group that this user is a member of.
     *
     * @param {Function} callback Returns an Ext.io.Group
     */
    getGroup: function(callback, scope) {
        this.getSingleLink("Realms", this.data.realm, null, "Ext.io.Group", callback, scope);
    },

    /**
     * Send a message to this User.
     *
     * @param {Object} message A simple Javascript object.
     * @param {Function} callback
     * @param {Object} scope
     */
    send: function(message, callback, scope) {
        this.messaging.pubsub.publish(this.userQueueName, message, callback, scope);
    },

    /**
     * Receive messages for this User.
     *
     * @param {Function} callback
     * @param {String} callback.from
     * @param {Object} callback.message A simple Javascript object.
     * @param {Object} scope
     * @param {Function} errCallback (optional)
     */
    receive: function(callback, scope, errCallback) {
        this.messaging.pubsub.subscribe(this.userQueueName, callback, scope, errCallback);
    }

});
