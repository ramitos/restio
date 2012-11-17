var mr = require('match-route'),
    sgen = require('sgen')

module.exports.listen = function (addr, callback) {
  var socket = new eio.Socket(addr);
  socket.on('open', function () {
    var io = {};
    var on = {};
    setup(io, socket);
    
    on.response = function (response) {
      clearTimeout(io.callbacks[response.method][response.id].tm);
      io.callbacks[response.method][response.id](response.data);
    };
    
    on.message = function (message) {
      message = JSON.parse(message);
      if(io.callbacks[message.method][message.id]) on.response(message);
      else on.request(message);
    };
    
    on.request = function (request) {
      mr(request, io.routes, function (fn, params, query) {
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

var setup = function (io, socket) {
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
      var id = sgen(10);
      var idset = false;
      var data = {};

      if(typeof arguments[1] === 'function') {
        callback = arguments[1];
      } else {
        data = arguments[1];
        callback = arguments[2];
      }

      while(!idset) {
        if(!io.callbacks[method][id]) idset = true;
        else id = sgen(10);
      }

      if(callback) callback.tm = setTimeout(function () {
        delete io.callbacks[method][id];
      }, 3600000);

      socket.send(JSON.stringify({id: id, url: url, method: method, data: data}));
      io.callbacks[method][id] = callback;
    };
  });
};
//
// (function () {
//   var methods = ['get', 'post', 'put', 'delete']
//   var restio = window.restio = {};
//
//   var sgen = function (length) {
//     var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
//     var hash = [];
//
//     for(var i = 0; i < length; i += 1) {
//       hash.push(chars[Math.floor(Math.random()*62)]);
//     }
//
//     return hash.join('');
//   };
//
//   var setup = function (io, socket) {
//     io.callbacks = {};
//     io.routes = {};
//     io.on = {};
//     for(var i = 0, len = methods.length; i < len; ++i) {
//       io.callbacks[methods[i]] = {};
//       io.routes[methods[i]] = {};
//
//       io.on[methods[i]] = function (path, callback) {
//         io.routes[methods[i]][path] = callback;
//       };
//
//       io[methods[i]] = function (url) {
//         var callback = function () {};
//         var id = sgen(10);
//         var idset = false;
//         var data = {};
//
//         if(typeof arguments[1] === 'function') {
//           callback = arguments[1];
//         } else {
//           data = arguments[1];
//           callback = arguments[2];
//         }
//
//         while(!idset) {
//           if(!io.callbacks[methods[i]][id]) idset = true;
//           else id = sgen(10)
//         }
//
//         callback.tm = setTimeout(function () {
//           delete io.callbacks[methods[i]][id]
//         }, 3600000);
//
//         socket.send(JSON.stringify({id: id, url: url, method: methods[i], data: data}));
//         io.callbacks[methods[i]][id] = callback;
//       };
//     };
//   };
//
//   var mr = function (req, routes, callback) {
//     var qs = require('querystring'),
//         regex = require('./regex'),
//         url = require('url')
//
//     module.exports = function () {
//       var method = req.method.toLowerCase()
//       var parsedurl = url.parse(req.url)
//       var querystring = parsedurl.query
//       var query = qs.parse(querystring)
//       var pathname = parsedurl.pathname
//       var params = new Object()
//       var matchroute = null
//
//       Object.keys(routes[method]).forEach(function (route) {
//         var keys = new Array()
//         var rexp = regex(route, keys, false, false)
//         var match = pathname.match(rexp)
//         if(!match) return
//
//         match.shift()
//         matchroute = routes[method][route]
//
//         match.forEach(function (param, index) {
//           params[keys[index].name] = param
//         })
//       })
//
//       callback(matchroute, params, query)
//     }
//   }
//
//   restio.listen = function (addr, callback) {
//     var socket = new eio.Socket(addr);
//     socket.on('open', function () {
//       var io = {};
//       var on = {};
//       setup.server(io, socket);
//
//       on.response = function (response) {
//         clearTimeout(io.callbacks[response.method][response.id].tm);
//         io.callbacks[response.method][response.id](response.data);
//       };
//
//       on.message = function (message) {
//         message = JSON.parse(message);
//         if(io.callbacks[message.method][message.id]) on.response(message);
//         else on.request(message);
//       };
//
//       on.request = function (request) {
//         mr(request, io.routes, function (fn, params, query) {
//           fn(params, query, request.data, socket, function (data) {
//             request.data = data;
//             socket.send(JSON.stringify(request));
//           });
//         });
//       };
//
//       socket.on('message', on.message);
//     });
//   };
// })(window)
//
//
//
// socket.on('open', function () {
//   socket.on('message', function (data) {
//     console.log(arguments)
//   })
//   socket.on('close', function () {
//     console.log(arguments)
//   })
//
//   setTimeout(function () {
//     socket.send(JSON.stringify({
//       id: 'dsaklhikqws',
//       url: '/test/url',
//       method: 'post',
//       data: {
//         one: 1
//       }
//     }))
//   }, 5000)
//
//
// // var cookies = require('./cookies'),
// //     engine = require('engine.io'),
// //     mr = require('match-route'),
// //     setup = require('./setup'),
// //     sgen = require('sgen'),
// //     url = require('url')
// //
// // module.exports.listen = function () {
// //   if(typeof arguments[0] === 'object') var isHTTP = true
// //   else var isHTTP = false
// //
// //   if(isHTTP) var server = engine.atach(arguments[0])
// //   else var server = engine.listen(arguments[0])
// //
// //   var io = new Object()
// //   setup.server(io, server)
// //
// //   server.on('connection', function (socket) {
// //     socket.cookies = cookies(socket.request.headers.cookie)
// //     var on = new Object()
// //     setup.socket(socket)
// //
// //     on.response = function (response) {
// //       clearTimeout(socket.callbacks[message.method][message.id].tm)
// //       socket.callbacks[message.method][message.id](response.data)
// //     }
// //
// //     on.message = function (message) {
// //       message = JSON.parse(message)
// //       if(socket.callbacks[message.method][message.id]) on.response(message)
// //       else on.request(message)
// //     }
// //
// //     on.request = function (request) {
// //       mr(request, io.routes, function (fn, params, query) {
// //         fn(params, query, request.data, socket, function (data) {
// //           request.data = data
// //           socket.send(JSON.stringify(request))
// //         })
// //       })
// //     }
// //
// //     socket.on('message', on.message)
// //   })
// //
// //   return io
// // }
// //
// // module.exports.server = function (io, server) {
// //   io.routes = new Object()
// //   io.on = new Object()
// //
// //   ;new Array('get', 'post', 'put', 'delete').forEach(function (method) {
// //     io.routes[method] = new Object()
// //     io.on[method] = function (path, callback) {
// //       io.routes[method][path] = callback
// //     }
// //   })
// //
// //   io.clients = server.clients
// // }
// //
// // module.exports.socket = function (socket) {
// //   socket.callbacks = new Object();
// //   new Array('get', 'post', 'put', 'delete').forEach(function (method) {
// //     socket.callbacks[method] = new Object()
// //     socket[method] = function (url) {
// //       var callback = function () {}
// //       var data = new Object()
// //       var id = sgen(10)
// //
// //       if(typeof arguments[1] === 'function') callback = arguments[1]
// //       else {
// //         data = arguments[1]
// //         callback = arguments[2]
// //       }
// //
// //       var tm = setTimeout(function () {
// //         delete socket.callbacks[method][id]
// //       }, 3600000)
// //
// //       socket.send(JSON.stringify({id: id, url: url, method: method, data: data}))
// //       callback.tm = tm
// //       socket.callbacks[method][id] = callback
// //     }
// //   })
// // }