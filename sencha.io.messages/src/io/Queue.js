/**
 * Queue
 *
 * Allows the creation of named queues on the server, subscribing for updates from the queue
 * and publishing data to the queue.
 *
 * A queue can have multiple subscribers, and messages sent to the queue are delivered to each subscriber.
 * Messages published by a device are not sent back to the same device (i.e. echo is prevented)
 *
 * Note that once a queue has been subscribed to, messages will be delivered untill a subsequent 
 * call to the unsubscribe method is made.
 * 
 * If the device if offline, messages accumulate for it on the server, and will be delivered when 
 * the device reconnects.
 */
Ext.define('Ext.io.Queue', {

    // JCM should use config?
    // JCM should allow for Ext.create?

    name: null,

    /**
     * @private
     */
    pubsub: null,

    /**
     * @private
     */
    constructor: function(name, pubsub) {
        this.name = name;
        this.pubsub = pubsub;

        return this;
    },

    /**
     * Publish a message to this queue.
     *
     * The message will be delivered to all devices subscribed to the queue.
     *
     * @param {Object} message A simple Javascript object.
     * @param {Function} callback
     * @param {Object} scope
     */
    publish: function(message, callback, scope) {
        this.pubsub.publish(this.name, message, callback, scope);
    },

    /**
     * Subscribe to receive messages from this queue.
     *
     * To receive messages from a queue, it is necessary to subscribe to the queue.
     * Subscribing registers interest in the queue and starts delivery of messages
     * published to the queue using the callback.
     *
     * @param {Function} callback The callback is called once for each incoming message on the queue
     * @param {Object} callback.from An object representing the source of the message. 
     *   A message received from another device would have a from of class {Ext.io.Device}.
     * @param {Object} callback.message A simple Javascript object.
     * @param {Object} scope
     * @param {Function} errCallback (optional)
     */
    subscribe: function(callback, scope, errCallback) {
        this.pubsub.subscribe(this.name, callback, scope, errCallback);
    },

    /**
     * Unsubscribe from receiving messages from this queue.
     *
     * Once a queue has been subscribed to, message delivery will continue untill a call to unsubscribe is made.
     * If a device is offline but subscribed, messages sent to the queue will accumulate on the server,
     * to be delivered after the device reconnects at a later point of time.
     *
     * @param {Function} callback
     * @param {Object} scope
     */
    unsubscribe: function(callback, scope) {
        this.pubsub.unsubscribe(this.name, callback, scope);
    }

});
