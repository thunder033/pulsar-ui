/**
 * Created by Greg on 10/28/2016.
 */
const MDT = require('./mallet.dependency-tree').MDT;
require('angular').module('mallet').service(MDT.Keyboard, [
    MDT.const.Keys,
    Keyboard]);

/**
 * @method onKeyDown
 * @method isKeyDown
 * @method onKeyUp
 * @constructor
 */
function Keyboard() {
    const keyState      = [];
    const keyDownEvents = [];
    const keyUpEvents   = [];

    function invokeListeners(listeners, e) {
        listeners.forEach((listener) => {
            // this is sort of unreliable but should be good enough for our purposes
            if (listener.key === e.keyCode || listener.key === String.fromCharCode(e.keyCode)) {
                listener.callback(e);
            }
        });
    }

    /**
     * Removes the given event listener
     * @param arr
     * @param listener
     */
    function removeListener(arr, listener) {
        const index = arr.indexOf(listener);
        if (index > -1) {
            arr.splice(index, 1);
        }
    }

    window.addEventListener('keyup', (e) => {
        keyState[e.keyCode] = false;
        invokeListeners(keyUpEvents, e);
    });
    
    window.addEventListener('keydown', (e) => {
        if (keyState[e.keyCode] !== true) {
            invokeListeners(keyDownEvents, e);
        }

        keyState[e.keyCode] = true;
    });
    
    this.isKeyDown = keyCode => keyState[keyCode] === true;

    /**
     * Adds an event listener invoked once when a key is pressed down
     * @param key: key to listen for
     * @param callback {Function}: handler to invoke
     * @returns {function(this:null)}: function to remove the listener
     */
    this.onKeyDown = (key, callback) => {
        const listener = {key, callback};
        keyDownEvents.push(listener);
        return removeListener.bind(null, keyDownEvents, listener);
    };

    /**
     * Adds an event listener invoked once when a key is released
     * @param key: key to listen for
     * @param callback {Function}: handler to invoke
     * @returns {function(this:null)}: function to remove the listener
     */
    this.onKeyUp = (key, callback) => {
        const listener = {key, callback};
        keyUpEvents.push(listener);
        return removeListener.bind(null, keyUpEvents, listener);
    };
}
