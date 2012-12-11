var assert = require('assert'),
    blage = require('blage'),
    restio = require('../'),
    http = require('http'),
    path = require('path'),
    kip = require('kip');

var file = kip(path.join(path.dirname(__filename), '..'));
var server = http.createServer(blage(file)).listen(7589);
var io = restio.listen(server);

io.on.get('/user/:id', function (req, res) {
  assert(Object.keys(req.params).length == 1);
  assert(Object.keys(req.query).length == 0);
  assert(Object.keys(req.body).length == 0);
  assert(req.params.id == 5);
  res({id: req.params.id});
});

io.on('connection', function (socket) {
  socket.get('/status', function (status) {
    assert(Object.keys(status).length == 1);
    assert(status.running == true);
  });
});