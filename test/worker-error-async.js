'use strict';

var register = require('../register');
var Promise = require('promise-polyfill');

register(function () {
  return Promise.resolve().then(function () {
    throw new Error('oh noes');
  });
});