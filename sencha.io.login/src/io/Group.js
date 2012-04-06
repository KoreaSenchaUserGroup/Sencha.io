/**
 * {@img diagram.003.png Class Diagram}
 *
 * The Ext.io.Group class represents a group of users. There is only one
 * group object, called the current group object, available to the client.
 * If the current app is not associated with a user group then there will
 * be no user group.
 *
 * Methods are provided for navigation through the graph of objects available
 * to the currently running client code. 
 */
Ext.define('Ext.io.Group', {
    extend: 'Ext.io.Entity',

    statics: {

        /**
         * Get the current user Group object.
         *
         * @param {Function} callback Returns an Ext.io.Group
         * @param {Ext.io.Group} callback.group
         * @param {Object} scope
         */
        getCurrent: function(callback, scope) {
            var groupId = Ext.util.Cookie.getItem("group.id");
            if (!groupId) {
                callback.call(scope, {
                    message: "Group not found"
                }, null);
            } else {
                Ext.create('Ext.io.Entities', "Realms", Ext.io.messaging).get(groupId, callback, scope);
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
     * Get the App associated with this user Group.
     *
     * Returns an instance of {Ext.io.App} for the current app.
     *
     * @param {Function} callback Returns an Ext.io.App
     * @param {Ext.io.App} callback.app
     * @param {Object} scope
     */
    getApp: function(callback, scope) {
        Ext.io.App.getCurrent(callback, scope);
    },

    /**
     * Find Users that match a query.
     *
     * Returns all the user objects that match the given query. The query is a String
     * of the form name:value. For example, "hair:brown", would search for all the
     * users with brown hair, assuming that the app is adding that attribute to all
     * its users. 
     *
     * @param {String} query
     * @param {Function} callback Returns an array of {Ext.io.User}
     * @param {Ext.io.User[]} callback.users
     * @param {Object} scope
     */
    findUsers: function(query, callback, scope) {
        this.findRelatedEntities("Users", this.key, null, query, 'Ext.io.User', callback, scope);
    },

    /**
     * Register a new User.
     * 
     * If the user does not already exist in the group then a new user is created,
     * and is returned as an instance of {Ext.io.User}. The same user is now available
     * through the {Ext.io.getCurrentUser}.
     *
     * @param {Object} params User profile attributes.
     * @param {Object} params.username
     * @param {Object} params.password
     * @param {Object} params.email
     * @param {Function} callback Returns an {Ext.io.User}, if registration succeeds
     * @param {Ext.io.User} callback.user
     * @param {Object} scope
     */
    register: function(params, callback, scope) {
        var self = this;

        this.messaging.getService('authorization',
        function(authService) {
            authService.realmRegister(function(result) {
                if (result.status == "success") {
                    callback.call(scope, false, Ext.create('Ext.io.User', result.value._bucket, result.value._key, result.value.data, self.messaging));
                } else {
                    callback.call(scope, true, null);
                }
            }, self.key, params);
        },
        this);
    },

    /**
     * Authenticate an existing User.
     *
     * Checks if the user is a member of the group. The user provides a username
     * and password. If the user is a member of the group, and the passwords match,
     * then an instance of {Ext.io.User} is returned. The current user object is
     * now available through {Ext.io.getCurrentUser}
     *
     * We use a digest based authentication mechanism to ensure that no
     * sensitive information is passed over the network.
     *
     * @param {Object} params Authentication credentials
     * @param {Object} params.username
     * @param {Object} params.password
     * @param {Function} callback Returns an {Ext.io.User}, if authentication succeeds
     * @param {Ext.io.User} callback.user
     * @param {Object} scope
     */
    authenticate: function(params, callback, scope) {
        Ext.io.AuthStrategies.strategies['digest'](this, params, callback, scope);
    },

});
