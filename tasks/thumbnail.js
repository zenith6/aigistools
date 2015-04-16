'use strict';

var gulp    = require('gulp');
var $       = require('gulp-load-plugins')({camelize: true});
var phantom = require('phantom');
var gm      = require('gm');
var path    = require('path');
var url     = require('url');
var temp    = require('temp').track();
var walk    = require('walk');
var mkdirp  = require('mkdirp');
var del     = require('del');

var config = require('../app/config');
var serverRoot;
var thumbRoot;
var renderer;
var walker;
var gulpCallback;

function capture(address, output, callback) {
  $.util.log('Capturing: ' + address);

  renderer.createPage(function (page) {
    page.set('viewportSize', {
      width: 1920,
      height: 1008
    });

    page.open(address, function (status) {
      if (status !== 'success') {
        throw new $.util.PluginError('thumbnail', 'Failed to load: ' + address, {showStack: true});
      }

      temp.open('thumb', function (err, info) {
        if (err) {
          throw err;
        }

        var screen = info.path + '.png';

        setTimeout(function () {
          page.render(screen, function () {
            $.util.log('Saving to: ' + output);
            processImage(screen, output, function () {
              callback();
            });
          });
        }, 10000);
      });
    });
  });
}

function processImage(src, dest, callback) {
  gm(src)
    .crop(1920, 1008)
    .resize(1200, 630)
    .write(dest, function (err) {
      if (err) {
        throw err;
      }

      callback();
    });
}

function onWalkerFile(root, fileStats, next) {
  if (!fileStats.isFile() || path.extname(fileStats.name) != '.html') {
    next();
    return;
  }

  var pathname = path.relative(serverRoot, path.join(root, fileStats.name)).replace(path.sep, '/');

  var address = url.format({
      protocol: 'http',
      hostname: config.server.host,
      port: config.server.port,
      pathname: pathname,
  });

  var thumbDir = path.join(thumbRoot, path.dirname(pathname));
  mkdirp.sync(thumbDir);

  var output = path.join(thumbDir, path.basename(fileStats.name, '.html') + '.png');

  capture(address, output, function () {
    next();
  });
}

function onWalkerEnd() {
  renderer.exit();
  gulpCallback();
}

function renderNextPage() {
  walker.on('file', onWalkerFile);
  walker.on('end', onWalkerEnd);
}

gulp.task('thumbnail', ['build', 'server'], function (callback) {
  gulpCallback = callback;
  serverRoot = path.join(config.server.root, config.server.base);
  thumbRoot = config.app.thumbnail;

  if (!thumbRoot || thumbRoot === '') {
    throw new Error('view.thumbnail is empty.');
  }

  del(path.join(thumbRoot, '**/*'), function () {
    phantom.create(function (ph) {
      renderer = ph;

      walker = walk.walk(serverRoot);

      renderNextPage();
    });
  });
});
