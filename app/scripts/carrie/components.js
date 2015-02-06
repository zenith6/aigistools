'use strict';

function Component(options) {
  this.options = options;
  this.zIndex = options.zIndex || 0;
  this.animate = false;
  this.disposed = false;
}

Component.prototype.prepare = function (ctx, callback) {
  callback(this);
};

Component.prototype.dispose = function () {
  this.disposed = true;
};

Component.prototype.render = function (ctx) {
  throw new Error('Not implemented');
};


function Fill(options) {
  Component.call(this, options);
}

Fill.prototype = Object.create(Component.prototype);
Fill.prototype.constructor = Component;

Fill.prototype.render = function (ctx) {
  var canvas = ctx.canvas;
  ctx.fillStyle = this.options.color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

module.exports.Fill = Fill;


function Image(options) {
  Component.call(this, options);

  this.image = null;
}

Image.prototype = Object.create(Component.prototype);
Image.prototype.constructor = Component;

Image.prototype.prepare = function (ctx, callback) {
  var self = this;
  var image = document.createElement('img');

  image.crossOrigin = 'Anonymous';

  image.onload = function () {
    self.image = image;
    callback(self);
  };

  image.src = this.options.src;
};

Image.prototype.render = function (ctx) {
  var canvas = ctx.canvas;
  var cw = canvas.width;
  var ch = canvas.height;
  var sw = this.image.width;
  var sh = this.image.height;
  var dw, dh;
  var ox = 0;
  var oy = 0;

  if (this.options.tiling) {
    dw = sw;
    dh = sh;
  } else {
    dw = cw;
    dh = ch;
  }

  for (var dy = oy; dy < ch; dy += dh) {
    for (var dx = ox; dx < cw; dx += dw) {
      ctx.drawImage(this.image, 0, 0, sw, sh, dx, dy, dw, dh);
    }
  }
};

module.exports.Image = Image;


function HorizontalText(options) {
  Component.call(this, options);
}

HorizontalText.prototype = Object.create(Component.prototype);
HorizontalText.prototype.constructor = Component;

HorizontalText.prototype.render = function (ctx) {
  ctx.save();

  var options = this.options;
  var board = options.board;
  var scale = options.scale;
  var fontSize = options.fontSize;
  var fontFamily = options.fontFamily;

  ctx.font = fontSize + 'px ' + fontFamily + ' ';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  var outlineWidth = Math.max(options.fontSize / 28, 1.2);
  var shadowWidth = outlineWidth * 3;
  ctx.fillStyle = options.foregroundColor;
  var bx = board.left * scale;
  var by = board.top * scale;
  options.lines.forEach(function (line, i) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.rotate(board.slope * Math.PI / 180);
    ctx.translate(bx, by + options.fontSize * 1.15 * i);
    if (options.shadow) {
      ctx.strokeStyle = options.shadowColor;
      ctx.lineWidth = shadowWidth;
      ctx.strokeText(line, 0, 0);
    }
    ctx.fillText(line, 0, 0);
    if (options.outline) {
      ctx.strokeStyle = options.outlineColor;
      ctx.lineWidth = outlineWidth;
      ctx.strokeText(line, 0, 0);
    }
  });
  ctx.restore();
};

module.exports.HorizontalText = HorizontalText;


// やっつけ
var verticalChars = {
  'ー': '｜',
  '…': '・'
};

function VerticalText(options) {
  Component.call(this, options);
}

VerticalText.prototype = Object.create(Component.prototype);
VerticalText.prototype.constructor = Component;

VerticalText.prototype.render = function (ctx) {
  ctx.save();

  var options = this.options;
  var board = options.board;
  var scale = options.scale;
  var fontSize = options.fontSize;
  var fontFamily = options.fontFamily;

  ctx.font = fontSize + 'px ' + fontFamily + ' ';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = options.foregroundColor;

  var outlineWidth = Math.max(fontSize / 28, 1.2);

  var shadowWidth = outlineWidth * 3;

  var bx = (board.left + board.width) * scale;
  var by = board.top * scale;
  var lh = fontSize * 1.15;

  ctx.rotate(board.slope * Math.PI / 180);

  options.lines.forEach(function (line, i) {
    var x = bx - lh * i;
    var y = by;

    line.split('').forEach(function (char) {
      char = verticalChars[char] || char;

      if (options.shadow) {
        ctx.strokeStyle = options.shadowColor;
        ctx.lineWidth = shadowWidth;
        ctx.strokeText(char, x, y);
      }
      ctx.fillText(char, x, y);
      if (options.outline) {
        ctx.strokeStyle = options.outlineColor;
        ctx.lineWidth = outlineWidth;
        ctx.strokeText(char, x, y);
      }
      y += fontSize * (char == ' ' ? 0.5 : 1);
    });
  });

  ctx.restore();
};

