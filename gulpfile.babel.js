import gulp from 'gulp';
import loadPlugins from 'gulp-load-plugins';
import requireDir from 'require-dir';
import path from 'path';
import webpack from 'webpack';
import merge from 'merge';
import runSequence from 'run-sequence';
import fs from 'fs';
import es from 'event-stream';
import notifier from 'node-notifier';

function loadConfig() {
  let config = require('./app/config');
  let stage = process.env.stage;

  let file = '.env' + (stage ? '.' + stage : '') + '.json';
  if (fs.existsSync(file)) {
    let env = JSON.parse(fs.readFileSync(file));
    config = merge.recursive(config, env);
    $.util.log('Override config from ' + file);
  }

  return config;
}

let $ = loadPlugins({camelize: true});
let config = loadConfig();
let root   = __dirname;
let webpackCompiler; // webpack compiler for livereload cache

requireDir('./tasks', {recurse: true});

gulp.task('script', (callback) => {
  if (!webpackCompiler) {
    let webpackConfig = require('./webpack.config.babel');
    webpackCompiler = webpack(webpackConfig);
  }

  webpackCompiler.run((err, stats) => {
    if (err || stats.hasErrors()) {
      let message = err
        ? err.message
        : stats.compilation.errors[0].error.toString();
      notifier.notify({
        title: 'Webpack compile error',
        message: message,
        sound: true
      }, function (err) {
        if (err) {
          throw new $.util.PluginError('node-notifier', err);
        }
      });
    }

    if (err) {
      throw new $.util.PluginError('webpack', err);
    }

    $.util.log('[webpack]', stats.toString({colors: true}));
    callback();
  });
});

gulp.task('style', () => {
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

gulp.task('style:update-vendor', () => {
  return gulp.src([
      path.join(root, 'bower_components/select2/select2.css'),
      path.join(root, 'bower_components/select2/select2-bootstrap.css'),
      path.join(root, 'bower_components/jquery-minicolors/jquery.minicolors.css'),
      path.join(root, 'bower_components/ionrangeslider/css/*.css'),
      '!' + path.join(root, 'bower_components/ionrangeslider/css/normalize.css'),
      path.join(root, 'bower_components/animate.css/animate.css'),
    ])
    .pipe($.rename({
      prefix: '_',
      extname: '.scss'
    }))
    .pipe(gulp.dest(path.join(config.style.path, 'vendor')));
});

gulp.task('asset', () => {
  let assets = gulp.src([
    path.join(root, 'app/assets/**/*'),
  ])
  .pipe(gulp.dest(path.join(config.server.root, config.server.asset)));

  let select2 = gulp.src([
    './bower_components/select2/*.{png,gif}',
  ])
  .pipe(gulp.dest('public/assets/css'));

  let fonts = gulp.src([
    path.join(root, 'bower_components/font-awesome/fonts/*'),
  ])
  .pipe(gulp.dest(path.join(config.server.root, config.server.asset, 'fonts')));

  return es.merge(assets, select2, fonts);
});

gulp.task('view', () => {
  let data = merge(
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
      errorHandler: (error) => {
        $.util.log(error.message);
        this.emit('end');
    }}))
    .pipe($.ectSimple({
      options: {
        root: config.view.path,
        ext: '.ect'
      },
      data: data,
    }))
    .pipe($.if(config.optimize, $.minifyHtml({
      empty: true,
      conditionals: true,
      spare: true,
      quotes: true,
      loose: true,
    })))
    .pipe(gulp.dest(config.server.root));
});

gulp.task('clean', (callback) => {
  let del = require('del');

  if (!config.server.root || config.server.root === '') {
    throw new Error('config server.root was empty.');
  }

  del(path.join(config.server.root, '**/*'))
    .then(() => {
      callback();
    });
});

gulp.task('test', () => {
  $.util.log('Test? nothing yay!');
});

gulp.task('server', () => {
  gulp.src(config.server.root)
    .pipe($.webserver({
      livereload: true,
      port: config.server.port,
      base: config.server.base,
    }));
});

gulp.task('watch', () => {
  $.watch(path.join(config.view.path, '**/*'), () => {
    gulp.start('view');
  });

  $.watch(path.join(config.style.path, '**/*'), () => {
    gulp.start('style');
  });

  $.watch(path.join(config.script.path, '**/*'), () => {
    gulp.start('script');
  });
});

gulp.task('deploy', ['build'], () => {
  return gulp.src('./public/**/*')
    .pipe($.ghPages({cacheDir: './.ghpages'}));
});

gulp.task('build', (callback) => {
  runSequence(
    ['test', 'clean'],
    ['style:update-vendor'],
    ['view', 'script', 'style', 'asset'],
    callback
  );
});

gulp.task('default', ['watch', 'server']);
