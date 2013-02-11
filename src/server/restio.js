var ev = require('../requires').ev,
    methods = require('../methods'),
    setup = require('../setup'),
    cookie = require('cookie'),
    getOn = require('../on');

module.exports.client = require('../client/restio');

module.exports.listen = function () {
  var server = setup.server(Array.prototype.slice.call(arguments).shift());
  var callbacks = {};
  var io = new ev();
  var routes = {};
  
  io.clients = server.clients;
    
  methods.forEach(function (method) {
    setup.methods(method, callbacks, routes);
    setup.on(method, io, routes);
  });
  
  server.on('connection', function (socket) {
    socket.cookies = cookie.parse(socket.request.headers.cookie);

    var on = getOn(socket, callbacks, routes);
    
    methods.forEach(function (method) {
      setup.methods(method, callbacks, {});
      setup.request(method, socket, socket, callbacks);
    });
    
    io.emit('connection', socket);
    
    socket.on('message', on.message);
    socket.on('error', function (e) {
      io.emit('error', e);
    });
  });
  
  return io;
};