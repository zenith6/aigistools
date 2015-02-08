'use strict';

var url = require('url');
var config = require('../config');

function urlHelper(pathname, options) {
  var address;
  options = options || {};

  if (options.host || options.absolute || options.secure) {
    address = url.format({
      protocol: options.secure ? 'https' : options.protocol || config.server.protocol,
      hostname: config.server.host,
      port: config.server.port == 80 ? undefined : config.server.port,
      pathname: config.server.base + pathname,
      query: options.query,
      search: options.search,
      hash: options.hash,
    });
  } else {
    address = url.resolve(config.server.base, pathname);
  }

  return address;
}

module.exports = urlHelper;
