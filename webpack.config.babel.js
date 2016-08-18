import webpack from 'webpack';
import path from 'path';
import fs from 'fs';
import config from './app/config';

let entry = fs.readdirSync(config.script.path)
  .reduce((entry, pathname) => {
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
  'react',
  'flux',
  'wolfy87-eventemitter',
  'classnames',
  'babel-polyfill',
  'i18next',
  'jquery-i18next',
  'i18next-browser-languagedetector',
];

let plugins = [
  new webpack.optimize.CommonsChunkPlugin('common', 'common.js'),
  new webpack.ResolverPlugin(
    new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
  ),
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
  }),
];

if (config.optimize) {
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
      'jquery-i18next': 'jquery-i18next/jquery-i18next.js',
    },
  },
  plugins: plugins,
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel',
        query: {
          presets: [
            'es2015',
            'react',
          ],
        },
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
