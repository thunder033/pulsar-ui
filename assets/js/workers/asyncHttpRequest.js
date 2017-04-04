"use strict";

// http://stackoverflow.com/questions/26668430/is-it-possible-to-run-angular-in-a-web-worker
self.window = self;

// Setup stubs for angular required document properties
// These are normally defined by the browser env
self.history = {};
self.Node = {prototype: {}}; //this one is new (not in SO question)
self.document = {
    readyState: 'complete',
    querySelector: function () {},
    createElement: function () {
        return {
            pathname: '',
            setAttribute: function () {}
        };
    }
};

var appPath = '../../../app/';

// Import angular
var angular = require('angular');

self.angular = angular;

// Load simple request
// for some reason this has to be a single string???
var simpleRequest = require('../../../app/network/simple-request');
//self.importScripts(`${appPath}shared/simple-request.js`);

// Create stub app
var workerApp = angular.module('worker-app', [simpleRequest.name]);

/**
 * Determines is one of the classes implementing the Transferable interface
 * @param data
 * @returns {boolean}
 */
function isTransferable(data) {
    return data instanceof ArrayBuffer || data instanceof ImageBitmap || data instanceof MessagePort;
}

var invocation = 0,
    simpleHttp = null;

function processMessage(e) {
    //Only create the angular app if it's the first invocation of the worker
    if(invocation++ === 0){
        workerApp.run(['simple-request.SimpleHttp', function(SimpleHttp){
            simpleHttp = SimpleHttp;
        }]);

        // Bootstrap the app
        self.angular.bootstrap(null, ['worker-app']);
    }

    var data = e.data;
    //Use the simleHttp service to invoke an http request
    simpleHttp.request(data)
        .then(response => {
            var transferList = (isTransferable(response)) ? [response] : [];
            postMessage({_id: e.data._id, _status: 'OK', data: response || ''}, transferList);
        }, error => {
            postMessage({_id: e.data._id, _status: 'ERROR', message: error});
        });
}

self.addEventListener('message', processMessage);