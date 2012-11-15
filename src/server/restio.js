var cookies = require('./cookies'),
    engine = require('engine.io'),
    mr = require('match-route'),
    setup = require('./setup')

module.exports.listen = function () {
  if(typeof arguments[0] === 'object') var isHTTP = true
  else var isHTTP = false
  
  if(isHTTP) var server = engine.attach(arguments[0])
  else var server = engine.listen(arguments[0])
  
  var io = new Object()
  setup.server(io, server)
  
  server.on('connection', function (socket) {
    socket.cookies = cookies(socket.request.headers.cookie)
    var on = new Object()
    setup.socket(socket)
    
    on.response = function (response) {
      clearTimeout(socket.callbacks[response.method][response.id].tm)
      socket.callbacks[response.method][response.id](response.data)
    }
    
    on.message = function (message) {
      message = JSON.parse(message)
      if(socket.callbacks[message.method][message.id]) on.response(message)
      else on.request(message)
    }
    
    on.request = function (request) {
      mr(request, io.routes, function (fn, params, query) {
        fn(params, query, request.data, socket, function (data) {
          request.data = data
          socket.send(JSON.stringify(request))
        })
      })
    }
    
    socket.on('message', on.message)
  })
  
  return io
}