'use strict';
/**
 * Created by Greg on 11/27/2016.
 */
const constants = require('angular')
    .module('pulsar.constants', []);

constants.constant('ADT', require('./app.dependency-tree').ADT);
constants.constant('MDT', require('./mallet/mallet.dependency-tree').MDT);

module.exports = constants;