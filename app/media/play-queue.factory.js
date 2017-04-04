'use strict';
/**
 * Created by Greg on 12/1/2016.
 */
var EventTarget = require('eventtarget');

require('angular')
    .module('pulsar.media')
    .factory('media.PlayQueue', [
        'media.const.State',
        'media.IPlayable',
        playQueueFactory
    ]);

function playQueueFactory(MediaState, IPlayable) {

    /**
     * Holds the list of items to be sent to be played
     */
    class PlayQueue extends EventTarget {

        constructor(audioPlayer){
            super();

            /** @type {Array<IPlayable>} */
            this._queue = [];
            /** @type {audio.Player} */
            this._player = audioPlayer;

            audioPlayer.addEventListener('ended', ()=>{
                var next = this.getNext();
                if(next !== null){
                    this._player.playClip(next);
                }
            });
        }

        /**
         * Dequeue and return the next playable item
         * @returns {IPlayable}
         */
        getNext(){
            var next = null;
            do {
                if(this._queue.length === 0){
                    break;
                }

                next = this._queue.shift();
            } while (next.getState() === MediaState.Error );
            this.dispatchEvent(new Event('itemDequeued'));
            return next;
        }

        /**
         * Adds the playable item to the queue with the given placement
         * @param {IPlayable} playable - item to add to the play queue
         * @param {int} [placement=PlayQueue.PlayNext] where to add the item
         */
        addItem(playable, placement){
            if(!(playable instanceof IPlayable)){
                throw new TypeError('Only objects of type IPlayable can be queued');
            }

            placement = typeof placement === 'undefined' ? PlayQueue.PlayNext : placement;
            var evt = new Event('itemAdded');
            evt.item = playable;
            switch (placement){
                case PlayQueue.PlayNext:
                    this._queue.unshift(playable);
                    this.dispatchEvent(evt);
                    break;
                case PlayQueue.QueueEnd:
                    this._queue.push(playable);
                    this.dispatchEvent(evt);
                    break;
                case PlayQueue.PlayNow:
                    this._player.playClip(playable);
                    break;
                default:
                    throw new ReferenceError('Invalid placement value: ' + placement);
            }
        }

        /**
         * Get the list of items in the queue
         * @returns {Array.<IPlayable>}
         */
        getItems(){
            return this._queue;
        }
    }

    PlayQueue.PlayNext = 0;
    PlayQueue.PlayNow = 1;
    PlayQueue.QueueEnd = 2;

    return PlayQueue;
}