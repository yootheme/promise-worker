'use strict';

var isPromise = require('is-promise');

function parseJsonSafely(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return false;
  }
}

function registerPromiseWorker(callback) {

  function postOutgoingMessage(e, messageId, error, result) {
    function postMessage(msg) {
      /* istanbul ignore if */
      if (typeof self.postMessage !== 'function') { // service worker
        e.ports[0].postMessage(msg);
      } else { // web worker
        self.postMessage(msg);
      }
    }
    // since real Error objects can not be stringified, package the message into a plain object
    if (error instanceof Error) {
      error = {message : error.message};
    }
    var message = JSON.stringify([messageId, error, result]);
    
      /* istanbul ignore else */
      postMessage(message);
   
  }

  function tryCatchFunc(callback, message) {
    try {
      return {res: callback(message)};
    } catch (e) {
      return {err: e};
    }
  }

  function handleIncomingMessage(e, callback, messageId, message) {

    var result = tryCatchFunc(callback, message);

    if (result.err) {
      postOutgoingMessage(e, messageId, result.err);
    } else if (!isPromise(result.res)) {
      postOutgoingMessage(e, messageId, null, result.res);
    } else {
      result.res.then(function (finalResult) {
        postOutgoingMessage(e, messageId, null, finalResult);
      }, function (finalError) {
        postOutgoingMessage(e, messageId, finalError);
      })
      .catch(function ()  {
      })
    }
  }

  function onIncomingMessage(e) {
    var payload = parseJsonSafely(e.data);
    if (!payload) {
      // message isn't stringified json; ignore
      return;
    }
    var messageId = payload[0];
    var message = payload[1];

    if (typeof callback !== 'function') {
        var message = 'Please pass a function into register()';
        postOutgoingMessage(e, messageId,
          message);
        throw message;
    } else {
      handleIncomingMessage(e, callback, messageId, message);
    }
  }

  self.addEventListener('message', onIncomingMessage);
}

module.exports = registerPromiseWorker;