'use strict';

function loadImage(url, callback) {
  var loader = new Image();

  loader.crossOrigin = 'Anonymous';

  loader.onload = function () {
    callback(this);
  };

  loader.src = url;
}

module.exports = loadImage;
