'use stirct';

var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var config = require('./app/config');

var entry = fs.readdirSync(config.script.path)
  .reduce(function (entry, pathname) {
    entry[pathname] = path.join(config.script.path, pathname, 'index');
    return entry;
  }, {});

entry.common = [
  'jquery',
  'jquery-ui',
  'jquery-minicolors',
  'jquery.cookie',
  'bootstrap',
  'bootstrap-touchspin',
  'ionrangeslider',
  'select2',
  'es6-promise',
  'react',
  'flux',
  'wolfy87-eventemitter',
  'lodash',
  'classnames',
];

var plugins = [
  new webpack.optimize.CommonsChunkPlugin('common', 'common.js'),
  new webpack.ResolverPlugin(
    new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
  ),
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
  }),
];

if (config.script.optimize) {
  plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = {
  entry: entry,
  output: {
    path: path.join(config.server.root, config.server.asset, 'js'),
    filename: '[name].js',
    publicPath: config.server.base,
  },
  resolve: {
    root: __dirname,
    extensions: [
      '',
      '.jsx',
      '.js',
    ],
    modulesDirectories: [
      'node_modules',
      'bower_components',
    ],
    alias: {
      'bootstrap-touchspin': 'bootstrap-touchspin/src/jquery.bootstrap-touchspin.js',
      'jquery.cookie': 'jquery-cookie/jquery.cookie.js',
      'jquery-minicolors': 'jquery-minicolors/jquery.minicolors.js',
      'jquery-ui': 'jquery-ui/jquery-ui.js',
      'ionrangeslider': 'ionrangeslider/js/ion.rangeslider.js',
    },
  },
  plugins: plugins,
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
      },
      {
        test: /\.json$/,
        loader: 'json',
      }
    ]
  },
  devServer: {
    host: config.server.host,
    port: config.server.port,
    contentBase: config.server.root,
    stats: {
      colors: true,
    },
  },
};
