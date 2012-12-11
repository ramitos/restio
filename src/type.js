var platform = require('./platform');

module.exports = platform == 'browser' ? require('type') : require('type-component');