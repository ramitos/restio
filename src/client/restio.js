var methods = require('../methods'),
    packet = require('../packet'),
    setup = require('../setup'),
    mr = require('match-route'),
    eio = require('engine.io'),
    getOn = require('../on');

module.exports.listen = function (addr, callback) {
  var socket = new eio.Socket(addr);
  var callbacks = {};
  var io = {on: {}};
  var routes = {};
    
  methods.forEach(function (method) {
    setup.methods(method, callbacks, routes);
    setup.request(method, io, socket, callbacks);
    setup.on(method, io, routes);
  });
  
  var on = getOn(socket, callbacks, routes);
  
  on.error = function (e) {
    throw e;
  };
  
  socket.on('message', on.message);
  socket.on('error', on.error);
  
  socket.on('open', function () {
    callback(io);
  });
};