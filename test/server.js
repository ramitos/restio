var blage = require('blage'),
    http = require('http'),
    path = require('path'),
    kip = require('kip');

var file = kip(path.join(path.dirname(__filename), '..'));
var server = http.createServer(blage(file)).listen(7589);
var io = require('../').listen(server);

io.on.get('/user/:id', function (params, query, data, respond, socket) {
  respond({id: params.id});
  //send to all
});

io.on('connection', function () {
  console.log(arguments);
})