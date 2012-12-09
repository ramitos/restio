var blage = require('blage'),
    http = require('http'),
    path = require('path'),
    kip = require('kip')

var server = http.createServer(blage(kip(path.dirname(__filename)))).listen(7589);
var io = require('../').listen(server);

io.on.get('/user/:id', function (params, query, data, socket, respond) {
  respond({id: params.id});
  //send to all
  Object.keys(io.clients).forEach(function (id) {
    //callback will only be called if the client responds
    io.clients[id].post('/user', {id: 10}, function (data) {});
  });
});