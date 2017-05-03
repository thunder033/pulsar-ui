/**
 * Created by Greg on 11/27/2016.
 *
 * Misc. shared utilities
 * @module shared
 */
const ADT = require('../app.dependency-tree').ADT;
const shared = require('angular').module('shared', []);

ADT.shared = {
    statusDirective: 'pulsarStatus',
    Status: 'shared.Status',
};

require('./capitalize.filter');
require('./es6-warning-banner.directive');
require('./loader.directive');
require('./secondsToDate.filter');
require('./accordion.directive');

shared.service(ADT.shared.Status, require('./status.service').resolve(ADT));
shared.directive(ADT.shared.statusDirective, require('./status.directive').resolve(ADT));

module.exports = shared.name;
