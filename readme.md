# restio

REST-like syntax for WebSockets built on top of [engine.io](https://github.com/LearnBoost/engine.io)

([more](ramitos/restio/blob/master/documentation.md))

## install

```bash
$ component install [--dev] ramitos/restio
```

```bash
$ npm install [--save/--save-dev] restio
```

## usage

#### server

```js
var assert = require('assert'),
    restio = require('restio'),
    http = require('http');

var server = http.createServer(function (req, res) {}).listen(7589);

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
```

#### client

```js
var assert = require('assert'),
    restio = require('restio');

restio.listen(document.location.origin, function (io) {
  io.on.get('/status', function (req, res) {
    assert(Object.keys(req.params).length == 0);
    assert(Object.keys(req.query).length == 0);
    assert(Object.keys(req.body).length == 0);
    res({running: true});
  });

  io.get('/user/5', function (user) {
    assert(Object.keys(user).length == 1);
    assert(user.id == 5);
  });
});
```

## todo
 * support `chunked` data responses
 * api documentation
 * test suite

## license

MIT