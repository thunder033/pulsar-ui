/**
 * Created by gjr8050 on 11/11/2016.
 */
(()=>{
    'use strict';
    angular.module('pulsar.warp')
        .service('warp.State', [State]);

    /**
     * Maintains state of the game and fires state change events
     * @property Paused
     * @property Playing
     * @property LevelComplete
     * @property Loading
     * @constructor
     */
    function State(){

        var state,
            stateListeners = [];

        /**
         * Invokes callbacks for events listening for the given state
         * @param state
         */
        function invokeStateListeners(state) {
            stateListeners.forEach(listener => {
                if((listener.state | state) === state){
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
            stateListeners.push({
                state: state,
                callback: callback
            });
        };

        Object.defineProperties(this, {
            'current': {get: ()=>state, set: value =>{ state = value; invokeStateListeners(state); }},

            'Paused': {value: 1, enumerable: true},
            'Playing': {value: 2, enumerable: true},
            'LevelComplete': {value: 4, enumerable: true},
            'Loading': {value: 8, enumerable: true}
        });

        this.is = (checkState) => {
            //Checks if the current state is included in the check state
            return (checkState | state) === state;
        };

        state = this.Loading;
    }
})();