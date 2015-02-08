'use strict';

var urlHelper = require('./url');
var config = require('../config');

function assetHelper(pathname, options) {
  return urlHelper(config.server.asset + pathname, options);
}

module.exports = assetHelper;
