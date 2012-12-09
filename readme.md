# restio

REST-like syntax for websockets built on top of [engine.io](https://github.com/LearnBoost/engine.io)

## install

```bash
$ component install [--dev] ramitos/restio
```

```bash
$ npm install [--save/--save-dev] restio
```

## usage

### server

```js
var io = require('restio').listen(7589)

io.on.get('/user/:id', function (params, query, data, socket, respond) {
  respond({id: params.id})
})

//send to all
Object.keys(io.clients).forEach(function (id) {
  //callback will only be called if the client responds
  io.clients[id].post('/user', {id: 10}, function (data) {})
})
```

### client

```js
require('restio').listen('http://localhost:7589', function (io) {
  io.get('/user/4', function (user) {})
  io.on.post('/user', function (params, query, data, respond) {})
})
```

## todo

 * api documentation
 * test suite

## license

MIT