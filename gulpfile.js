'use strict';

var gulp        = require('gulp');
var $           = require('gulp-load-plugins')({camelize: true});
var requireDir  = require('require-dir');
var ect         = require('gulp-ect-simple');
var deploy      = require('gulp-gh-pages');
var path        = require('path');
var webpack     = require('webpack');
var merge       = require('merge');
var runSequence = require('run-sequence');
var fs          = require('fs');
var es          = require('event-stream');
var notifier    = require('node-notifier');

var config = loadConfig();
var root   = __dirname;
var webpackCompiler; // webpack compiler for livereload cache

requireDir('./tasks', {recurse: true});

function loadConfig() {
  var config = require('./app/config');
  var stage = process.env.stage;

  var file = '.env' + (stage ? '.' + stage : '') + '.json';
  if (fs.existsSync(file)) {
    var env = JSON.parse(fs.readFileSync(file));
    config = merge.recursive(config, env);
    $.util.log('Override config from ' + file);
  }

  return config;
}

gulp.task('script', function (callback) {
  if (!webpackCompiler) {
    var webpackConfig = require('./webpack.config');
    webpackCompiler = webpack(webpackConfig);
  }

  webpackCompiler.run(function(err, stats) {
    if (err) {
      throw new $.util.PluginError('webpack', err);
    }

    if (stats.hasErrors()) {
      notifier.notify({
        title: 'Webpack compile error',
        message: stats.toString({
          hash: false,
          version: false,
          timings: false,
          assets: false,
          chunks: false,
          errorDetails: true,
          source: true,
        }),
        sound: true,
      }, function (err) {
        if (err) {
          throw new $.util.PluginError('node-notifier', err);
        }
      });
    }

    $.util.log('[webpack]', stats.toString({colors: true}));

    callback();
  });
});

gulp.task('style', function () {
  return gulp.src(path.join(config.style.path, '*.scss'))
    .pipe($.plumber({
      errorHandler: $.notify.onError('<%= error.message %>')
    }))
    .pipe($.sass({
      includePaths: [
        path.join(root, 'bower_components'),
      ]
    }))
    .pipe($.pleeease())
    .pipe(gulp.dest(path.join(config.server.root, config.server.asset, 'css')));
});

gulp.task('style:update-vendor', function () {
  return gulp.src([
      path.join(root, 'bower_components/select2/select2.css'),
      path.join(root, 'bower_components/select2/select2-bootstrap.css'),
      path.join(root, 'bower_components/jquery-minicolors/jquery.minicolors.css'),
      path.join(root, 'bower_components/ionrangeslider/css/*.css'),
      '!' + path.join(root, 'bower_components/ionrangeslider/css/normalize.css'),
    ]).pipe($.rename({
      prefix: '_',
      extname: '.scss'
    })).pipe(gulp.dest(path.join(config.style.path, 'vendor')));
});

gulp.task('asset', function () {
  var assets = gulp.src([
    path.join(root, 'app/assets/**/*'),
  ])
  .pipe(gulp.dest(path.join(config.server.root, config.server.asset)));

  var select2 = gulp.src([
    './bower_components/select2/*.{png,gif}',
  ])
  .pipe(gulp.dest('public/assets/css'));

  var fonts = gulp.src([
    path.join(root, 'bower_components/bootstrap-sass/assets/fonts/**/*'),
    path.join(root, 'bower_components/font-awesome/fonts/*'),
  ])
  .pipe(gulp.dest(path.join(config.server.root, config.server.asset, 'fonts')));

  return es.merge(assets, select2, fonts);
});

gulp.task('view', function () {
  var data = merge(
    require(config.view.helper),
    {
      config: config,
    }
  );

  return gulp.src([
      path.join(config.view.path, '**/*.ect'),
      '!' + path.join(config.view.path, '**/_*.ect'),
    ])
    .pipe($.plumber({
      errorHandler: function (error) {
        $.util.log(error.message);
        this.emit('end');
    }}))
    .pipe(ect({
      options: {
        root: config.view.path,
        ext: '.ect'
      },
      data: data,
    }))
    .pipe(gulp.dest(config.server.root));
});

gulp.task('clean', function (callback) {
  var del = require('del');

  if (!config.server.root || config.server.root === '') {
    throw new Error('config server.root was empty.');
  }

  del(path.join(config.server.root, '**/*'), callback);
});

gulp.task('test', function () {
  $.util.log('Test? nothing yay!');
});

gulp.task('server', function() {
  gulp.src(config.server.root)
    .pipe($.webserver({
      livereload: true,
      port: config.server.port,
      base: config.server.base,
    }));
});

gulp.task('watch', ['server'], function () {
  gulp.watch(path.join(config.view.path, '**/*'), ['view']);
  gulp.watch(path.join(config.style.path, '**/*'), ['style']);
  gulp.watch(path.join(config.script.path, '**/*'), ['script']);
});

gulp.task('deploy', ['build'], function () {
  return gulp.src('./public/**/*')
    .pipe(deploy({cacheDir: './.ghpages'}));
});

gulp.task('build', function (callback) {
  runSequence(['test', 'clean'], ['view', 'script', 'style', 'asset'], callback);
});

gulp.task('default', ['watch']);
