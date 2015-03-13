'use stirct';

var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var config = require('./app/config');
var root = __dirname;

var entry = {
  common: [
    'jquery',
    'jquery-ui',
    'jquery-minicolors',
    'jquery.cookie',
    'bootstrap',
    'bootstrap-touchspin',
    'ionrangeslider',
    'select2',
  ],
};

entry = fs.readdirSync(config.script.path).reduce(function (entry, pathname) {
  var index = path.join(config.script.path, pathname, 'index.js');
  if (fs.existsSync(index)) {
    entry[pathname] = index;
  }
  return entry;
}, entry);

module.exports = {
  entry: entry,
  output: {
    path: path.join(config.server.root, config.server.asset, 'js'),
    filename: '[name].js',
    publicPath: config.server.base,
  },
  resolve: {
    root: root,
    modulesDirectories: [
      'node_modules',
      'bower_components',
    ],
    alias: {
      'bootstrap-touchspin': 'bootstrap-touchspin/src/jquery.bootstrap-touchspin.js',
      'jquery.cookie': 'jquery-cookie/jquery.cookie.js',
      'jquery-minicolors': 'jquery-minicolors/jquery.minicolors.js',
      'ionrangeslider': 'ionrangeslider/js/ion.rangeslider.js',
    },
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin('common', 'common.js'),
    new webpack.ResolverPlugin(
      new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main']), ['normal', 'loader']
    ),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
  ],
  devServer: {
    host: config.server.host,
    port: config.server.port,
    contentBase: config.server.root,
    stats: {
      colors: true,
    },
  },
};
