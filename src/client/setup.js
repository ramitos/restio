module.exports = function (io, socket) {
  io.callbacks = {};
  io.routes = {};
  io.on = {};

  ['get', 'post', 'put', 'delete'].forEach(function (method) {
    io.callbacks[method] = {};
    io.routes[method] = {};

    io.on[method] = function (path, callback) {
      io.routes[method][path] = callback;
    };

    io[method] = function (url) {
      var callback = function () {};
      var id = sgen.timestamp();
      var data = {};

      if(typeof arguments[1] === 'function') {
        callback = arguments[1];
      } else {
        data = arguments[1];
        callback = arguments[2];
      }

      callback.tm = setTimeout(function () {
        clearTimeout(io.callbacks[method][id].tm);
        io.callbacks[method][id] = undefined;
      }, 3600000);

      io.callbacks[method][id] = callback;
      socket.send(JSON.stringify({
        method: method,
        data: data,
        url: url,
        id: id
      }));
    };
  });
};