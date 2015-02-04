'use strict';

var gulp        = require('gulp');
var $           = require('gulp-load-plugins')({camelize: true});
var ect         = require('gulp-ect-simple');
var deploy      = require('gulp-gh-pages');
var path        = require('path');
var webpack     = require('webpack');
var merge       = require('merge');
var runSequence = require('run-sequence');
var fs          = require('fs');
var mergeStream = require('event-stream').merge;

function loadConfig() {
  var config = require('./app/config');
  var stage = process.env.stage;

  try {
    var file = '.env' + (stage ? '.' + stage : '') + '.json';
    var env = JSON.parse(fs.readFileSync(file));
    config = merge.recursive(config, env);
    $.util.log('Override config from ' + file);
  } catch (error) {
  }

  return config;
}

var config = loadConfig();
var root   = __dirname;
var webpackCompiler; // webpack compiler for livereload cache

gulp.task('script', function (callback) {
  if (!webpackCompiler) {
    var webpackConfig = require('./webpack.config');
    webpackCompiler = webpack(webpackConfig);
  }

  webpackCompiler.run(function(error, status) {
    if (error) {
      throw new $.util.PluginError('webpack', error);
    }

    $.util.log('[webpack]', status.toString({colors: true}));

    callback();
  });
});

gulp.task('style', function () {
  return gulp.src(path.join(config.style.path, '*.scss'))
    .pipe($.plumber({
      errorHandler: function (error) {
        $.util.log(error.message);
        this.emit('end');
    }}))
    .pipe($.sass({
      includePaths: [
        path.join(root, 'node_modules'),
        path.join(root, 'bower_components'),
      ]
    }))
    .pipe($.autoprefixer())
    .pipe(gulp.dest(path.join(config.server.root, config.server.asset, 'css')));
});

gulp.task('style:update-vendor', function () {
  return gulp.src([
      path.join(root, 'node_modules/select2/select2.css'),
      path.join(root, 'node_modules/select2/select2-bootstrap.css'),
    ]).pipe($.rename({
      prefix: '_',
      extname: '.scss'
    })).pipe(gulp.dest(path.join(config.style.path, 'vendor')));
});

gulp.task('resource', function () {
  var resources = gulp.src([
    path.join(root, 'app/resources/**/*'),
  ])
  .pipe(gulp.dest(path.join(config.server.root, config.server.asset)));

  var fonts = gulp.src([
    path.join(root, 'node_modules/bootstrap-sass/assets/fonts/**/*'),
    path.join(root, 'node_modules/font-awesome/fonts/*'),
  ]).pipe(gulp.dest(path.join(config.server.root, config.server.asset, 'fonts')));

  return mergeStream(resources, fonts);
});

gulp.task('view', function () {
  var data = merge(
    require(config.view.helper),
    {
      config: config,
      tools: require('./app/tools'),
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
  runSequence(['test', 'clean'], ['view', 'script', 'style', 'resource'], callback);
});

gulp.task('default', ['watch']);
