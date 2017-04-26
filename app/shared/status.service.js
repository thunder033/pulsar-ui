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
        this.persistent = false;
    }

    persist() {
        this.persistent = true;
        this.duration = false;
    }

    isPersistent() {
        return this.persistent;
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

        this.error = this.error.bind(this);
        this.display = this.display.bind(this);
    }

    /**
     *
     * @param message
     * @param level
     * @returns {function()}: Callback to remove the conditional status
     */
    displayConditional(message, level) {
        const status = new StatusMessage(message, level, NaN);
        status.persist();
        this.dispatchStatus(status);
        return () => { this.statuses.remove(status); };
    }

    error() {
        this.display('An unexpected error has been encountered', 'error');
    }

    dispatchStatus(status) {
        this.statuses.enqueue(this.priorities[status.getLevel()], status);
        const evt = new Event('displayStatus');
        evt.status = status;
        this.dispatchEvent(evt);
    }

    display(message, level) {
        const status = new StatusMessage(message, level);
        this.dispatchStatus(status);
    }

    getNextStatus() {
        return this.statuses.dequeue();
    }

    getMessages() {
        return this.statuses;
    }
}

module.exports = {StatusService,
// eslint-disable-next-line
resolve: ADT => [
    MDT.Log,
    StatusService,
]};
