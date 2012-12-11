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
      callback(params, query, req.data, function (data) {
        socket.send(packet.parse(req.method, data, req.url, req.id, true));
      }, platform == 'node' ? socket : undefined);
    });
  };
  
  return on;
};

