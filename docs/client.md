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

download the [regular](https://raw.github.com/ramitos/restio/master/dist/restio.js) or [minified](https://raw.github.com/ramitos/restio/master/dist/restio..min.js) versions and use them as regular scripts

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