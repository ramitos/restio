# restio

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

*only component/component supported at the moment*

```js
require('restio').listen('http://localhost:7589', function (io) {
  io.get('/user/4', function (user) {})
  io.on.post('/user', function (params, query, data, respond) {})
})
```