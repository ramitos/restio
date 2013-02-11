var requires = require('../requires'),
    methods = require('../methods'),
    packet = require('../packet'),
    setup = require('../setup'),
    mr = require('match-route'),
    getOn = require('../on');
    
var eio = requires.eio;
var ev = requires.ev;

module.exports.connect = function (addr, callback) {
  var socket = new eio.Socket(addr);
  var callbacks = {};
  var io = new ev();
  var routes = {};
  
  methods.forEach(function (method) {
    setup.methods(method, callbacks, routes);
    setup.request(method, io, socket, callbacks);
    setup.on(method, io, routes);
  });
  
  var on = getOn(socket, callbacks, routes);
  
  socket.on('message', on.message);
  
  socket.on('error', function (e) {
    io.emit('error', e);
  });
  
  socket.on('open', function () {
    callback(io);
  });
};