/**
 * Created by Greg on 11/27/2016.
 */
'use strict';
/**
 * Misc. shared utilities
 * @module shared
 */
var shared = require('angular').module('shared', []);

require('./capitalize.filter');
require('./es6-warning-banner.directive');
require('./loader.directive');
require('./secondsToDate.filter');
require('./accordion.directive');

module.exports = shared;