module.exports.VerticalText = VerticalText;


/**
 *
 * @see http://www.script-tutorials.com/html5-fire-Effect/
 */
function Flame(options) {
  Component.call(this, options);
  this.animate = true;
}

Flame.prototype = Object.create(Component.prototype);
Flame.prototype.constructor = Component;

Flame.prototype.prepare = function (ctx, callback) {
  var palette = new Array(256);
  for (var i = 0; i < 64; ++i) {
    palette[i + 0] = {
      r: i / 2,
      g: i / 2,
      b: i / 2,
      a: 255
    };
    palette[i + 64] = {
      r: i << 3,
      g: 0,
      b: 128 - (i << 2),
      a: 255
    };
    palette[i + 128] = {
      r: 255,
      g: i << 1 + 64,
      b: 0,
      a: 255
    };
    palette[i + 192] = {
      r: 255,
      g: 255,
      b: i << 2,
      a: 255
    };
  }
  this.palette = palette;

  var canvas = ctx.canvas;
  this.imagedata = ctx.createImageData(canvas.width, canvas.height);

  var length = this.imagedata.width * this.imagedata.height;
  var Buffer = Uint8Array ? Uint8Array : Array;
  this.buffer = new Buffer(length);
  for (i = 0; i < this.buffer.length; i++) {
    this.buffer[i] = 0;
  }

  var data = this.imagedata.data;
  for (i = 0; i < length * 4; i++) {
    data[i] = i % 4 == 3 ? 255 : 0;
  }

  callback(this);
};

Flame.prototype.render = function (ctx) {
  var imagedata = this.imagedata;
  var data = imagedata.data;
  var buffer = this.buffer;
  var width = imagedata.width;
  var height = imagedata.height;

  var offset = width * (height - 1);
  for (var i = 0; i < width; i++) {
    buffer[offset + i] = (0.82 > Math.random()) ? 255 : 0;
  }

  var h = Math.min(height, 250);
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < width; x++) {
      var s = offset + x;
      var c = (buffer[s] + buffer[s + 1] + buffer[s - 1] + buffer[s - width]) / 4;
      if (c > 1) {
        c -= 0.8;
      }
      c <<= 0;
      buffer[s - width] = c;
      var id = s << 2;
      var color = this.palette[c];
      data[id + 0] = color.r;
      data[id + 1] = color.g;
      data[id + 2] = color.b;
      data[id + 3] = color.a;
    }
    offset -= width;
  }

  ctx.putImageData(imagedata, 0, 0);
};

module.exports.Flame = Flame;


function Portrait(options) {
  Component.call(this, options);
}

Portrait.prototype = Object.create(Component.prototype);
Portrait.prototype.constructor = Component;

Portrait.prototype.render = function (ctx) {
  var canvas = ctx.canvas;
  var cw = canvas.width;
  var ch = canvas.height;

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 50;
  ctx.strokeRect(0, 0, cw, ch);
  ctx.strokeStyle = 'black';
  ctx.lineCap = 'square';
  ctx.lineWidth = 40;
  ctx.strokeRect(0, 0, cw, ch);

  var brw = 50;
  var tr = cw / 3.5;
  var bl = ch / 3;
  ctx.strokeStyle = 'black';
  ctx.lineWidth = brw;
  ctx.beginPath();
  ctx.moveTo(tr, 0);
  ctx.quadraticCurveTo(tr - brw, bl - brw, 0, bl);
  ctx.stroke();

  var tl = cw - cw / 3.5;
  var br = ch / 3;
  ctx.beginPath();
  ctx.moveTo(tl, 0);
  ctx.quadraticCurveTo(tl + brw, br - brw, cw, br);
  ctx.stroke();

  var wrw = 10;
  tr = cw / 3.5 + brw / 4;
  bl = ch / 3 + brw / 4;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = wrw;
  ctx.beginPath();
  ctx.moveTo(tr, 0);
  ctx.quadraticCurveTo(tr - brw, bl - brw, 0, bl);
  ctx.stroke();

  tl = cw - cw / 3.5 - brw / 4;
  br = ch / 3 + brw / 4;
  ctx.beginPath();
  ctx.moveTo(tl, 0);
  ctx.quadraticCurveTo(tl + brw, br - brw, cw, br);
  ctx.stroke();

  var sw = 2;
  tr = cw / 3.5 + (brw + sw) / 2;
  bl = ch / 3 + (brw + sw) / 2;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = sw;
  ctx.beginPath();
  ctx.moveTo(tr, 0);
  ctx.quadraticCurveTo(tr - brw - sw, bl - brw - sw, 0, bl);
  ctx.stroke();

  tl = cw - cw / 3.5 - (brw + sw) / 2;
  br = ch / 3 + (brw + sw) / 2;
  ctx.beginPath();
  ctx.moveTo(tl, 0);
  ctx.quadraticCurveTo(tl + brw + sw, br - brw - sw, cw, br);
  ctx.stroke();
};

