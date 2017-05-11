const MDT = require('./mallet.dependency-tree').MDT;

/**
 * Client for a web worker
 * @class Thread
 */
require('angular').module('mallet').factory(MDT.Thread, [
    MDT.ng.$q,
    MDT.Log,
    threadFactory]);

function threadFactory($q, Log) {
    /**
     * @param {string} script name of the file to use in the worker
     * @constructor
     */
    function Thread(script) {
        if (!window.Worker) {
            throw new Error('Web workers are not supported by your browser.');
        }

        let opId = 0;
        const invocations = [];
        const worker = new Worker(script);

        /**
         * Determine which invocation was responded to and resolve its promise
         * @param {MessageEvent} e
         */
        function notifyClient(e) {
            if (typeof e.data._id === 'undefined') {
                throw new ReferenceError('Worker script did not provide operation ID');
            }

            // check the return status of the worker
            if (typeof invocations[e.data._id] === 'undefined') {
                // If we can't find the invocation give a warning
                Log.warn(`Response for invocation ${e.data._id} (${e.data._status}) 
                of ${script} could not be resolved`);
            } else if (e.data._status === 'ERROR') {
                // If it returned with an error, reject the promise
                invocations[e.data._id].reject(e.data.message);
            }            else {
                // Otherwise resolve the promise
                invocations[e.data._id].resolve(e.data.data || e.data);
            }

            delete invocations[e.data._id];
        }

        worker.onmessage = notifyClient;
        // worker.onerror =

        /**
         * Send a message to the worker
         * @param {*} params
         * @returns {Promise} resolves when the worker response is received
         */
        this.invoke = (params) => {
            const invocation = $q.defer();
            invocations[++opId] = invocation;
            params._id = opId;

            worker.postMessage(params);
            return invocation.promise;
        };

        /**
         * Indicates if the worker has any pending invocations
         * @returns {boolean}
         */
        this.isIdle = () => Object.keys(invocations).length === 0;
    }

    return {
        /**
         * Creates a new thread running the given script
         * @param script {string}
         * @returns {Thread}
         */
        create(script) {
            return new Thread(script);
        },
    };
}
