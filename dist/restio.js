;(function(){
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(p, parent, orig){
  var path = require.resolve(p)
    , mod = require.modules[path];

  // lookup failed
  if (null == path) {
    orig = orig || p;
    parent = parent || 'root';
    throw new Error('failed to require "' + orig + '" from "' + parent + '"');
  }

  // perform real require()
  // by invoking the module's
  // registered function
  if (!mod.exports) {
    mod.exports = {};
    mod.client = mod.component = true;
    mod.call(this, mod, mod.exports, require.relative(path));
  }

  return mod.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path){
  var orig = path
    , reg = path + '.js'
    , regJSON = path + '.json'
    , index = path + '/index.js'
    , indexJSON = path + '/index.json';

  return require.modules[reg] && reg
    || require.modules[regJSON] && regJSON
    || require.modules[index] && index
    || require.modules[indexJSON] && indexJSON
    || require.modules[orig] && orig
    || require.aliases[index];
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `fn`.
 *
 * @param {String} path
 * @param {Function} fn
 * @api private
 */

require.register = function(path, fn){
  require.modules[path] = fn;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to){
  var fn = require.modules[from];
  if (!fn) throw new Error('failed to alias "' + from + '", it does not exist');
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj){
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function fn(path){
    var orig = path;
    path = fn.resolve(path);
    return require(path, parent, orig);
  }

  /**
   * Resolve relative to the parent.
   */

  fn.resolve = function(path){
    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    if ('.' != path.charAt(0)) {
      var segs = parent.split('/');
      var i = lastIndexOf(segs, 'deps') + 1;
      if (!i) i = 0;
      path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
      return path;
    }
    return require.normalize(p, path);
  };

  /**
   * Check if module is defined at `path`.
   */

  fn.exists = function(path){
    return !! require.modules[fn.resolve(path)];
  };

  return fn;
};require.register("component-emitter/index.js", function(module, exports, require){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  fn._off = on;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off = function(event, fn){
  this._callbacks = this._callbacks || {};
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var i = callbacks.indexOf(fn._off || fn);
  if (~i) callbacks.splice(i, 1);
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};


});
require.register("visionmedia-debug/index.js", function(module, exports, require){
if ('undefined' == typeof window) {
  module.exports = require('./lib/debug');
} else {
  module.exports = require('./debug');
}

});
require.register("visionmedia-debug/debug.js", function(module, exports, require){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  localStorage.debug = name;

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

// persist

if (window.localStorage) debug.enable(localStorage.debug);
});
require.register("LearnBoost-engine.io-client/lib/index.js", function(module, exports, require){

module.exports = require('./socket');

});
require.register("LearnBoost-engine.io-client/lib/parser.js", function(module, exports, require){
/**
 * Module dependencies.
 */

var util = require('./util')

/**
 * Packet types.
 */

var packets = exports.packets = {
    open:     0    // non-ws
  , close:    1    // non-ws
  , ping:     2
  , pong:     3
  , message:  4
  , upgrade:  5
  , noop:     6
};

var packetslist = util.keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' }

/**
 * Encodes a packet.
 *
 *     <packet type id> [ `:` <data> ]
 *
 * Example:
 *
 *     5:hello world
 *     3
 *     4
 *
 * @api private
 */

exports.encodePacket = function (packet) {
  var encoded = packets[packet.type]

  // data fragment is optional
  if (undefined !== packet.data) {
    encoded += String(packet.data);
  }

  return '' + encoded;
};

/**
 * Decodes a packet.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data) {
  var type = data.charAt(0);

  if (Number(type) != type || !packetslist[type]) {
    return err;
  }

  if (data.length > 1) {
    return { type: packetslist[type], data: data.substring(1) };
  } else {
    return { type: packetslist[type] };
  }
};

/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets) {
  if (!packets.length) {
    return '0:';
  }

  var encoded = ''
    , message

  for (var i = 0, l = packets.length; i < l; i++) {
    message = exports.encodePacket(packets[i]);
    encoded += message.length + ':' + message;
  }

  return encoded;
};

/*
 * Decodes data when a payload is maybe expected.
 *
 * @param {String} data
 * @return {Array} packets
 * @api public
 */

exports.decodePayload = function (data) {
  if (data == '') {
    // parser error - ignoring payload
    return [err];
  }

  var packets = []
    , length = ''
    , n, msg, packet

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i)

    if (':' != chr) {
      length += chr;
    } else {
      if ('' == length || (length != (n = Number(length)))) {
        // parser error - ignoring payload
        return [err];
      }

      msg = data.substr(i + 1, n);

      if (length != msg.length) {
        // parser error - ignoring payload
        return [err];
      }

      if (msg.length) {
        packet = exports.decodePacket(msg);

        if (err.type == packet.type && err.data == packet.data) {
          // parser error in individual packet - ignoring payload
          return [err];
        }

        packets.push(packet);
      }

      // advance cursor
      i += n;
      length = ''
    }
  }

  if (length != '') {
    // parser error - ignoring payload
    return [err];
  }

  return packets;
};

});
require.register("LearnBoost-engine.io-client/lib/socket.js", function(module, exports, require){
/**
 * Module dependencies.
 */

var util = require('./util')
  , transports = require('./transports')
  , Emitter = require('./emitter')
  , debug = require('debug')('engine-client:socket');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Global reference.
 */

var global = 'undefined' != typeof window ? window : global;

/**
 * Socket constructor.
 *
 * @param {Object} options
 * @api public
 */

function Socket(opts){
  if (!(this instanceof Socket)) return new Socket(opts);

  if ('string' == typeof opts) {
    var uri = util.parseUri(opts);
    opts = arguments[1] || {};
    opts.host = uri.host;
    opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
    opts.port = uri.port;
  }

  opts = opts || {};
  this.secure = null != opts.secure ? opts.secure : (global.location && 'https:' == location.protocol);
  this.host = opts.host || opts.hostname || (global.location ? location.hostname : 'localhost');
  this.port = opts.port || (global.location && location.port ? location.port : (this.secure ? 443 : 80));
  this.query = opts.query || {};
  this.query.uid = rnd();
  this.upgrade = false !== opts.upgrade;
  this.resource = opts.resource || 'default';
  this.path = (opts.path || '/engine.io').replace(/\/$/, '');
  this.path += '/' + this.resource + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = !!opts.timestampRequests;
  this.flashPath = opts.flashPath || '';
  this.transports = opts.transports || ['polling', 'websocket', 'flashsocket'];
  this.readyState = '';
  this.writeBuffer = [];
  this.policyPort = opts.policyPort || 843;
  this.open();

  Socket.sockets.push(this);
  Socket.sockets.evs.emit('add', this);
};

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = 1;

/**
 * Static EventEmitter.
 */

Socket.sockets = [];
Socket.sockets.evs = new Emitter;

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = require('./transport');
Socket.Emitter = require('./emitter');
Socket.transports = require('./transports');
Socket.util = require('./util');
Socket.parser = require('./parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query);
  query.transport = name;

  if (this.id) {
    query.sid = this.id;
  }

  var transport = new transports[name]({
      host: this.host
    , port: this.port
    , secure: this.secure
    , path: this.path
    , query: query
    , forceJSONP: this.forceJSONP
    , timestampRequests: this.timestampRequests
    , timestampParam: this.timestampParam
    , flashPath: this.flashPath
    , policyPort: this.policyPort
  });

  return transport;
};

function clone (obj) {
  var o = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */

Socket.prototype.open = function () {
  this.readyState = 'opening';
  var transport = this.createTransport(this.transports[0]);
  transport.open();
  this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function (transport) {
  var self = this;

  if (this.transport) {
    debug('clearing existing transport');
    this.transport.removeAllListeners();
  }

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
    .on('drain', function () {
      self.flush();
    })
    .on('packet', function (packet) {
      self.onPacket(packet);
    })
    .on('error', function (e) {
      self.onError(e);
    })
    .on('close', function () {
      self.onClose('transport close');
    });
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, { probe: 1 })
    , failed = false
    , self = this;

  transport.once('open', function () {
    if (failed) return;

    debug('probe transport "%s" opened', name);
    transport.send([{ type: 'ping', data: 'probe' }]);
    transport.once('packet', function (msg) {
      if (failed) return;
      if ('pong' == msg.type && 'probe' == msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);

        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' == self.readyState || 'closing' == self.readyState) {
            return;
          }
          debug('changing transport and sending upgrade packet');
          transport.removeListener('error', onerror);
          self.emit('upgrade', transport);
          self.setTransport(transport);
          transport.send([{ type: 'upgrade' }]);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('error', err);
      }
    });
  });

  transport.once('error', onerror);
  function onerror(err) {
    if (failed) return;

    // Any callback called by transport should be ignored since now
    failed = true;

    var error = new Error('probe error: ' + err);
    error.transport = transport.name;

    transport.close();
    transport = null;

    debug('probe transport "%s" failed because of error: %s', name, err);

    self.emit('error', error);
  };

  transport.open();

  this.once('close', function () {
    if (transport) {
      debug('socket closed prematurely - aborting probe');
      failed = true;
      transport.close();
      transport = null;
    }
  });

  this.once('upgrading', function (to) {
    if (transport && to.name != transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      transport.close();
      transport = null;
    }
  });
};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  this.emit('open');
  this.onopen && this.onopen.call(this);
  this.flush();

  // we check for `readyState` in case an `open`
  // listener alreay closed the socket
  if ('open' == this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');
    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

    this.emit('packet', packet);

    // Socket is live - any packet counts
    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(util.parseJSON(packet.data));
        break;

      case 'pong':
        this.ping();
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.emit('error', err);
        break;

      case 'message':
        this.emit('message', packet.data);
        var event = { data: packet.data };
        event.toString = function () {
          return packet.data;
        };
        this.onmessage && this.onmessage.call(this, event);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = data.upgrades;
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen();
  this.ping();

  // Prolong liveness of socket on heartbeat
  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' == self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.ping = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.sendPacket('ping');
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if ('closed' != this.readyState && this.transport.writable &&
    !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer);
    this.writeBuffer = [];
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg) {
  this.sendPacket('message', msg);
  return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data) {
  var packet = { type: type, data: data };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.onClose('forced close');
    debug('socket closing - telling transport to close');
    this.transport.close();
    this.transport.removeAllListeners();
  }

  return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
  this.emit('error', err);
  this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
  if ('closed' != this.readyState) {
    debug('socket close with reason: "%s"', reason);
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer);
    this.readyState = 'closed';
    this.emit('close', reason, desc);
    this.onclose && this.onclose.call(this);
    this.id = null;
  }
};

