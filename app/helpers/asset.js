'use strict';

var urlHelper = require('./url');
var config = require('../config');

function assetHelper(path) {
  return urlHelper(config.server.asset + path);
}

module.exports = assetHelper;
