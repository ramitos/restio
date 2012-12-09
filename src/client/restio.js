var mr = require('match-route'),
    eio = require('engine.io'),
    setup = require('./setup'),
    sgen = require('sgen');

module.exports.listen = function (addr, callback) {
  var socket = new eio.Socket(addr);
  
  socket.on('open', function () {
    var io = {};
    var on = {};
    setup(io, socket);
    
    on.response = function (res) {
      clearTimeout(io.callbacks[res.method][res.id].tm);
      io.callbacks[res.method][res.id](res.data);
      io.callbacks[res.method][res.id] = undefined;
    };
    
    on.message = function (message) {
      message = JSON.parse(message);
      if(io.callbacks[message.method][message.id]) on.response(message);
      else on.request(message);
    };
    
    on.request = function (request) {
      mr(request, io.routes, function (route, fn, params, query) {
        fn(params, query, request.data, function (data) {
          request.data = data;
          socket.send(JSON.stringify(request));
        });
      });
    };
    
    socket.on('message', on.message);
    callback(io);
  });
};