/**
 * Generates a random uid.
 *
 * @api private
 */

function rnd () {
  return String(Math.random()).substr(5) + String(Math.random()).substr(5);
}

});
require.register("LearnBoost-engine.io-client/lib/transport.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var util = require('./util')
  , parser = require('./parser')
  , Emitter = require('./emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.path = opts.path;
  this.host = opts.host;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
};

/**
  * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' == this.readyState || '' == this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function(packets){
  if ('open' == this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function (data) {
  this.onPacket(parser.decodePacket(data));
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

});
require.register("LearnBoost-engine.io-client/lib/emitter.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var Emitter;

try {
  Emitter = require('emitter');
} catch(e){
  Emitter = require('emitter-component');
}

/**
 * Module exports.
 */

module.exports = Emitter;

/**
 * Compatibility with `WebSocket#addEventListener`.
 *
 * @api public
 */

Emitter.prototype.addEventListener = Emitter.prototype.on;

/**
 * Compatibility with `WebSocket#removeEventListener`.
 *
 * @api public
 */

Emitter.prototype.removeEventListener = Emitter.prototype.off;

/**
 * Node-compatible `EventEmitter#removeListener`
 *
 * @api public
 */

Emitter.prototype.removeListener = Emitter.prototype.off;

/**
 * Node-compatible `EventEmitter#removeAllListeners`
 *
 * @api public
 */

Emitter.prototype.removeAllListeners = function(){
  this._callbacks = {};
};

});
require.register("LearnBoost-engine.io-client/lib/util.js", function(module, exports, require){

/**
 * Status of page load.
 */

var pageLoaded = false;

/**
 * Global reference.
 */

var global = 'undefined' != typeof window ? window : global;

/**
 * Inheritance.
 *
 * @param {Function} ctor a
 * @param {Function} ctor b
 * @api private
 */

exports.inherits = function inherits (a, b) {
  function c () { }
  c.prototype = b.prototype;
  a.prototype = new c;
};

/**
 * Object.keys
 */

exports.keys = Object.keys || function (obj) {
  var ret = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      ret.push(i);
    }
  }

  return ret;
};

