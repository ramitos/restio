;(function (window) {
/******************************** PATHTOREGEXP ********************************/
  /**
   * Normalize the given path string,
   * returning a regular expression.
   *
   * An empty array should be passed,
   * which will contain the placeholder
   * key names. For example "/user/:id" will
   * then contain ["id"].
   *
   * @param  {String|RegExp|Array} path
   * @param  {Array} keys
   * @param  {Object} options
   * @return {RegExp}
   * @api private
   */
  var pathtoRegexp = function (path, keys, options) {
    options = options || {};
    var sensitive = options.sensitive;
    var strict = options.strict;
    keys = keys || [];

    if (path instanceof RegExp) return path;
    if (path instanceof Array) path = '(' + path.join('|') + ')';

    path = path
      .concat(strict ? '' : '/?')
      .replace(/\/\(/g, '(?:/')
      .replace(/\+/g, '__plus__')
      .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function(_, slash, format, key, capture, optional){
        keys.push({ name: key, optional: !! optional });
        slash = slash || '';
        return ''
          + (optional ? '' : slash)
          + '(?:'
          + (optional ? slash : '')
          + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')'
          + (optional || '');
      })
      .replace(/([\/.])/g, '\\$1')
      .replace(/__plus__/g, '(.+)')
      .replace(/\*/g, '(.*)');

    return new RegExp('^' + path + '$', sensitive ? '' : 'i');
  };

/********************************* QUERYSTRING ********************************/
  /**
   * Parse the given query `str`.
   *
   * @param {String} str
   * @return {Object}
   * @api public
   */
  var qs = {};
  qs.parse = function(str){
    if ('string' != typeof str) return {};
    str = str.trim();
    if ('' == str) return {};
    return str
      .split('&')
      .reduce(function(obj, pair){
        var parts = pair.split('=');
        obj[parts[0]] = null == parts[1]
          ? ''
          : decodeURIComponent(parts[1]);
        return obj;
      }, {});
  };

  /**
   * Stringify the given `obj`.
   *
   * @param {Object} obj
   * @return {String}
   * @api public
   */

  qs.stringify = function(obj){
    if (!obj) return '';
    var pairs = [];
    for (var key in obj) {
      pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
    }
    return pairs.join('&');
  };

/************************************ URL *************************************/
  /**
   * Parse the given `url`.
   *
   * @param {String} str
   * @return {Object}
   * @api public
   */
  var url = {};

  url.parse = function (url){
    var a = document.createElement('a');
    a.href = url;
    return {
      href: a.href,
      host: a.host || location.host,
      port: a.port || location.port,
      hash: a.hash,
      hostname: a.hostname || location.hostname,
      pathname: a.pathname,
      protocol: !a.protocol || ':' == a.protocol ? location.protocol : a.protocol,
      search: a.search,
      query: a.search.slice(1)
    };
  };

  /**
   * Check if `url` is absolute.
   *
   * @param {String} url
   * @return {Boolean}
   * @api public
   */
  url.isAbsolute = function (url){
    return 0 == url.indexOf('//') || !!~url.indexOf('://');
  };

  /**
   * Check if `url` is relative.
   *
   * @param {String} url
   * @return {Boolean}
   * @api public
   */
  url.isRelative = function (url){
    return !exports.isAbsolute(url);
  };

  /**
   * Check if `url` is cross domain.
   *
   * @param {String} url
   * @return {Boolean}
   * @api public
   */
  url.isCrossDomain = function (url){
    url = exports.parse(url);
    return url.hostname !== location.hostname
      || url.port !== location.port
      || url.protocol !== location.protocol;
  };

/********************************* MATCHROUTE *********************************/
  var matchRoute = function (req, routes, callback) {
    var method = req.method.toLowerCase();
    var parsedurl = url.parse(req.url);
    var querystring = parsedurl.query;
    var query = qs.parse(querystring);
    var pathname = parsedurl.pathname;
    var params = new Object();
    var matchroute = null;

    Object.keys(routes[method]).forEach(function (route) {
      var keys = new Array();
      var rexp = pathtoRegexp(route, keys, false, false);
      var match = pathname.match(rexp);
      if(!match) return;

      match.shift();
      matchroute = routes[method][route];

      match.forEach(function (param, index) {
        params[keys[index].name] = param;
      });
    });

    callback(matchroute, params, query);
  };

/************************************ SGEN ************************************/
  var sgen = function (length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
    var hash = [];

    for(var i = 0; i < length; i += 1) {
      hash.push(chars[Math.floor(Math.random()*62)]);
    };

    return hash.join('');
  };

/******************************************************************************/
/********************************** RESTIO ************************************/
/******************************************************************************/

  var restio = window.restio = {};

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

        callback.tm = setTimeout(function () {
          delete io.callbacks[method][id];
        }, 3600000);

        socket.send(JSON.stringify({id: id, url: url, method: method, data: data}));
        io.callbacks[method][id] = callback;
      };
    });
  };

  restio.listen = function (addr, callback) {
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
        matchRoute(request, io.routes, function (fn, params, query) {
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
})(window);