var sgen = require('sgen')

module.exports.server = function (io, server) {
  io.routes = new Object()
  io.on = new Object()

  ;new Array('get', 'post', 'put', 'delete').forEach(function (method) {
    io.routes[method] = new Object()
    io.on[method] = function (path, callback) {
      io.routes[method][path] = callback
    }
  })
  
  io.clients = server.clients
}

module.exports.socket = function (socket) {
  socket.callbacks = new Object();
  new Array('get', 'post', 'put', 'delete').forEach(function (method) {
    socket.callbacks[method] = new Object()
    socket[method] = function (url) {
      var callback = function () {}
      var data = new Object()
      var id = sgen(10)
      var idset = false
      
      if(typeof arguments[1] === 'function') callback = arguments[1]
      else {
        data = arguments[1]
        callback = arguments[2]
      }
      
      while(!idset) {
        if(!socket.callbacks[method][id]) idset = true
        else id = sgen(10)
      }
      
      callback.tm = setTimeout(function () {
        delete socket.callbacks[method][id]
      }, 3600000)
      
      socket.send(JSON.stringify({id: id, url: url, method: method, data: data}))
      socket.callbacks[method][id] = callback
    }
  })
}