# installation

#### with [component(1)](https://github.com/component/component)

```bash
$ component install [--dev] ramitos/restio
```

#### with [bower](https://github.com/twitter/bower)

```bash
$ bower install [--save] restio
```

#### without any package manager

download the [regular](https://raw.github.com/ramitos/restio/master/dist/restio.js) or [minified](https://raw.github.com/ramitos/restio/master/dist/restio.min.js) versions and use them as regular scripts

```html
<script src='js/vendor/restio.min.js'></script>
```

# usage

#### with [component(1)](https://github.com/component/component)

```js
var restio = require('restio');
```

#### with [bower](https://github.com/twitter/bower) or as a regular script

```js
var restio = window.restio;
```

# api

## restio

```js
var restio = require('restio');
```

### .connect(string: url, function: callback)

**parameters**:
 * *string* **url**: the url to connect. ex: `'ws://example.com'`, `'http://example.com'`, `'https://socket.example.com'`, `'wss://www.example.com'`
 * *function* **callback(object: [io](#io))**: function that will be called after the connection has been established

**example**:

```js
restio.connect('http://lvh.me:7589', function (io) {
  assert(typeof io == 'object');
});
```

## io

**note**: although you can send data to every request type - all are managed the same way - it doesn't make sense to send data to the `GET` and `DELETE` requests

### .get(string: path, [object: body], [function: callback])

**parameters**:
  * *string* **path**: the path request. ex: `'/book/978-1-1181-8546-9'`
  * *object* **body** *(optional)*: the data to be sent. ex: `{all_info: true}`
  * *function* **callback(object: body)** *(optional)*: function that will be called if the server sends any response

**example**:

```js
io.get('/book/978-1-1181-8546-9?props=pages&props=publisher', function (book) {
  assert(typeof book == 'object');
  assert(Object.keys(book).length == 2)
  assert(book.publisher == 'wiley');
  assert(book.pages == 480);
});
```

### .post(string: path, [object: body], [function: callback])

**parameters**:
  * *string* **path**: the path request. ex: `'/book'`
  * *object* **body** *(optional)*: the data to be sent. ex: `{isbn: 978-1-1181-8546-9, (...)}`
  * *function* **callback(object: body)** *(optional)*: function that will be called if the server sends any response

**example**:

```js
io.post('/book', {
  isbn: '978-1-1181-8546-9',
  publisher: 'wiley'
}, function (body) {
  assert(typeof body == 'object');
  assert(body.saved == true);
});
```

### .put(string: path, [object: body], [function: callback])

**parameters**:
  * *string* **path**: the path request. ex: `'/book/978-1-1181-8546-9'`
  * *object* **body** *(optional)*: the data to be sent. ex: `{pages: 480}`
  * *function* **callback(object: body)** *(optional)*: function that will be called if the server sends any response

**example**:

```js
io.put('/book/978-1-1181-8546-9', {
  pages: 480
}, function (body) {
  assert(typeof body == 'object');
  assert(body.updated == true);
});
```

### .delete(string: path, [object: body], [function: callback])

**parameters**:
  * *string* **path**: the path request. ex: `'/book/978-1-1181-8546-9'`
  * *object* **body** *(optional)*: the data to be sent. ex: `{permanently: false}`
  * *function* **callback(object: body)** *(optional)*: function that will be called if the server sends any response

**example**:

```js
io.delete('/book/978-1-1181-8546-9', function (body) {
  assert(typeof body == 'object');
  assert(body.deleted == true);
});
```
  
### .on(string: event, function: callback)

Adds a listener to the specified event

**parameters**:
  * *string* **event**: the name of the event
  * *function* **callback**: function called when the event is fired

**events**:
  * **error**

**example**:

```js
io.on('error', function (e) {
  assert(e instanceof Error);
  throw e;
});
```

#### .get(string: path, [function: callback])

**parameters**:
  * *string* **path**: the path pattern of the request. ex: `'/book/:isbn'`
  * *function* **callback(object: [req](#request), function: res)**: function to handle the request

**example**:

```js
io.get('/book/:isbn', function (req, res) {
  assert(typeof res == 'function');
  assert(typeof req == 'object');
  res({
    isbn: req.params.isbn,
    publisher: 'wiley',
    pages: 480
  });
});
```

#### .post(string: path, [function: callback])

**parameters**:
  * *string* **path**: the path pattern of the request. ex: `'/book'`
  * *function* **callback(object: [req](#request), function: res)**: function to handle the request

**example**:

```js
io.post('/book', function (req, res) {
  assert(typeof res == 'function');
  assert(typeof req == 'object');
  res({saved: true});
});
```

#### .put(string: path, [function: callback])

**parameters**:
  * *string* **path**: the path pattern of the request. ex: `'/book'`
  * *function* **callback(object: [req](#request), function: res)**: function to handle the request

**example**:

```js
io.put('/book/:isbn', function (req, res) {
  assert(typeof res == 'function');
  assert(typeof req == 'object');
  res({updated: true});
});
```

#### .delete(string: path, [function: callback])

**parameters**:
  * *string* **path**: the path pattern of the request. ex: `'/book'`
  * *function* **callback(object: [req](#request), function: res)**: function to handle the request

**example**:

```js
io.delete('/book/:isbn', function (req, res) {
  assert(typeof res == 'function');
  assert(typeof req == 'object');
  res({deleted: true});
});
```

### .once(string: event, function: callback)

The same as `.on` but only fired once

### .off(string: event, [function: callback])

Remove a listener to the specified event, or pass only the event name to remove all handlers for event.

# request

Object passed to each request handler

**properties**
  * **params**
  * **body**
  * **query**

**examples**:

*from server*:
```js
socket.get('/book/978-1-1181-8546-9?props=pages&props=publisher');
```

*where the client is listening to:*

```js
io.get('/book/:isbn', function (req, res) {});
```

*request object in the client request handler*
```json
{
  "params": {
    "isbn": "978-1-1181-8546-9"
  },
  "body": {},
  "query": {
    "props": ["pages", "publisher"]
  }
}
```

--

*from server*:
```js
socket.post('/book', {
  isbn: '978-1-1181-8546-9',
  publisher: 'wiley'
});
```

*where the client is listening to:*

```js
io.post('/book', function (req, res) {});
```

*request object in the client request handler*
```json
{
  "params": {},
  "body": {
    "isbn": "978-1-1181-8546-9",
    "publisher": "wiley"
  },
  "query": {}
}
```