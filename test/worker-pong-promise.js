'use strict';

var register = require('../register');
var Promise = require('promise-polyfill');

register(function () {
  return Promise.resolve('pong');
});