/**
 * Adds an event.
 *
 * @api private
 */

exports.on = function (element, event, fn, capture) {
  if (element.attachEvent) {
    element.attachEvent('on' + event, fn);
  } else if (element.addEventListener) {
    element.addEventListener(event, fn, capture);
  }
};

/**
 * Load utility.
 *
 * @api private
 */

exports.load = function (fn) {
  if (global.document && document.readyState === 'complete' || pageLoaded) {
    return fn();
  }

  exports.on(global, 'load', fn, false);
};

/**
 * Change the internal pageLoaded value.
 */

if ('undefined' != typeof window) {
  exports.load(function () {
    pageLoaded = true;
  });
}

/**
 * Defers a function to ensure a spinner is not displayed by the browser.
 *
 * @param {Function} fn
 * @api private
 */

exports.defer = function (fn) {
  if (!exports.ua.webkit || 'undefined' != typeof importScripts) {
    return fn();
  }

  exports.load(function () {
    setTimeout(fn, 100);
  });
};

/**
 * JSON parse.
 *
 * @see Based on jQuery#parseJSON (MIT) and JSON2
 * @api private
 */

var rvalidchars = /^[\],:{}\s]*$/
  , rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g
  , rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g
  , rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g
  , rtrimLeft = /^\s+/
  , rtrimRight = /\s+$/

exports.parseJSON = function (data) {
  if ('string' != typeof data || !data) {
    return null;
  }

  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

  // Attempt to parse using the native JSON parser first
  if (global.JSON && JSON.parse) {
    return JSON.parse(data);
  }

  if (rvalidchars.test(data.replace(rvalidescape, '@')
      .replace(rvalidtokens, ']')
      .replace(rvalidbraces, ''))) {
    return (new Function('return ' + data))();
  }
};

/**
 * UA / engines detection namespace.
 *
 * @namespace
 */

exports.ua = {};

/**
 * Whether the UA supports CORS for XHR.
 *
 * @api private
 */

exports.ua.hasCORS = 'undefined' != typeof XMLHttpRequest && (function () {
  try {
    var a = new XMLHttpRequest();
  } catch (e) {
    return false;
  }

  return a.withCredentials != undefined;
})();

/**
 * Detect webkit.
 *
 * @api private
 */

exports.ua.webkit = 'undefined' != typeof navigator &&
  /webkit/i.test(navigator.userAgent);

/**
 * Detect gecko.
 *
 * @api private
 */

exports.ua.gecko = 'undefined' != typeof navigator &&
  /gecko/i.test(navigator.userAgent);

/**
 * Detect android;
 */

exports.ua.android = 'undefined' != typeof navigator &&
  /android/i.test(navigator.userAgent);

/**
 * Detect iOS.
 */

exports.ua.ios = 'undefined' != typeof navigator &&
  /^(iPad|iPhone|iPod)$/.test(navigator.platform);
exports.ua.ios6 = exports.ua.ios && /OS 6_/.test(navigator.userAgent);

/**
 * XHR request helper.
 *
 * @param {Boolean} whether we need xdomain
 * @api private
 */

exports.request = function request (xdomain) {
  if ('undefined' != typeof process) {
    var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    return new XMLHttpRequest();
  }

  if (xdomain && 'undefined' != typeof XDomainRequest && !exports.ua.hasCORS) {
    return new XDomainRequest();
  }

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' != typeof XMLHttpRequest && (!xdomain || exports.ua.hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch(e) { }
  }
};

/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host'
  , 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

exports.parseUri = function (str) {
  var m = re.exec(str || '')
    , uri = {}
    , i = 14;

  while (i--) {
    uri[parts[i]] = m[i] || '';
  }

  return uri;
};

/**
 * Compiles a querystring
 *
 * @param {Object}
 * @api private
 */

