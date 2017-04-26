/**
 * Created by gjr8050 on 11/11/2016.
 */

require('angular').module('pulsar.warp')
    .service('warp.State', [State]);

/**
 * Maintains state of the game and fires state change events
 * @property Paused
 * @property Playing
 * @property LevelComplete
 * @property Loading
 * @constructor
 */
function State() {
    let curState;
    const stateListeners = [];

    /**
     * Invokes callbacks for events listening for the given state
     * @param newState
     */
    function invokeStateListeners(newState) {
        stateListeners.forEach((listener) => {
            if ((listener.state | newState) === newState) {
                listener.callback();
            }
        });
    }

    /**
     * Creates an event listener for the given state
     * @param state
     * @param callback
     */
    this.onState = (state, callback) => {
        stateListeners.push({state, callback});
    };

    Object.defineProperties(this, {
        current: {
            get: () => curState,
            set: (value) => { curState = value; invokeStateListeners(curState); }},

        Paused: {value: 1, enumerable: true},
        Playing: {value: 2, enumerable: true},
        LevelComplete: {value: 4, enumerable: true},
        Loading: {value: 8, enumerable: true},
    });

    // Checks if the current state is included in the check state
    this.is = checkState => (checkState | curState) === curState;

    curState = this.Loading;
}
