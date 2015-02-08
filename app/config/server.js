'use strict';

var path = require('path');

module.exports = {
  root: path.resolve(__dirname, '../../public'),
  protocol: 'http',
  host: 'localhost',
  port: 8080,
  base: '/',
  asset: 'assets/',
  thumbnail: 'thumbnails/',
};