exports.qs = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += i + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

});
require.register("LearnBoost-engine.io-client/lib/transports/index.js", function(module, exports, require){

/**
 * Module dependencies
 */

var XHR = require('./polling-xhr')
  , JSONP = require('./polling-jsonp')
  , websocket = require('./websocket')
  , flashsocket = require('./flashsocket')
  , util = require('../util');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;
exports.flashsocket = flashsocket;

/**
 * Global reference.
 */

var global = 'undefined' != typeof window ? window : global;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling (opts) {
  var xhr
    , xd = false
    , isXProtocol = false;

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (Number(port) != port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.host != location.hostname || port != opts.port;
    isXProtocol = opts.secure != isSSL;
  }

  xhr = util.request(xd);
  /* See #7 at http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx */
  if (isXProtocol && global.XDomainRequest && xhr instanceof global.XDomainRequest) {
    return new JSONP(opts);
  }

  if (xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    return new JSONP(opts);
  }
};

});
require.register("LearnBoost-engine.io-client/lib/transports/polling.js", function(module, exports, require){
/**
 * Module dependencies.
 */

var Transport = require('../transport')
  , util = require('../util')
  , parser = require('../parser')
  , debug = require('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Global reference.
 */

var global = 'undefined' != typeof window ? window : global;

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling(opts){
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

util.inherits(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function(){
  this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function(onPause){
  var pending = 0;
  var self = this;

  this.readyState = 'pausing';

  function pause(){
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function(){
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function(){
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function(){
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function(data){
  debug('polling got data %s', data);
  // decode payload
  var packets = parser.decodePayload(data);

  for (var i = 0, l = packets.length; i < l; i++) {
    // if its the first message we consider the trnasport open
    if ('opening' == this.readyState) {
      this.onOpen();
    }

    // if its a close packet, we close the ongoing requests
    if ('close' == packets[i].type) {
      this.onClose();
      return;
    }

    // otherwise bypass onData and handle the message
    this.onPacket(packets[i]);
  }

  // if we got data we're not polling
  this.polling = false;
  this.emit('pollComplete');

  if ('open' == this.readyState) {
    this.poll();
  } else {
    debug('ignoring poll - transport state "%s"', this.readyState);
  }
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function(){
  debug('sending close packet');
  this.send([{ type: 'close' }]);
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function(packets){
  var self = this;
  this.writable = false;
  this.doWrite(parser.encodePayload(packets), function(){
    self.writable = true;
    self.emit('drain');
  });
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';

  // cache busting is forced for IE / android / iOS6 ಠ_ಠ
  if (global.ActiveXObject || util.ua.android || util.ua.ios6
    || this.timestampRequests) {
    query[this.timestampParam] = +new Date;
  }

  query = util.qs(query);

  // avoid port if default for schema
  if (this.port && (('https' == schema && this.port != 443)
    || ('http' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  return schema + '://' + this.host + port + this.path + query;
};

});
require.register("LearnBoost-engine.io-client/lib/transports/polling-xhr.js", function(module, exports, require){
/**
 * Module requirements.
 */

var Polling = require('./polling')
  , util = require('../util')
  , Emitter = require('../emitter')
  , debug = require('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Global reference.
 */

var global = 'undefined' != typeof window ? window : global;

/**
 * Obfuscated key for Blue Coat.
 */

var xobject = global[['Active'].concat('Object').join('X')];

/**
 * Empty function
 */

function empty(){}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR(opts){
  Polling.call(this, opts);

  if (global.location) {
    this.xd = opts.host != global.location.hostname ||
      global.location.port != opts.port;
  }
};

/**
 * Inherits from Polling.
 */

util.inherits(XHR, Polling);

/**
 * Opens the socket
 *
 * @api private
 */

XHR.prototype.doOpen = function(){
  var self = this;
  util.defer(function(){
    Polling.prototype.doOpen.call(self);
  });
};

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function(opts){
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function(data, fn){
  var req = this.request({ method: 'POST', data: data });
  var self = this;
  req.on('success', fn);
  req.on('error', function(err){
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function(){
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function(data){
    self.onData(data);
  });
  req.on('error', function(err){
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request(opts){
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.async = false !== opts.async;
  this.data = undefined != opts.data ? opts.data : null;
  this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function(){
  var xhr = this.xhr = util.request(this.xd);
  var self = this;

  xhr.open(this.method, this.uri, this.async);

  if ('POST' == this.method) {
    try {
      if (xhr.setRequestHeader) {
        // xmlhttprequest
        xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
      } else {
        // xdomainrequest
        xhr.contentType = 'text/plain';
      }
    } catch (e) {}
  }

  if (this.xd && global.XDomainRequest && xhr instanceof XDomainRequest) {
    xhr.onerror = function(e){
      self.onError(e);
    };
    xhr.onload = function(){
      self.onData(xhr.responseText);
    };
    xhr.onprogress = empty;
  } else {
    // ie6 check
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    xhr.onreadystatechange = function(){
      var data;

      try {
        if (4 != xhr.readyState) return;
        if (200 == xhr.status || 1223 == xhr.status) {
          data = xhr.responseText;
        } else {
          self.onError(xhr.status);
        }
      } catch (e) {
        self.onError(e);
      }

      if (undefined !== data) {
        self.onData(data);
      }
    };
  }

  debug('sending xhr with url %s | data %s', this.uri, this.data);
  xhr.send(this.data);

  if (xobject) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function(){
  this.emit('success');
  this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function(data){
  this.emit('data', data);
  this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function(err){
  this.emit('error', err);
  this.cleanup();
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function(){
  // xmlhttprequest
  this.xhr.onreadystatechange = empty;

  // xdomainrequest
  this.xhr.onload = this.xhr.onerror = empty;

  try {
    this.xhr.abort();
  } catch(e) {}

  if (xobject) {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function(){
  this.cleanup();
};

if (xobject) {
  Request.requestsCount = 0;
  Request.requests = {};

  global.attachEvent('onunload', function(){
    for (var i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        Request.requests[i].abort();
      }
    }
  });
}

});
require.register("LearnBoost-engine.io-client/lib/transports/polling-jsonp.js", function(module, exports, require){

/**
 * Module requirements.
 */

var Polling = require('./polling')
  , util = require('../util');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Global reference.
 */

var global = 'undefined' != typeof window ? window : global;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Callbacks count.
 */

var index = 0;

/**
 * Noop.
 */

function empty () { }

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Polling.call(this, opts);

  // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution
  if (!callbacks) {
    // we need to consider multiple engines in the same page
    if (!global.___eio) global.___eio = [];
    callbacks = global.___eio;
  }

  // callback identifier
  this.index = callbacks.length;

  // add callback to jsonp global
  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  });

  // append to query string
  this.query.j = this.index;
};

/**
 * Inherits from Polling.
 */

util.inherits(JSONPPolling, Polling);

/**
 * Opens the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doOpen = function () {
  var self = this;
  util.defer(function () {
    Polling.prototype.doOpen.call(self);
  });
};

/**
 * Closes the socket
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
  }

  Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();

  var insertAt = document.getElementsByTagName('script')[0];
  insertAt.parentNode.insertBefore(script, insertAt);
  this.script = script;

  if (util.ua.gecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form')
      , area = document.createElement('textarea')
      , id = this.iframeId = 'eio_iframe_' + this.index
      , iframe;

    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);

    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete () {
    initIframe();
    fn();
  };

  function initIframe () {
    if (self.iframe) {
      self.form.removeChild(self.iframe);
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      iframe = document.createElement('<iframe name="'+ self.iframeId +'">');
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
    }

    iframe.id = self.iframeId;

    self.form.appendChild(iframe);
    self.iframe = iframe;
  };

  initIframe();

  // escape \n to prevent it from being converted into \r\n by some UAs
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch(e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function(){
      if (self.iframe.readyState == 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

});
require.register("LearnBoost-engine.io-client/lib/transports/websocket.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var Transport = require('../transport')
  , parser = require('../parser')
  , util = require('../util')
  , debug = require('debug')('engine.io-client:websocket');

/**
 * Module exports.
 */

module.exports = WS;

/**
 * Global reference.
 */

var global = 'undefined' != typeof window ? window : global;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS(opts){
  Transport.call(this, opts);
};

/**
 * Inherits from Transport.
 */

util.inherits(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function(){
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var self = this;

  this.socket = new (ws())(this.uri());
  this.socket.onopen = function(){
    self.onOpen();
  };
  this.socket.onclose = function(){
    self.onClose();
  };
  this.socket.onmessage = function(ev){
    self.onData(ev.data);
  };
  this.socket.onerror = function(e){
    self.onError('websocket error', e);
  };
};

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function(packets){
  for (var i = 0, l = packets.length; i < l; i++) {
    this.socket.send(parser.encodePacket(packets[i]));
  }
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function(){
  if (typeof this.socket !== 'undefined') {
    this.socket.close();
  }
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';

  // avoid port if default for schema
  if (this.port && (('wss' == schema && this.port != 443)
    || ('ws' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // append timestamp to URI
  if (this.timestampRequests) {
    query[this.timestampParam] = +new Date;
  }

  query = util.qs(query);

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  return schema + '://' + this.host + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function(){
  var websocket = ws();
  return !!websocket && !('__initialize' in websocket && this.name === WS.prototype.name);
};

/**
 * Getter for WS constructor.
 *
 * @api private
 */

function ws(){
  if ('undefined' != typeof process) {
    return require('ws');
  }

  return global.WebSocket || global.MozWebSocket;
}

});
require.register("LearnBoost-engine.io-client/lib/transports/flashsocket.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var WS = require('./websocket')
  , util = require('../util')
  , debug = require('debug')('engine.io-client:flashsocket');

/**
 * Module exports.
 */

module.exports = FlashWS;

/**
 * Global reference.
 */

var global = 'undefined' != typeof window ? window : global;

/**
 * Obfuscated key for Blue Coat.
 */

var xobject = global[['Active'].concat('Object').join('X')];

/**
 * FlashWS constructor.
 *
 * @api public
 */

function FlashWS (options) {
  WS.call(this, options);
  this.flashPath = options.flashPath;
  this.policyPort = options.policyPort;
};

/**
 * Inherits from WebSocket.
 */

util.inherits(FlashWS, WS);

/**
 * Transport name.
 *
 * @api public
 */

FlashWS.prototype.name = 'flashsocket';

/**
 * Opens the transport.
 *
 * @api public
 */

FlashWS.prototype.doOpen = function () {
  if (!this.check()) {
    // let the probe timeout
    return;
  }

  // instrument websocketjs logging
  function log (type) {
    return function(){
      var str = Array.prototype.join.call(arguments, ' ');
      debug('[websocketjs %s] %s', type, str);
    };
  };

  WEB_SOCKET_LOGGER = { log: log('debug'), error: log('error') };
  WEB_SOCKET_SUPPRESS_CROSS_DOMAIN_SWF_ERROR = true;
  WEB_SOCKET_DISABLE_AUTO_INITIALIZATION = true;

  if ('undefined' == typeof WEB_SOCKET_SWF_LOCATION) {
    WEB_SOCKET_SWF_LOCATION = this.flashPath + 'WebSocketMainInsecure.swf';
  }

  // dependencies
  var deps = [this.flashPath + 'web_socket.js'];

  if ('undefined' == typeof swfobject) {
    deps.unshift(this.flashPath + 'swfobject.js');
  }

  var self = this;

  load(deps, function () {
    self.ready(function () {
      WebSocket.__addTask(function () {
        WS.prototype.doOpen.call(self);
      });
    });
  });
};

/**
 * Override to prevent closing uninitialized flashsocket.
 *
 * @api private
 */

FlashWS.prototype.doClose = function () {
  if (!this.socket) return;
  var self = this;
  WebSocket.__addTask(function() {
    WS.prototype.doClose.call(self);
  });
};

/**
 * Writes to the Flash socket.
 *
 * @api private
 */

FlashWS.prototype.write = function() {
  var self = this, args = arguments;
  WebSocket.__addTask(function () {
    WS.prototype.write.apply(self, args);
  });
};

/**
 * Called upon dependencies are loaded.
 *
 * @api private
 */

FlashWS.prototype.ready = function (fn) {
  if (typeof WebSocket == 'undefined' ||
    !('__initialize' in WebSocket) || !swfobject) {
    return;
  }

  if (swfobject.getFlashPlayerVersion().major < 10) {
    return;
  }

  function init () {
    // Only start downloading the swf file when the checked that this browser
    // actually supports it
    if (!FlashWS.loaded) {
      if (843 != self.policyPort) {
        WebSocket.loadFlashPolicyFile('xmlsocket://' + self.host + ':' + self.policyPort);
      }

      WebSocket.__initialize();
      FlashWS.loaded = true;
    }

    fn.call(self);
  }

  var self = this;
  if (document.body) {
    return init();
  }

  util.load(init);
};

/**
 * Feature detection for flashsocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

FlashWS.prototype.check = function () {
  if ('undefined' != typeof process) {
    return false;
  }

  if (typeof WebSocket != 'undefined' && !('__initialize' in WebSocket)) {
    return false;
  }

  if (xobject) {
    var control = null;
    try {
      control = new xobject('ShockwaveFlash.ShockwaveFlash');
    } catch (e) { }
    if (control) {
      return true;
    }
  } else {
    for (var i = 0, l = navigator.plugins.length; i < l; i++) {
      for (var j = 0, m = navigator.plugins[i].length; j < m; j++) {
        if (navigator.plugins[i][j].description == 'Shockwave Flash') {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Lazy loading of scripts.
 * Based on $script by Dustin Diaz - MIT
 */

var scripts = {};

/**
 * Injects a script. Keeps tracked of injected ones.
 *
 * @param {String} path
 * @param {Function} callback
 * @api private
 */

function create (path, fn) {
  if (scripts[path]) return fn();

  var el = document.createElement('script');
  var loaded = false;

  debug('loading "%s"', path);
  el.onload = el.onreadystatechange = function () {
    if (loaded || scripts[path]) return;
    var rs = el.readyState;
    if (!rs || 'loaded' == rs || 'complete' == rs) {
      debug('loaded "%s"', path);
      el.onload = el.onreadystatechange = null;
      loaded = true;
      scripts[path] = true;
      fn();
    }
  };

  el.async = 1;
  el.src = path;

  var head = document.getElementsByTagName('head')[0];
  head.insertBefore(el, head.firstChild);
};

/**
 * Loads scripts and fires a callback.
 *
 * @param {Array} paths
 * @param {Function} callback
 */

function load (arr, fn) {
  function process (i) {
    if (!arr[i]) return fn();
    create(arr[i], function () {
      process(++i);
    });
  };

  process(0);
};

});
require.register("component-path-to-regexp/index.js", function(module, exports, require){

/**
 * Expose `pathtoRegexp`.
 */

module.exports = pathtoRegexp;

/**
 * Normalize the given path string,
 * returning a regular expression.
 *
 * An empty array should be passed,
 * which will contain the placeholder
 * key names. For example "/user/:id" will
 * then contain ["id"].
 *
 * @param  {String|RegExp|Array} path
 * @param  {Array} keys
 * @param  {Object} options
 * @return {RegExp}
 * @api private
 */

function pathtoRegexp(path, keys, options) {
  options = options || {};
  var sensitive = options.sensitive;
  var strict = options.strict;
  keys = keys || [];

  if (path instanceof RegExp) return path;
  if (path instanceof Array) path = '(' + path.join('|') + ')';

  path = path
    .concat(strict ? '' : '/?')
    .replace(/\/\(/g, '(?:/')
    .replace(/\+/g, '__plus__')
    .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
      keys.push({ name: key, optional: !! optional });
      slash = slash || '';
      return ''
        + (optional ? '' : slash)
        + '(?:'
        + (optional ? slash : '')
        + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
        + (optional || '');
    })
    .replace(/([\/.])/g, '\\$1')
    .replace(/__plus__/g, '(.+)')
    .replace(/\*/g, '(.*)');

  return new RegExp('^' + path + '$', sensitive ? '' : 'i');
};
});
require.register("component-trim/index.js", function(module, exports, require){

exports = module.exports = trim;

function trim(str){
  return str.replace(/^\s*|\s*$/g, '');
}

exports.left = function(str){
  return str.replace(/^\s*/, '');
};

exports.right = function(str){
  return str.replace(/\s*$/, '');
};

});
require.register("redventures-reduce/index.js", function(module, exports, require){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }

  return curr;
};
});
require.register("component-querystring/index.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var trim = require('trim')
  , reduce = require('reduce');

/**
 * Parse the given query `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(str){
  if ('string' != typeof str) return {};
  str = trim(str);
  if ('' == str) return {};
  return reduce(str.split('&'), function(obj, pair){
    var parts = pair.split('=');
    obj[parts[0]] = null == parts[1]
      ? ''
      : decodeURIComponent(parts[1]);
    return obj;
  }, {});
};

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

exports.stringify = function(obj){
  if (!obj) return '';
  var pairs = [];
  for (var key in obj) {
    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
  }
  return pairs.join('&');
};
});
require.register("component-url/index.js", function(module, exports, require){

/**
 * Parse the given `url`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

exports.parse = function(url){
  var a = document.createElement('a');
  a.href = url;
  return {
    href: a.href,
    host: a.host || location.host,
    port: a.port || location.port,
    hash: a.hash,
    hostname: a.hostname || location.hostname,
    pathname: a.pathname,
    protocol: !a.protocol || ':' == a.protocol ? location.protocol : a.protocol,
    search: a.search,
    query: a.search.slice(1)
  };
};

/**
 * Check if `url` is absolute.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isAbsolute = function(url){
  return 0 == url.indexOf('//') || !!~url.indexOf('://');
};

/**
 * Check if `url` is relative.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isRelative = function(url){
  return !exports.isAbsolute(url);
};

/**
 * Check if `url` is cross domain.
 *
 * @param {String} url
 * @return {Boolean}
 * @api public
 */

exports.isCrossDomain = function(url){
  url = exports.parse(url);
  return url.hostname !== location.hostname
    || url.port !== location.port
    || url.protocol !== location.protocol;
};
});
require.register("ramitos-match-route/src/match-route.js", function(module, exports, require){
var regex = require('path-to-regexp'),
    qs = require('querystring'),
    url = require('url');

module.exports = function (req, routes, callback) {
  var method = req.method.toLowerCase();
  var parsedurl = url.parse(req.url);
  var querystring = parsedurl.query;
  var query = qs.parse(querystring);
  var pathname = parsedurl.pathname;
  var params = new Object();
  var value = null;
  var mroute = '';


  if(routes[method]) Object.keys(routes[method]).forEach(function (route) {
    var keys = new Array();
    var rexp = regex(route, keys, false, false);
    var match = pathname.match(rexp);
    if(!match) return;

    match.shift();
    value = routes[method][route];
    mroute = route;

    match.forEach(function (param, index) {
      params[keys[index].name] = param;
    });
  });

  callback(value, mroute, params, query);
};
});
require.register("component-type/index.js", function(module, exports, require){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("ramitos-sgen/src/sgen.js", function(module, exports, require){
var map = require('./map');

module.exports.timestamp = function (from) {
  if(!from) from = 1328054400000; //2012/1/1

  var timestamp = (new Date().getTime() - from).toString().split('');
  var elements = [];
  var hash = '';

  for(var i = 0; i < timestamp.length; i += 1) {
    if(i%2 === 0) elements.push(timestamp[i]);
    else elements[elements.length -1] += timestamp[i];
  }

  for(var y = 0; y < elements.length; y += 1) {
    hash += map[elements[y]];
  }

  return hash;
}

module.exports.random = function (length) {
  if(!length) length = 6;

  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
  var hash = [];

  for(var i = 0; i < length; i += 1) {
    hash.push(chars[Math.floor(Math.random()*62)]);
  }

  return hash.join('');
};
});
require.register("ramitos-sgen/src/map.js", function(module, exports, require){
module.exports = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  "10": "a",
  "11": "b",
  "12": "c",
  "13": "d",
  "14": "e",
  "15": "f",
  "16": "g",
  "17": "h",
  "18": "i",
  "19": "j",
  "20": "k",
  "21": "l",
  "22": "m",
  "23": "n",
  "24": "o",
  "25": "p",
  "26": "q",
  "27": "r",
  "28": "s",
  "29": "t",
  "30": "u",
  "31": "v",
  "32": "w",
  "33": "x",
  "34": "y",
  "35": "z",
  "36": "0a",
  "37": "1b",
  "38": "2c",
  "39": "3d",
  "40": "4e",
  "41": "5f",
  "42": "6g",
  "43": "7h",
  "44": "8i",
  "45": "9j",
  "46": "ak",
  "47": "bl",
  "48": "cm",
  "49": "dn",
  "50": "eo",
  "51": "fp",
  "52": "gq",
  "53": "hr",
  "54": "is",
  "55": "jt",
  "56": "ku",
  "57": "lv",
  "58": "mw",
  "59": "nx",
  "60": "oy",
  "61": "pz",
  "62": "q0",
  "63": "r1",
  "64": "s2",
  "65": "t3",
  "66": "u4",
  "67": "v5",
  "68": "w6",
  "69": "x7",
  "70": "y8",
  "71": "z9",
  "72": "0z",
  "73": "1y",
  "74": "2x",
  "75": "3w",
  "76": "4v",
  "77": "5u",
  "78": "6t",
  "79": "7s",
  "80": "8r",
  "81": "9q",
  "82": "ap",
  "83": "bo",
  "84": "cn",
  "85": "dm",
  "86": "el",
  "87": "fk",
  "88": "gj",
  "89": "hi",
  "90": "ih",
  "91": "jg",
  "92": "kf",
  "93": "le",
  "94": "md",
  "95": "nc",
  "96": "ob",
  "97": "pa",
  "98": "q9",
  "99": "r8",
  "01": "s7",
  "02": "t6",
  "03": "u5",
  "04": "v4",
  "05": "x3",
  "06": "y2",
  "07": "z1",
  "08": "a0",
  "09": "ba"
}
});
require.register("component-stack/index.js", function(module, exports, require){

/**
 * Expose `stack()`.
 */

module.exports = stack;

/**
 * Return the stack.
 *
 * @return {Array}
 * @api public
 */

function stack() {
  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack){ return stack; };
  var err = new Error;
  Error.captureStackTrace(err, arguments.callee);
  var stack = err.stack;
  Error.prepareStackTrace = orig;
  return stack;
}
});
require.register("component-assert/index.js", function(module, exports, require){

/**
 * Module dependencies.
 */

var stack = require('stack');

/**
 * Load contents of `script`.
 *
 * @param {String} script
 * @return {String}
 * @api private
 */

function getScript(script) {
  var xhr = new XMLHttpRequest;
  xhr.open('GET', script, false);
  xhr.send(null);
  return xhr.responseText;
}

/**
 * Assert `expr` with optional failure `msg`.
 *
 * @param {Mixed} expr
 * @param {String} [msg]
 * @api public
 */

module.exports = function(expr, msg){
  if (expr) return;
  if (!msg) {
    if (Error.captureStackTrace) {
      var callsite = stack()[1];
      var fn = callsite.fun.toString();
      var file = callsite.getFileName();
      var line = callsite.getLineNumber() - 1;
      var col = callsite.getColumnNumber() - 1;
      var src = getScript(file);
      line = src.split('\n')[line].slice(col);
      expr = line.match(/assert\((.*)\)/)[1].trim();
      msg = expr;
    } else {
      msg = 'assertion failed';
    }
  }

  throw new Error(msg);
};
});
require.register("restio/src/client/restio.js", function(module, exports, require){
var methods = require('../methods'),
    packet = require('../packet'),
    setup = require('../setup'),
    mr = require('match-route'),
    eio = require('engine.io'),
    getOn = require('../on');

module.exports.connect = function (addr, callback) {
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
});
require.register("restio/src/platform.js", function(module, exports, require){
module.exports = typeof window == 'undefined' ? 'node' : 'browser';
});
require.register("restio/src/methods.js", function(module, exports, require){
module.exports = new Array('get', 'post', 'put', 'delete');
});
require.register("restio/src/packet.js", function(module, exports, require){
module.exports.parse = function (method, data, url, id, rsp) {
  return JSON.stringify({method: method, data: data, url: url, id: id, rsp: rsp});
};
});
require.register("restio/src/setup.js", function(module, exports, require){
var methods = require('./methods'),
    engine = require('engine.io'),
    packet = require('./packet'),
    assert = require('assert'),
    type = require('./type'),
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

module.exports.server = function (arg) {
  assert(type(arg) == 'string' || type(arg) == 'object');

  if(type(arg) == 'string') return engine.listen(arg);
  else return engine.attach(arg)
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
});
require.register("restio/src/type.js", function(module, exports, require){
var platform = require('./platform');

module.exports = platform == 'browser' ? require('type') : require('type-component');
});
require.register("restio/src/on.js", function(module, exports, require){
var platform = require('./platform'),
    packet = require('./packet'),
    mr = require('match-route'),
    type = require('./type');

module.exports = function (socket, callbacks, routes) {
  var on = {};

  on.message = function (msg) {
    msg = JSON.parse(msg)
    if(msg.rsp && callbacks[msg.method][msg.id]) on.response(msg);
    else if(!msg.rsp) on.request(msg);
  };

  on.response = function (res) {
    clearTimeout(callbacks[res.method][res.id].tm);
    callbacks[res.method][res.id](res.data);
    callbacks[res.method][res.id] = undefined;
  };

  on.request = function (req) {
    mr(req, routes, function (callback, route, params, query) {
      callback({
        socket: platform == 'node' ? socket : undefined,
        params: params,
        body: req.data,
        query: query
      }, function (data) {
        socket.send(packet.parse(req.method, data, req.url, req.id, true));
      });
    });
  };

  return on;
};


});
require.alias("LearnBoost-engine.io-client/lib/index.js", "restio/deps/engine.io/lib/index.js");
require.alias("LearnBoost-engine.io-client/lib/parser.js", "restio/deps/engine.io/lib/parser.js");
require.alias("LearnBoost-engine.io-client/lib/socket.js", "restio/deps/engine.io/lib/socket.js");
require.alias("LearnBoost-engine.io-client/lib/transport.js", "restio/deps/engine.io/lib/transport.js");
require.alias("LearnBoost-engine.io-client/lib/emitter.js", "restio/deps/engine.io/lib/emitter.js");
require.alias("LearnBoost-engine.io-client/lib/util.js", "restio/deps/engine.io/lib/util.js");
require.alias("LearnBoost-engine.io-client/lib/transports/index.js", "restio/deps/engine.io/lib/transports/index.js");
require.alias("LearnBoost-engine.io-client/lib/transports/polling.js", "restio/deps/engine.io/lib/transports/polling.js");
require.alias("LearnBoost-engine.io-client/lib/transports/polling-xhr.js", "restio/deps/engine.io/lib/transports/polling-xhr.js");
require.alias("LearnBoost-engine.io-client/lib/transports/polling-jsonp.js", "restio/deps/engine.io/lib/transports/polling-jsonp.js");
require.alias("LearnBoost-engine.io-client/lib/transports/websocket.js", "restio/deps/engine.io/lib/transports/websocket.js");
require.alias("LearnBoost-engine.io-client/lib/transports/flashsocket.js", "restio/deps/engine.io/lib/transports/flashsocket.js");
require.alias("LearnBoost-engine.io-client/lib/index.js", "restio/deps/engine.io/index.js");
require.alias("component-emitter/index.js", "LearnBoost-engine.io-client/deps/emitter/index.js");

require.alias("visionmedia-debug/index.js", "LearnBoost-engine.io-client/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "LearnBoost-engine.io-client/deps/debug/debug.js");

require.alias("ramitos-match-route/src/match-route.js", "restio/deps/match-route/src/match-route.js");
require.alias("ramitos-match-route/src/match-route.js", "restio/deps/match-route/index.js");
require.alias("component-path-to-regexp/index.js", "ramitos-match-route/deps/path-to-regexp/index.js");

require.alias("component-querystring/index.js", "ramitos-match-route/deps/querystring/index.js");
require.alias("component-trim/index.js", "component-querystring/deps/trim/index.js");

require.alias("redventures-reduce/index.js", "component-querystring/deps/reduce/index.js");

require.alias("component-url/index.js", "ramitos-match-route/deps/url/index.js");

require.alias("component-type/index.js", "restio/deps/type/index.js");

require.alias("ramitos-sgen/src/sgen.js", "restio/deps/sgen/src/sgen.js");
require.alias("ramitos-sgen/src/map.js", "restio/deps/sgen/src/map.js");
require.alias("ramitos-sgen/src/sgen.js", "restio/deps/sgen/index.js");

require.alias("component-assert/index.js", "restio/deps/assert/index.js");
require.alias("component-stack/index.js", "component-assert/deps/stack/index.js");

require.alias("restio/src/client/restio.js", "restio/index.js");
  if ("undefined" == typeof module) {
    window.restio = require("restio");
  } else {
    module.exports = require("restio");
  }
})();