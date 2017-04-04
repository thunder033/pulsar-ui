/**
 * Created by gjrwcs on 11/29/2016.
 */
'use strict';

require('angular')
    .module('pulsar.media')
    .factory('media.IPlayable', [
        iPlayableFactory
    ]);

/**
 * @description An object that provides a playable audio buffer
 * @interface IPlayable
 */
class IPlayable {

    /**
     * Construct an IPlayable instance
     */
    constructor(){}

    /**
     * @returns {string} the name of the item
     */
    getName() {
        throw new Error('not implemented');
    }

    /**
     * Get the duration of the item in seconds
     */
    getDuration() {
        throw new Error('not implemented');
    }

    /**
     * Get info about the item such as artist and album
     */
    getInfo() {
        throw new Error('not implemented');
    }

    /**
     * @returns {IPromise<AudioBuffer>|Promise} an audio buffer to play
     */
    getBuffer() {
        throw new Error('not implemented');
    }

    /**
     * @returns {media.State|string} the media state of the playable
     */
    getState() {
        throw new Error('not implemented');
    }
}

/**
 * @returns {IPlayable}
 */
function iPlayableFactory(){
    return IPlayable;
}