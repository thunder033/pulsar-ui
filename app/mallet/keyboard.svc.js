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

    window.addEventListener('keyup', (e) => {
        keyState[e.keyCode] = false;
        invokeListeners(keyUpEvents, e);
    });
    
    window.addEventListener('keydown', (e) => {
        keyState[e.keyCode] = true;
        invokeListeners(keyDownEvents, e);
    });
    
    this.isKeyDown = keyCode => keyState[keyCode] === true;

    this.onKeyDown = (key, callback) => {
        keyDownEvents.push({key, callback});
    };

    this.onKeyUp = (key, callback) => {
        keyUpEvents.push({key, callback});
    };
}