module.exports.Portrait = Portrait;


function Grayscale(options) {
  Component.call(this, options);
}

Grayscale.prototype = Object.create(Component.prototype);
Grayscale.prototype.constructor = Component;

Grayscale.prototype.render = function (ctx) {
  var canvas = ctx.canvas;
  var cw = canvas.width;
  var ch = canvas.height;
  var imagedata = ctx.getImageData(0, 0, cw, ch);
  var data = imagedata.data;
  var len = 4 * cw * ch;
  for (var i = 0; i < len; i += 4) {
    var r = data[i];
    var g = data[i + 1];
    var b = data[i + 2];
    var a = data[i + 3];
    var y = Math.floor(0.298912 * r + 0.586611 * g + 0.114478 * b);
    data[i] = data[i + 1] = data[i + 2] = y;
    data[i + 3] = a;
  }
  ctx.putImageData(imagedata, 0, 0);
};

module.exports.Grayscale = Grayscale;


function Heaven(options) {
  Component.call(this, options);

  this.animate = true;
  this.heaven = null;
  this.offset = 0;
}


Heaven.prototype = Object.create(Component.prototype);
Heaven.prototype.constructor = Component;

Heaven.prototype.prepare = function (ctx, callback) {
  var self = this;
  var image = document.createElement('img');

  image.crossOrigin = 'Anonymous';

  image.onload = function () {
    self.heaven = image;
    callback(self);
  };

  image.src = this.options.src;
};

Heaven.prototype.render = function (ctx) {
  var canvas = ctx.canvas;
  var cw = canvas.width;
  var ch = canvas.height;
  var hw = this.heaven.width;
  var hh = this.heaven.height;

  this.offset += 3;
  if (this.offset > hh) {
    this.offset -= hh;
  }

  for (var y = -this.offset; y < ch; y += hh) {
    ctx.drawImage(this.heaven, 0, 0, hw, hh, 0, y, cw, hh);
  }
};

module.exports.Heaven = Heaven;


function Crystal(options) {
  Component.call(this, options);

  this.animate = true;
  this.heaven = null;
  this.offset = 0;
}

Crystal.prototype = Object.create(Component.prototype);
Crystal.prototype.constructor = Component;

Crystal.prototype.render = function (ctx) {
    var canvas = ctx.canvas;
    var text = 'もうすぐ終了';

    ctx.font = this.options.fontSize + 'px ' + this.options.fontFamily + ' ';
    var matrix = ctx.measureText(text);
    var x = (canvas.width - matrix.width) / 2;
    var y = (canvas.height - this.options.fontSize * 0.5);
    ctx.lineWidth = Math.max(this.options.fontSize / 28, 1.2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 191)';
    ctx.strokeText(text, x, y);
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(255, 0, 0, 159)';
    ctx.fillText(text, x, y);
};

module.exports.Crystal = Crystal;


function Gedou(options) {
  Component.call(this, options);
}

Gedou.prototype = Object.create(Component.prototype);
Gedou.prototype.constructor = Component;

