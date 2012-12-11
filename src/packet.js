module.exports.parse = function (method, data, url, id, rsp) {
  return JSON.stringify({method: method, data: data, url: url, id: id, rsp: rsp});
};