module.exports = function (cookies) {
  var response = new Object()
  if(!cookies) return {}
  var cookiekeys = cookies.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '').split(/\s*(?:\=[^;]*)?;\s*/)

  cookiekeys.forEach(function (cookie) {
    response[cookie] = unescape(cookies.replace(new RegExp('(?:^|.*;\\s*)' + escape(cookie).replace(/[\-\.\+\*]/g, '\\$&') + '\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*'), '$1'))
  })

  return response
}