Gedou.prototype.render = function (ctx) {
  var canvas = ctx.canvas;
  // var cw = canvas.width;
  var ch = canvas.height;
  var text = this.options.gedouText;
  var fs = 72;
  var chars = text.split('');
  var x = fs * 0.7;
  var y = ch - fs * chars.length - fs * 0.2;

  ctx.save();

  ctx.font = fs + 'px ' + this.options.fontFamily + ' ';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  chars.forEach(function (char, i) {
    char = verticalChars[char] || char;
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'white';
    ctx.strokeText(char, x, y + fs * i);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'black';
    ctx.strokeText(char, x, y + fs * i);
    ctx.lineWidth = 1;
    ctx.fillStyle = 'black';
    ctx.fillText(char, x, y + fs * i);
  });

  text = 'まさに';
  var gedoufs = fs;
  var gedoulen = chars.length;
  var gedoux = x;
  var gedouy = y;
  fs = 40;
  chars = text.split('');
  var ox = gedoux + gedoufs * 0.8;
  var space = (gedoufs * gedoulen - fs * chars.length) / (chars.length - 1);
  x = ox;
  y = gedouy + fs * 0.1;
  ctx.font = fs + 'px ' + this.options.fontFamily + ' ';
  chars.forEach(function (char) {
    char = verticalChars[char] || char;
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'white';
    ctx.strokeText(char, x, y);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.strokeText(char, x, y);
    ctx.lineWidth = 1;
    ctx.fillStyle = 'black';
    ctx.fillText(char, x, y);
    y += fs + space;
  });

  ctx.restore();
};

module.exports.Gedou = Gedou;


function Gameover(options) {
  Component.call(this, options);
}

Gameover.prototype = Object.create(Component.prototype);
Gameover.prototype.constructor = Component;

Gameover.prototype.render = function (ctx) {
  var canvas = ctx.canvas;
  var cw = canvas.width;
  var ch = canvas.height;
  var fs = this.options.fontSize * 1;
  var padding = fs * 0.2;
  var l = fs / 2;
  var w = cw - l * 2;
  var t = ch - l - padding - fs;
  var h = fs + padding * 2;

  ctx.save();

  var wbg = ctx.createLinearGradient(l, t, l, t + h);
  wbg.addColorStop(0, 'rgba(0, 0, 192, 0.8)');
  wbg.addColorStop(1, 'rgba(0, 0, 192, 0.4)');
  ctx.fillStyle = wbg;
  ctx.fillRect(l, t, w, h);

  ctx.strokeStyle = 'black';
  ctx.lineWidth = fs / 10;
  ctx.strokeRect(l, t, w, h);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = fs / 30;
  ctx.strokeRect(l, t, w, h);

  var text = this.options.gameoverText;
  ctx.font = fs + 'px ' + this.options.fontFamily + ' ';
  ctx.textBaseline = 'top';
  ctx.lineCap = 'round';
  ctx.lineWidth = fs * 0.1;
  ctx.strokeStyle = 'black';
  ctx.strokeText(text, l + padding, t + padding);

  ctx.lineWidth = 0;
  ctx.fillStyle = 'white';
  ctx.fillText(text, l + padding, t + padding);

  ctx.restore();
};

module.exports.Gameover = Gameover;


function Ad(options) {
  Component.call(this, options);

  this.animate = true;
  this.image = null;
  this.time = 0;
}

Ad.prototype = Object.create(Component.prototype);
Ad.prototype.constructor = Component;

Ad.prototype.prepare = function (ctx, callback) {
  var canvas = ctx.canvas;
  this.defaultScale = Math.min(canvas.width / 1000, canvas.height / 750);
  this.wave = 0.15 * this.defaultScale;
  this.epsilon = 0.005 * this.defaultScale;

  var self = this;
  var image = document.createElement('img');
  image.crossOrigin = 'Anonymous';

  image.onload = function () {
    self.image = image;
    callback(self);
  };

  image.src = this.options.src;
};

Ad.prototype.render = function (ctx) {
  var canvas = ctx.canvas;
  var cw = canvas.width;
  var ch = canvas.height;

  if (this.time > this.wave) {
    this.time = -this.wave;
  }

  this.time += this.epsilon;

  var scale = this.defaultScale + Math.abs(this.time);
  var sw = this.image.width;
  var sh = this.image.height;
  var dw = sw * scale;
  var dh = sh * scale;
  var dx = (cw - dw) / 2;
  var dy = (ch - dh) / 2;
  ctx.drawImage(this.image, 0, 0, sw, sh, dx, dy, dw, dh);
};

module.exports.Ad = Ad;
