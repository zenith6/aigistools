'use strict';

var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var Canvas = require('canvas');
var config = require('../app/config');
var gm = require('gm');
var color = require('onecolor');

function getUnits(base, done) {
  var units = [];
  var remains = 0;

  fs.readdir(base, function (err, files) {
    if (err) {
      throw err;
    }

    remains += files.length;

    files.forEach(function (file) {
      var raritiedDir = path.join(base, file);

      fs.readdir(path.join(base, file), function (err, files) {
        files.forEach(function (file) {
          units.push({
            name: path.basename(file, path.extname(file)),
            icon: path.join(raritiedDir, file),
          });
        });

        if (--remains === 0) {
          done(units);
        }
      });
    });
  });
}

function buildSprite(units, done) {
  var remains = units.length;
  var iconWidth = 16;
  var iconHeight = 16;

  var spriteMaxWidth = 1024;
  var spriteWidth = Math.min(iconWidth * units.length, spriteMaxWidth);
  var spriteHeight = iconHeight * Math.ceil(iconWidth * units.length / spriteMaxWidth);

  var sprite = new Canvas(spriteWidth, spriteHeight);
  var metadata = [];

  var ctx = sprite.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  units.forEach(function (unit, index) {
    fs.readFile(unit.icon, function (err, data) {
      if (err) {
        throw err;
      }

      var icon = new Canvas.Image();
      icon.src = data;
      var x = (iconWidth * index) % spriteMaxWidth;
      var y = Math.floor(iconWidth * index / spriteMaxWidth) * iconHeight;
      ctx.drawImage(icon, x, y, iconWidth, iconHeight);

      metadata.push({
        name: unit.name,
        left: x,
        top: y,
        width: iconWidth,
        height: iconHeight,
      });

      if (--remains === 0) {
        done(sprite, metadata);
      }
    });
  });
}

function mergeHsl(metas, units, done) {
  var remains = metas.length;

  metas.forEach(function (metadata, index) {
    var unit = units[index];

    gm(unit.icon).identify(function (err, data) {
      if (err) {
        throw err;
      }

      var stat = data['Channel Statistics'];
      var rgba = ['Red', 'Green', 'Blue', 'Alpha'].map(function (key) {
        return stat[key] ? parseInt(stat[key].Mean.split(' ')[0]) : 255;
      });

      var hsl = color.call(null, rgba).hsl();

      ['hue', 'saturation', 'lightness'].forEach(function (key) {
        metadata[key] = hsl[key]();
      });

      if (--remains === 0) {
        done(metas);
      }
    });
  });
}

function writeSprite(dest, sprite, done) {
  var output = fs.createWriteStream(dest);
  var stream = sprite.pngStream();

  stream.on('data', function (chunk) {
    output.write(chunk);
  });

  stream.on('end', function () {
    done();
  });
}

function writeMetadata(dest, metadata, done) {
  var output = fs.createWriteStream(dest);
  output.write(JSON.stringify(metadata), done);
}

gulp.task('aigisdot', function (callback) {
  var src = path.join(config.app.path, 'resources/aigisdot/16x16');
  var spriteFilename = path.join(config.app.path, 'resources/aigisdot/aigisdot.png');
  var metadataFilename = path.join(config.app.path, 'resources/aigisdot/aigisdot.json');

  getUnits(src, function (units) {
    buildSprite(units, function (sprite, metadata) {
      writeSprite(spriteFilename, sprite, function () {
        mergeHsl(metadata, units, function (metadata) {
          writeMetadata(metadataFilename, metadata, callback);
        });
      });
    });
  });
});
