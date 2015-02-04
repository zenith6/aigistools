'use strict';

var url = require('url');
var config = require('../config');

function urlHelper(path) {
  return url.resolve(config.server.base, path);
}

module.exports = urlHelper;
