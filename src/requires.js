var platform = require('./platform');

if(platform == 'browser') {
  module.exports.eio = require('engine.io');
  module.exports.ev = require('emitter');
  module.exports.type = require('type');
} else {
  module.exports.ev = require('events').EventEmitter;
  module.exports.eio = require('engine.io-client');
  module.exports.type = require('type-component');
}