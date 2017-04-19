/**
 * Created by gjrwcs on 4/18/2017.
 */
const MDT = require('../mallet/mallet.dependency-tree').MDT;
const EventTarget = require('eventtarget');

class StatusMessage {
    /**
     * @param message {string}
     * @param [level='info']
     * @param [duration=5000]
     */
    constructor(message,
                level = StatusMessage.defaultLevel,
                duration = StatusMessage.defaultDuration) {
        this.message = message;
        this.level = level;
        this.duration = duration;
    }

    getMessage() {
        return this.message;
    }

    getLevel() {
        return this.level;
    }

    getDuration() {
        return this.duration;
    }
}

StatusMessage.defaultDuration = 5000;
StatusMessage.defaultLevel = 'info';

class StatusService extends EventTarget {
    constructor(Log) {
        super();
        this.statuses = new PriorityQueue();
        this.priorities = Log.levels;
        Log.addLogger(this, Log.levels.Error);
    }

    error() {
        this.display('An unexpected error has been encountered', 'error');
    }

    display(message, level) {
        const status = new StatusMessage(message, level);
        this.statuses.enqueue(this.priorities[level], status);
        const evt = new Event('displayStatus');
        evt.status = status;
        this.dispatchEvent(evt);
    }

    getNextStatus() {
        return this.statuses.dequeue();
    }

    getMessages() {
        return this.statuses;
    }
}

module.exports = {StatusService,
resolve: ADT => [
    MDT.Log,
    StatusService
]};