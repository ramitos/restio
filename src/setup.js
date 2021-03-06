var type = require('./requires').type,
    methods = require('./methods'),
    engine = require('engine.io'),
    packet = require('./packet'),
    assert = require('assert'),
    sgen = require('sgen'),
    noop = function () {};


module.exports.methods = function (method, callbacks, routes) {
  callbacks[method] = {};
  routes[method] = {};
};

module.exports.on = function (method, socket, routes) {
  socket.on[method] = function (path, callback) {
    assert(type(path) == 'string');
    assert(type(callback) == 'function');
    routes[method][path] = callback;
  };
};

module.exports.request = function (method, io, socket, callbacks) {
  io[method] = function () {
    var args = parseArgs(arguments)
    var id = sgen.timestamp();

    socket.send(packet.parse(method, args.data, args.url, id, false));
    callbacks[method][id] = args.callback;

    args.callback.tm = setTimeout(function () {
      clearTimeout(callbacks[method][id].tm);
      callbacks[method][id] = undefined;
    }, 3600000);
  };
};

module.exports.server = function (args) {
  assert(type(args[0]) == 'number' || type(args[0]) == 'object');

  if(type(args[0]) == 'number') return engine.listen.apply(engine, args);
  else return engine.attach.apply(engine, args)
};

/*********************************** PRIVATE **********************************/

var isNode = function () {
  return window == undefined;
};

var parseArgs = function (args) {
  args = Array.prototype.slice.call(args);
  var returns = {};

  if(!args.length) {
    assert(args.length >= 1);
  } else if(args.length == 1) {
    assert(type(args[0]) == 'string');
    returns.url = args.shift();
    returns.callback = noop;
    returns.data = {};
  } else if(args.length == 2 && type(args[1]) == 'function') {
    assert(type(args[0]) == 'string');
    returns.url = args.shift();
    returns.callback = args.shift();
    returns.data = {};
  } else if(args.length == 2 && type(args[1]) == 'object') {
    assert(type(args[0]) == 'string');
    returns.url = args.shift();
    returns.callback = noop;
    returns.data = args.shift();
  } else if(args.length == 2) {
    assert(type(args[1]) == 'object' || type(args[1]) == 'function');
    assert(type(args[0]) == 'string');
  } else {
    assert(type(args[2]) == 'function');
    assert(type(args[1]) == 'object');
    assert(type(args[0]) == 'string');
    returns.url = args.shift();
    returns.data = args.shift();
    returns.callback = args.shift();
  }

  return returns;
};