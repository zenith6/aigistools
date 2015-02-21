webpackJsonp([2],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';

	__webpack_require__(1);
	__webpack_require__(4);

	var loadImage  = __webpack_require__(9);
	var components = __webpack_require__(10);
	var commands   = __webpack_require__(11);
	var effects    = __webpack_require__(12);

	var templates = __webpack_require__(14)
	  .reduce(function (templates, template) {
	    templates[template.id] = template;
	    return templates;
	  }, {});

	var layers = [];

	var defaults = {
	  t: 'ahoge',
	  m: 'キャリーさんも\nそう思う',
	  c: undefined,
	  b: '#ffffff',
	  f: '#ffffff',
	  s: undefined,
	  l: '"Textar", "MS PGothic", "IPAMonaPGothic", "Mona", sans-serif',
	  e: 'fill',
	  o: '1',
	  u: '#000000',
	  h: '0',
	  d: '#ffffff',
	  egt: '外道',
	  eot: '全滅した…',
	  v: 0
	};

	function filter(text) {
	  return text.replace(/\$([\w+])\(([^)]+)\)/g, function (all, id, arg) {
	    var command = commands[id];
	    return command ? command.apply(null, arg.split(/,/)) : '';
	  });
	}

	var animationTimer;

	function render(canvas) {
	  var ctx = canvas.getContext('2d');

	  ctx.imageSmoothingEnabled = true;

	  ctx.clearRect(0, 0, canvas.width, canvas.height);

	  var animate = layers.some(function (layer) {
	    return layer.animate;
	  });

	  if (animate) {
	    animationTimer = setInterval(function () {
	      renderLayers(ctx);
	    }, 33);
	  } else {
	    renderLayers(ctx);
	  }
	}

	function renderLayers(ctx) {
	  layers.forEach(function (layer) {
	    layer.render(ctx);
	  });
	}

	function exportToImage() {
	  var canvas = document.querySelector('#canvas');
	  $('#export_content').attr('src', canvas.toDataURL());
	  $('#export').modal('show');
	}

	function stopAnimation() {
	  if (!animationTimer) {
	    return;
	  }

	  clearInterval(animationTimer);
	  animationTimer = null;
	}

	function clearLayers() {
	  layers.forEach(function (layer) {
	    layer.dispose();
	  });

	  layers = [];
	}

	function addLayer(layer) {
	  layers.push(layer);

	  layers.sort(function (a, b) {
	    return a.zIndex - b.zIndex;
	  });
	}

	function createLayers(template, options) {
	  var layers = [];

	  // 背景色
	  var bgColor = new components.Fill({
	    color: options.backgroundColor,
	    scale: options.scale,
	    zIndex: 0
	  });
	  layers.push(bgColor);

	  // 背景画像
	  var bgImage = new components.Image({
	    src: template.bg,
	    scale: options.scale,
	    zIndex: 1000
	  });
	  layers.push(bgImage);

	  // 看板文字
	  var lines = filter(options.message)
	    .split(/\r\n?|\n/)
	    .map(function (line) {
	      return line.replace(/\s/g, ' ');
	    });

	  var board = template.board;
	  var boardText = new components[board.dir == 'horizontal' ? 'HorizontalText' : 'VerticalText']({
	    scale: options.scale,
	    lines: lines,
	    board: template.board,
	    fontSize: options.fontSize,
	    fontFamily: options.fontFamily,
	    foregroundColor: options.foregroundColor,
	    outline: options.outline,
	    outlineColor: options.outlineColor,
	    shadow: options.shadow,
	    shadowColor: options.shadowColor,
	    zIndex: 1000
	  });
	  layers.push(boardText);

	  // エフェクト
	  var effectLayers = options.effects.map(function (effectMeta) {
	    var effect = effects[effectMeta.id];

	    return effect.layers.map(function (layerMeta) {
	      var layerOptions = Object.create(layerMeta.options);

	      layerOptions.zIndex = layerMeta.zIndex;

	      switch (effectMeta.id + '.' + layerMeta.id) {
	        case 'crystal.text':
	          layerOptions.fontSize = 32;
	          layerOptions.fontFamily = options.fontFamily;
	          layerOptions.gedouText = effectMeta.options.gedouText;
	          break;

	        case 'gedou.text':
	          layerOptions.fontFamily = options.fontFamily;
	          layerOptions.gedouText = effectMeta.options.gedouText;
	          break;

	        case 'gameover.text':
	          layerOptions.fontSize = options.fontSize;
	          layerOptions.fontFamily = options.fontFamily;
	          layerOptions.gameoverText = effectMeta.options.gameoverText;
	          break;
	      }

	      return new layerMeta.component(layerOptions);
	    });
	  });

	  layers = Array.prototype.concat.apply(layers, effectLayers);

	  return layers;
	}

	var threadId = 0;
	var loaderTimer;
	var loaded;
	var retained = true;

	function update() {
	  if (retained) {
	    return;
	  }

	  if (loaderTimer) {
	    clearTimeout(loaderTimer);
	  }

	  loaded = false;
	  loaderTimer = setTimeout(function () {
	    if (loaded) {
	      return;
	    }

	    $('#loader').show();
	  }, 300);

	  stopAnimation();
	  clearLayers();

	  var template = templates[$('[name=template]:input').val()];

	  var effects = $('[name=effect]:input:checked').map(function () {
	    var options = {};

	    switch (this.value) {
	      case 'gedou':
	        options.gedouText = $('[name=gedou_text]:input').val();
	        break;

	      case 'gameover':
	        options.gameoverText = $('[name=gameover_text]:input').val();
	        break;
	      }

	    return {id: this.value, options: options};
	  }).get();

	  var options = {
	    template       : template,
	    message        : $('textarea[name=message]').val(),
	    scale          : parseFloat($('[name=scale]:input').val()),
	    backgroundColor: $('input[name=backgroundColor]').val(),
	    foregroundColor: $('input[name=foregroundColor]').val(),
	    fontSize       : $('select[name=fontSize]').val(),
	    fontFamily     : $('select[name=fontFamily]').val(),
	    outline        : !!parseInt($('input[name=outline]:checked').val()),
	    outlineColor   : $('input[name=outlineColor]').val(),
	    shadow         : !!parseInt($('input[name=shadow]:checked').val()),
	    shadowColor    : $('input[name=shadowColor]').val(),
	    effects        : effects
	  };

	  $('#template_name').text(template.name);


	  var canvas = document.querySelector('#canvas');
	  var ctx = canvas.getContext('2d');

	  loadImage(template.bg, function (bg) {
	    var scale = options.scale;
	    var width = (template.width ? template.width : bg.width) * scale;
	    var height = (template.height ? template.height : bg.height) * scale;
	    canvas.width = width;
	    canvas.height= height;

	    createLayers(template, options).forEach(function (layer) {
	      addLayer(layer);
	    });

	    var progress = 0, goal = layers.length, currentThreadId = ++threadId;
	    var onPrepared = function (layer) {
	      if (layer.disposed || currentThreadId !== threadId) {
	        return;
	      }

	      if (++progress === goal) {
	        render(canvas);

	        if (!loaded) {
	          $('#loader').hide();
	          loaded = true;
	        }
	      }
	    };

	    layers.forEach(function (layer) {
	      layer.prepare(ctx, onPrepared);
	    });
	  });


	  var gedouText = effects.reduce(function (e, text) {
	    return e.id == 'gedou' ? e.options.gedouText : text;
	  }, '');

	  var url = location.protocol + '//' +
	    location.host +
	    location.pathname +
	    '?t=' + encodeURIComponent(template.id) +
	    '&m=' + encodeURIComponent(encode(options.message)) +
	    '&b=' + encodeURIComponent(options.backgroundColor) +
	    '&f=' + encodeURIComponent(options.foregroundColor) +
	    '&c=' + encodeURIComponent(options.scale) +
	    '&s=' + encodeURIComponent(options.fontSize) +
	    '&e=' + encodeURIComponent(effects.map(function (effect) { return effect.id; }).join(',')) +
	    '&o=' + encodeURIComponent(options.outline ? 1 : 0) +
	    '&u=' + encodeURIComponent(options.outlineColor) +
	    '&h=' + encodeURIComponent(options.shadow ? 1 : 0) +
	    '&d=' + encodeURIComponent(options.shadowColor) +
	    '&gt=' + encodeURIComponent(encode(gedouText)) +
	    '&v=1';
	  $('input[name=url]').val(url);
	}

	function prepareTemplateList() {
	  var $list = $('#template_list');

	  if ($list.data('initialized')) {
	    return;
	  }

	  $list.data('initialized', true);

	  $.each(templates, function (id, template) {
	    var author = $('<div />')
	      .append($('<span class="template" />')
	        .text(template.name))
	      .append($('<span class="author"> />')
	        .text('@' + (template.author || '名無しさんピンキー')))
	      .html();

	    $('<img />')
	      .attr('src', template.thumbnail)
	      .attr('title', author)
	      .tooltip({
	        html: true
	      })
	      .wrap('<li />')
	      .parent()
	      .attr('data-template-id', template.id)
	      .appendTo($list);
	  });
	}

	function prepareForm() {
	  var $templateDialog = $('#chooser');

	  $('#template_list').on('click', 'li', function (event) {
	    event.preventDefault();

	    var id = $(event.currentTarget).attr('data-template-id');
	    var template = templates[id];

	    $('[name=template]:input').val(template.id);

	    $('[name=fontSize]:input').val(template.board.fontSize);

	    var shadow = template.board.shadow;
	    $('input[name=shadow]').prop('checked', !!shadow);

	    if (shadow) {
	      $('input[name=shadowColor]')
	        .val(shadow)
	        .minicolors('opacity', template.board.shadowAlpha || 0.25);
	    }


	    var slider = $('[name=scale]:input').data('ionRangeSlider');
	    slider.update({from: template.scale});

	    // ion.rangeSlider 経由でイベントが発火する
	    update();

	    $templateDialog.modal('hide');
	  });

	  $('#template').click(function (event) {
	    event.preventDefault();
	    prepareTemplateList();
	    $templateDialog.modal('show');
	  });

	  var $fontSize = $('select[name=fontSize]');
	  for (var size = 8; size <= 128; size++) {
	    $('<option />')
	      .text(size + 'px')
	      .val(size)
	      .appendTo($fontSize);
	  }

	  var $fontFamily = $('[name=fontFamily]:input');
	  $fontFamily.mousedown(function () {
	    if (!$fontFamily.data('loaded')) {
	      var fonts = document.querySelector('#font_finder').getDeviceFonts();
	      fonts.forEach(function (font) {
	        $('<option />').text(font).appendTo($fontFamily);
	      });
	      $fontFamily.data('loaded', true);
	    }
	  });


	  var $effectList = $('#effect_list').on('change', '[name=effect]:input', function () {
	    update();
	  });

	  $.map(effects, function (effect, id) {
	    $('<input type="checkbox" name="effect" />')
	      .val(id)
	      .wrap('<label />')
	      .parent()
	      .append($('<span />').text(effect.name))
	      .wrap('<div class="checkbox-inline" />')
	      .parent()
	      .appendTo($effectList);
	  });


	  var selector = [
	    'input[name=backgroundColor]',
	    'input[name=foregroundColor]',
	    '[name=scale]:input',
	    'select[name=fontSize]',
	    'select[name=fontFamily]',
	    'input[name=outline]',
	    'input[name=outlineColor]',
	    'input[name=shadow]',
	    'input[name=shadowColor]',
	    'input[name=gedou_text]'
	  ].join(',');
	  $(selector).change(update);

	  $('[name=message]:input').keyup(update);

	  $('button[name=export]').click(function (e) {
	    e.preventDefault();
	    try {
	      exportToImage();
	    } catch (e) {
	      window.alert('画像出力できませんでした。他のブラウザでお試し下さい。');
	    }
	  });

	  $('input[name=url]').click(function () {
	    this.select();
	  }).popover();


	  $('input[name=backgroundColor], input[name=foregroundColor], input[name=outlineColor], input[name=shadowColor]').minicolors({
	    opacity: true,
	    position: 'bottom right'
	  });

	  $('.author-list a').tooltip();

	  $('[name=scale]:input').ionRangeSlider({
	    min: 0.1,
	    max: 5,
	    step: 0.01,
	    prettify: function (value) {
	      return (Math.round(value * 10000) / 100) + '%';
	    }
	  });

	  $('[name=shrink]:input').change(function () {
	    $('#canvas')[this.checked ? 'addClass' : 'removeClass']('canvas-shrink');
	  })
	    .prop('checked', true)
	    .trigger('change');


	  // エフェクト: 外道
	  $('[name=effect][value=gedou]:input').change(function () {
	    $('#gedou_options').toggle(this.checked);
	  });

	  $('[name=gedou_text]').keyup(update);


	  // エフェクト: ゲームオーバー
	  $('[name=effect][value=gameover]:input').change(function () {
	    $('#gameover_options').toggle(this.checked);
	  });

	  $('[name=gameover_text]').keyup(update);
	}

	function encode(string) {
	  return btoa(window.unescape(encodeURIComponent(string)));
	}

	function decode(string) {
	  return decodeURIComponent(window.escape(atob(string)));
	}

	function initialize() {
	  prepareForm();

	  var encoded = false;
	  location.search.substring(1).split('&')
	    .map(function (pair) {
	      return pair.split('=').map(decodeURIComponent);
	    })
	    .map(function (kv) {
	      encoded = encoded || (kv[0] == 'v' && !!parseInt(kv[1]));
	      return kv;
	    })
	    .map(function (kv) {
	      if (kv[0] in defaults) {
	        var e = encoded && (kv[0] == 'm' || kv[0] == 'gt');
	        defaults[kv[0]] = e ? decode(kv[1]) : kv[1];
	      }
	    });

	  var template = templates[defaults.t] || templates['ahoge'];

	  if (!defaults.c) {
	    defaults.c = template.scale;
	  }

	  if (!defaults.s) {
	    defaults.s = template.board.fontSize;
	  }

	  $('<option />')
	    .text('デフォルトフォント')
	    .val(defaults.l)
	    .appendTo($('select[name=fontFamily]'));

	  $('[name=template]:input').val(defaults.t);
	  $('textarea[name=message]').val(defaults.m);
	  $('input[name=backgroundColor]').minicolors('value', defaults.b);
	  $('input[name=foregroundColor]').minicolors('value', defaults.f);
	  $('select[name=fontSize]').val(defaults.s);
	  $('select[name=fontFamily]').val(defaults.l);
	  $('input[name=outline]').prop('checked', !!parseInt(defaults.o));
	  $('input[name=outlineColor]').minicolors('value', defaults.u);
	  $('input[name=shadow]').prop('checked', !!parseInt(defaults.h));
	  $('input[name=shadowColor]').minicolors('value', defaults.d);

	  defaults.e.split(',').forEach(function (id) {
	    if (id in effects) {
	      $('[name=effect][value=' + id + ']').prop('checked', true);
	    }
	  });

	  $('input[name=gedou_text]').val(defaults.egt);
	  $('#gedou_options').toggle(defaults.e == 'gedou');

	  $('input[name=gameover_text]').val(defaults.eot);
	  $('#gameover_options').toggle(defaults.e == 'gameover');

	  $('[name=scale]:input').data('ionRangeSlider').update({from: defaults.c});

	  // for bootstrap/collapse.js
	  $('[name=outline]:input, [name=shadow]:input').each(function () {
	    var $input = $(this);
	    $($input.attr('data-target'))[this.checked ? 'addClass' : 'removeClass']('in');
	  });

	  retained = false;
	}

	$(function () {
	  initialize();
	  update();
	});
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */
/***/ function(module, exports, __webpack_require__) {

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


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

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


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = {
	  r: function () {
	    var items = Array.prototype.slice.call(arguments, 0);
	    return items[Math.floor(Math.random() * items.length)];
	  }
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var components = __webpack_require__(10);

	module.exports = {
	  flame: {
	    name: '火属性付与',
	    layers: [
	      {
	        component: components.Flame,
	        options: {},
	        zIndex: 500
	      }
	    ]
	  },
	  portrait: {
	    name: 'お通夜',
	    layers: [
	      {
	        component: components.Portrait,
	        options: {},
	        zIndex: 2800
	      },
	      {
	        component: components.Grayscale,
	        options: {},
	        zIndex: 2801
	      }
	    ]
	  },
	  heaven: {
	    name: 'ヘヴン状態',
	    layers: [
	      {
	        component: components.Heaven,
	        options: {
	          src: 'http://i.imgur.com/avY2MqD.png'
	        },
	        zIndex: 500
	      }
	    ]
	  },
	  forced: {
	    name: '強いられてる',
	    layers: [
	      {
	        component: components.Image,
	        options: {
	          src: 'http://i.imgur.com/BYdzlmS.png'
	        },
	        zIndex: 2700
	      }
	    ]
	  },
	  run: {
	    name: '疾走感',
	    layers: [
	      {
	        component: components.Image,
	        options: {
	          src: 'http://i.imgur.com/Fy9Ibw0.jpg'
	        },
	        zIndex: 500
	      }
	    ]
	  },
	  crystal: {
	    name: '魔水晶',
	    layers: [
	      {
	        id: 'text',
	        component: components.Crystal,
	        options: {},
	        zIndex: 2600
	      }
	    ]
	  },
	  sofmap: {
	    name: 'ソフ○ップ',
	    layers: [
	      {
	        component: components.Image,
	        options: {
	          src: 'http://i.imgur.com/bH6aXbz.png',
	          tiling: true
	        },
	        zIndex: 500
	      }
	    ]
	  },
	  gedou: {
	    name: '外道',
	    layers: [
	      {
	        id: 'bg',
	        component: components.Image,
	        options: {
	          src: 'http://i.imgur.com/th8OtsE.png'
	        },
	        zIndex: 500
	      },
	      {
	        id: 'text',
	        component: components.Gedou,
	        options: {},
	        zIndex: 2400
	      }
	    ]
	  },
	  gameover: {
	    name: 'ゲームオーバー',
	    layers: [
	      {
	        id: 'text',
	        component: components.Gameover,
	        options: {},
	        zIndex: 2400
	      }
	    ]
	  },
	  ad: {
	    name: 'DMM広告',
	    layers: [
	      {
	        id: 'bg',
	        component: components.Ad,
	        options: {
	          src: 'http://i.imgur.com/2SAQBCg.png'
	        },
	        zIndex: 2600
	      }
	    ]
	  }
	};


/***/ },
/* 13 */,
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = [
		{
			"id": "ahoge",
			"name": "アホ毛キャリーさん",
			"bg": "http://i.imgur.com/QlAiMTb.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 135,
				"top": 15,
				"slope": 18,
				"fontSize": 46,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/HkcGfBA.png",
			"author": "248年目>>586"
		},
		{
			"id": "normal",
			"name": "凛々しいキャリーさん",
			"bg": "http://i.imgur.com/QbGm3OB.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 0,
				"top": 130,
				"slope": 352,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/oV5chUa.png",
			"author": "248年目>>586"
		},
		{
			"id": "shobon",
			"name": "ショボーンキャリーさん",
			"bg": "http://i.imgur.com/vNDgmFg.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 0,
				"top": 130,
				"slope": 352,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/f58R9a3.png",
			"author": "248年目>>586"
		},
		{
			"id": "dark",
			"name": "ダークキャリーさん",
			"bg": "http://i.imgur.com/m9CkVOn.png",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 0,
				"top": 130,
				"slope": 352,
				"fontSize": 52,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/N1RwnhU.png"
		},
		{
			"id": "standing",
			"name": "ここに看板を立てるキャリーさん",
			"bg": "http://i.imgur.com/94fxVCs.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 40,
				"top": 270,
				"slope": 352,
				"fontSize": 50,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/331HcrC.png",
			"author": "285年目>>894"
		},
		{
			"id": "cavalry",
			"name": "騎馬戦キャリーさん's",
			"bg": "http://i.imgur.com/VwUogfj.png",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 80,
				"top": 170,
				"slope": 352,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/nKQIkw3.png",
			"author": "285年目>>894"
		},
		{
			"id": "vampire",
			"name": "ヴァンパイアキャリーさん",
			"bg": "http://i.imgur.com/0e7H2On.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 0,
				"top": 130,
				"slope": 352,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/dn92Y2d.png"
		},
		{
			"id": "curry",
			"name": "カリーさん",
			"bg": "http://i.imgur.com/2k5qjnn.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 40,
				"top": 60,
				"slope": 352,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/6YIzaCn.png",
			"author": "初出情報募集"
		},
		{
			"id": "riding",
			"name": "騎乗キャリーさん",
			"bg": "http://i.imgur.com/GWWWzfL.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 0,
				"top": 110,
				"slope": 352,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/HxAUFAP.png",
			"author": "285年目>>894"
		},
		{
			"id": "glass",
			"name": "眼鏡キャリーさん",
			"bg": "http://i.imgur.com/W76IvFD.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 0,
				"top": 130,
				"slope": 352,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/lasOfQB.png"
		},
		{
			"id": "phalanx",
			"name": "ファランクスキャリーさん",
			"bg": "http://i.imgur.com/AsOQWxb.png",
			"scale": 0.5,
			"board": {
				"width": 260,
				"height": 700,
				"left": 380,
				"top": 190,
				"slope": 358,
				"fontSize": 50,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/pD8nfCp.png",
			"author": "300年目>>235"
		},
		{
			"id": "pocha",
			"name": "ぽっちゃりキャリーさん",
			"bg": "http://i.imgur.com/yN46a9Q.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 100,
				"top": 110,
				"slope": 352,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/Fjle13A.png",
			"author": "300年目>>235"
		},
		{
			"id": "otsu",
			"name": "顧客が求めていた本当のキャリーさん",
			"bg": "http://i.imgur.com/cth1FaQ.jpeg",
			"scale": 1,
			"board": {
				"width": 300,
				"height": 350,
				"left": 310,
				"top": 120,
				"slope": 8,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/OLamu3X.jpg",
			"author": "344年目>>25"
		},
		{
			"id": "high",
			"name": "テンション上がってきたキャリーさん",
			"bg": "http://i.imgur.com/dXuB8ec.jpg",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 265,
				"top": 20,
				"slope": 18,
				"fontSize": 46,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/6gtAjh4.jpg"
		},
		{
			"id": "iinoyo",
			"name": "お誘いキャリーさん",
			"bg": "http://i.imgur.com/xYxMci2.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 105,
				"top": 238,
				"slope": 347,
				"fontSize": 32,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/G8c0I5c.png",
			"author": "366年目>>671"
		},
		{
			"id": "room",
			"name": "キャリーさん with ユリナちゃん",
			"bg": "http://i.imgur.com/TzjQSRr.jpg",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 40,
				"top": 220,
				"slope": 352,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/vkf5ZiD.jpg",
			"author": "396年目>>536"
		},
		{
			"id": "bench",
			"name": "ベンチフォーマーキャリーさん",
			"bg": "http://i.imgur.com/MGU1Y2w.jpg",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 0,
				"top": 180,
				"slope": 352,
				"fontSize": 32,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/stZemNp.jpg",
			"author": "431年目>>954"
		},
		{
			"id": "hp360",
			"name": "キャリーさん with テティスちゃん",
			"bg": "http://i.imgur.com/Sl22LdN.jpg",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 15,
				"top": 90,
				"slope": 0,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/UYAD50i.jpg",
			"author": "396年目>>536"
		},
		{
			"id": "sybilla",
			"name": "ベンチフォームしてないシビラちゃん",
			"bg": "http://i.imgur.com/UtY4J83.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 315,
				"top": -65,
				"slope": 19,
				"fontSize": 50,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/DJEPSsk.png",
			"author": "488年目>>13"
		},
		{
			"id": "banditcarry",
			"name": "山賊頭キャリーさん",
			"bg": "http://i.imgur.com/gyqsKnU.jpg",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 490,
				"top": 70,
				"slope": 0,
				"fontSize": 32,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/qBAHCSF.jpg",
			"author": "502年目>>778"
		},
		{
			"id": "sitcarry",
			"name": "体育座りキャリーさん",
			"bg": "http://i.imgur.com/j8lnCAz.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 30,
				"top": 45,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/RWYv4h7.png",
			"author": "517年目>>621"
		},
		{
			"id": "sityurina",
			"name": "体育座りユリナちゃん",
			"bg": "http://i.imgur.com/zlwACB4.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 30,
				"top": 45,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/kO3AWB9.png",
			"author": "517年目>>621"
		},
		{
			"id": "sitren",
			"name": "体育座りレンさん",
			"bg": "http://i.imgur.com/bkkrdWs.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 30,
				"top": 45,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/KWcSzcV.png",
			"author": "517年目>>621"
		},
		{
			"id": "potetiren",
			"name": "ポテチレンさん",
			"bg": "http://i.imgur.com/OJ1kP1A.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 110,
				"top": 42,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/YtPXAu5.png",
			"author": "517年目>>775"
		},
		{
			"id": "potetiren2",
			"name": "焦るポテチレンさん",
			"bg": "http://i.imgur.com/Qb8g52g.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 80,
				"top": 35,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/woL0nFc.png",
			"author": "518年目>>413"
		},
		{
			"id": "gitomeren",
			"name": "ジト目レンさん",
			"bg": "http://i.imgur.com/qQrpV0T.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 55,
				"top": 20,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/M9EAcXF.png",
			"author": "519年目>>149"
		},
		{
			"id": "okosybilla",
			"name": "激おこシビラちゃん",
			"bg": "http://i.imgur.com/YhwEakD.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 250,
				"top": 46,
				"slope": 0,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/yxMLWeA.png",
			"author": "529年目>>66"
		},
		{
			"id": "learningren",
			"name": "お勉強中レンさん",
			"bg": "http://i.imgur.com/jJrHMAk.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 20,
				"top": 20,
				"slope": 0,
				"fontSize": 32,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/z8lewGF.png",
			"author": "538年目>>584"
		},
		{
			"id": "drunkmonica",
			"name": "酔いどれモニカちゃん",
			"bg": "http://i.imgur.com/zquRz5T.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 195,
				"top": 80,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/RpU6RLh.png",
			"author": "542年目>>314"
		},
		{
			"id": "sitelaine",
			"name": "体育座りエレインちゃん",
			"bg": "http://i.imgur.com/lKkkcld.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 35,
				"top": 50,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/yb52dcZ.png",
			"author": "542年目>>314"
		},
		{
			"id": "ropeloana",
			"name": "何かを期待しているロアナさん",
			"bg": "http://i.imgur.com/IfnDGr5.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 320,
				"top": 50,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal",
				"shadow": "#ffffff",
				"shadowAlpha": 0.8
			},
			"thumbnail": "http://i.imgur.com/UmEowyp.png",
			"author": "549年目>>389"
		},
		{
			"id": "pokkyodette",
			"name": "ポッキーオデットさん",
			"bg": "http://i.imgur.com/dqnnVPv.png",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 250,
				"top": 45,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/rB8KWvr.png",
			"author": "549年目>>565"
		},
		{
			"id": "otsussa",
			"name": "乙ッサだ！",
			"bg": "http://i.imgur.com/cSvRyxb.jpg",
			"width": 900,
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 500,
				"top": 50,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/7foAb2C.jpg",
			"author": "300年目>>235"
		},
		{
			"id": "hungrycipria",
			"name": "腹ペコシプリアさん",
			"bg": "http://i.imgur.com/SQa37oN.png",
			"top": 200,
			"left": 120,
			"width": 400,
			"height": 600,
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 40,
				"top": 40,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/BzXTyBh.png",
			"author": "553年目>>51"
		},
		{
			"id": "grapedorca",
			"name": "グレープ味なドルカママ",
			"bg": "http://i.imgur.com/il3cosv.png",
			"top": 200,
			"left": 120,
			"width": 400,
			"height": 600,
			"scale": 1,
			"board": {
				"width": 200,
				"height": 400,
				"left": 10,
				"top": 30,
				"slope": 12,
				"fontSize": 32,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/3qdvEhE.png",
			"author": "初出情報募集"
		},
		{
			"id": "nnncarry",
			"name": "んんｗｗキャリーさん",
			"bg": "http://i.imgur.com/1SHeSd3.jpg",
			"scale": 1,
			"board": {
				"width": 300,
				"height": 350,
				"left": 225,
				"top": 90,
				"slope": 8,
				"fontSize": 30,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/wnQqKGk.jpg",
			"author": "565年目>>302"
		},
		{
			"id": "yurinabed",
			"name": "wktkユリナちゃん",
			"bg": "http://i.imgur.com/PqgIJmJ.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 30,
				"top": 30,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal",
				"shadow": "#ffffff",
				"shadowAlpha": 0.8
			},
			"thumbnail": "http://i.imgur.com/Abiqx4i.png",
			"author": "609年目>>951"
		},
		{
			"id": "teasybilla",
			"name": "ティータイムシビラちゃん",
			"bg": "http://i.imgur.com/xxLX3ip.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 150,
				"top": 65,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/I3qi1K3.png",
			"author": "565年目>>619"
		},
		{
			"id": "carrybela30",
			"name": "30CCキャリーさん＆ベラちゃん",
			"bg": "http://i.imgur.com/XYlYfiO.png",
			"top": 200,
			"height": 700,
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 80,
				"top": 60,
				"slope": 0,
				"fontSize": 50,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/9StdDcD.png",
			"author": "587年目>>134"
		},
		{
			"id": "escapecipria",
			"name": "逃げるシプリアさん",
			"bg": "http://i.imgur.com/abpGmTn.png",
			"top": 100,
			"height": 500,
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 20,
				"top": 60,
				"slope": 355,
				"fontSize": 46,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/37cZKLv.png",
			"author": "620年目>>557"
		},
		{
			"id": "boarddeena",
			"name": "看板ディーナちゃん",
			"bg": "http://i.imgur.com/NV51nlQ.png",
			"scale": 1,
			"board": {
				"width": 300,
				"height": 350,
				"left": -10,
				"top": 200,
				"slope": 342,
				"fontSize": 46,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/QibWHwL.png",
			"author": "620年目>>681"
		},
		{
			"id": "darkmikoto",
			"name": "ダークミコトちゃん",
			"bg": "http://i.imgur.com/ZScNYxK.png",
			"scale": 0.75,
			"board": {
				"width": 300,
				"height": 350,
				"left": 15,
				"top": 320,
				"slope": 0,
				"fontSize": 46,
				"dir": "horizontal",
				"shadow": "#ffffff",
				"shadowAlpha": 0.2
			},
			"thumbnail": "http://i.imgur.com/xFuXfvp.png",
			"author": "622年目>>353"
		},
		{
			"id": "realizesprit",
			"name": "気付いたヴィクトワールさん",
			"bg": "http://i.imgur.com/ny18Ut4.png",
			"scale": 1,
			"width": 700,
			"board": {
				"width": 300,
				"height": 350,
				"left": 300,
				"top": 100,
				"slope": 0,
				"fontSize": 46,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/6Z00w03.png",
			"author": "632年目>>238",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1402235820/238"
		},
		{
			"id": "cryada",
			"name": "涙目エイダちゃん",
			"bg": "http://i.imgur.com/vlsS5Y2.jpg",
			"scale": 2,
			"board": {
				"width": 300,
				"height": 350,
				"left": 10,
				"top": 10,
				"slope": 0,
				"fontSize": 46,
				"dir": "horizontal",
				"shadow": "#ffffff",
				"shadowAlpha": 1
			},
			"thumbnail": "http://i.imgur.com/5ueQp1W.jpg",
			"author": "636年目>>731",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1402309037/731"
		},
		{
			"id": "boardvalerie",
			"name": "看板ヴァレリーさん",
			"bg": "http://i.imgur.com/SNfkwe2.jpg",
			"scale": 0.5,
			"board": {
				"width": 300,
				"height": 350,
				"left": 5,
				"top": 170,
				"slope": 349,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/dUVuG20.jpg",
			"author": "637年目>>153",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1402315097/153"
		},
		{
			"id": "sitsybilla",
			"name": "体育座りシビラちゃん",
			"bg": "http://i.imgur.com/20JsNaA.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 100,
				"top": 48,
				"slope": 0,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/JsggRBC.png",
			"author": "654年目>>22"
		},
		{
			"id": "griefelaine",
			"name": "涙目エレインちゃん",
			"bg": "http://i.imgur.com/lV01Ysv.png",
			"scale": 1.25,
			"board": {
				"width": 750,
				"height": 350,
				"left": 30,
				"top": 50,
				"slope": 0,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/RnNUO6U.png",
			"author": "662年目>>867"
		},
		{
			"id": "hien",
			"name": "イケメンヒエン殿",
			"bg": "http://i.imgur.com/1ZWf5uZ.jpg",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 180,
				"top": -100,
				"slope": 13,
				"fontSize": 48,
				"dir": "vertical",
				"shadow": "#ff0000"
			},
			"thumbnail": "http://i.imgur.com/ilFWKm3.jpg",
			"author": "699年目>>662",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1402933313/662"
		},
		{
			"id": "shrimpfigneria",
			"name": "フィグネリャーちゃん",
			"bg": "http://i.imgur.com/ErUFWm8.png",
			"height": 800,
			"top": 200,
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 200,
				"top": 30,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal",
				"shadow": "#000000"
			},
			"thumbnail": "http://i.imgur.com/wqbdJG3.png",
			"author": "716年目>>306",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1403185132/306"
		},
		{
			"id": "gmonika",
			"name": "△モニカちゃん",
			"bg": "http://i.imgur.com/qLiMIpw.png",
			"width": 460,
			"scale": 1.5,
			"board": {
				"width": 350,
				"height": 350,
				"left": 50,
				"top": 30,
				"slope": 0,
				"fontSize": 42,
				"dir": "vertical",
				"shadow": "#ffffff"
			},
			"thumbnail": "http://i.imgur.com/tSYKf9Q.png",
			"author": "初出情報募集"
		},
		{
			"id": "otsusaki",
			"name": "ポニテ乙サキちゃん",
			"bg": "http://i.imgur.com/UUmjIKw.png",
			"scale": 1,
			"board": {
				"width": 350,
				"height": 350,
				"left": 20,
				"top": 90,
				"slope": 0,
				"fontSize": 32,
				"dir": "horizontal",
				"shadow": "#ffffff"
			},
			"thumbnail": "http://i.imgur.com/0skpC7l.png",
			"author": "716年目>>928",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1403185132/928"
		},
		{
			"id": "darechloe",
			"name": "だれてるクロエちゃん",
			"bg": "http://i.imgur.com/Ukc1gX9.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 140,
				"top": 40,
				"slope": 0,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/VGCD3h9.png",
			"author": "774年目>>642"
		},
		{
			"id": "saku2chloe",
			"name": "さくさくクロエちゃん",
			"bg": "http://i.imgur.com/1pAwuTA.jpg",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 160,
				"top": 65,
				"slope": 0,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/17onnZi.jpg",
			"author": "792年目>>697",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1404304344/697"
		},
		{
			"id": "omeganoel",
			"name": "オメガノエルちゃん",
			"bg": "http://i.imgur.com/qb5yYsW.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 270,
				"top": 80,
				"slope": 0,
				"fontSize": 32,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/c7n46mP.png",
			"author": "808年目>>823",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1404572799/823"
		},
		{
			"id": "3dren",
			"name": "3Dレンさん",
			"bg": "http://i.imgur.com/5e1d86Y.png",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 90,
				"top": 36,
				"slope": 0,
				"fontSize": 48,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/dr3qEVf.png",
			"author": "850年目>>355",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1405463648/355"
		},
		{
			"id": "sitanya",
			"name": "体育座りアーニャちゃん",
			"bg": "http://i.imgur.com/j1QLuSB.png",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 65,
				"top": 40,
				"slope": 0,
				"fontSize": 44,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/cSsKuBN.png",
			"author": "872年目>>776",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1405866492/776"
		},
		{
			"id": "thinkthemis",
			"name": "第八代将軍テミスさん",
			"bg": "http://i.imgur.com/L7uHAZN.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 30,
				"top": 10,
				"slope": 0,
				"fontSize": 60,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/JJUdiQN.png",
			"author": "892年目>>821",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1406202651/821"
		},
		{
			"id": "gorodorothy",
			"name": "ごろごろドロシーちゃん",
			"bg": "http://i.imgur.com/pKLub3P.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 220,
				"top": 28,
				"slope": 0,
				"fontSize": 40,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/MMkWzzZ.png",
			"author": "912年目>>249",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1406476203/249"
		},
		{
			"id": "2411carry",
			"name": "王子軍のアイドルキャリーさんだよ☆",
			"bg": "http://i.imgur.com/WsJ15AF.png",
			"scale": 1,
			"width": 697,
			"height": 583,
			"left": 150,
			"top": 150,
			"board": {
				"width": 190,
				"height": 350,
				"left": 0,
				"top": 10,
				"slope": 6,
				"fontSize": 40,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/3zrcOnk.png",
			"author": "918年目>>478",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1406563201/478"
		},
		{
			"id": "grcarry3",
			"name": "GRキャリー3",
			"bg": "http://i.imgur.com/CrC8gvo.png",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 20,
				"top": 100,
				"slope": 344,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/XAc2Q3H.png",
			"author": "923年目>>467",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1406647365/467"
		},
		{
			"id": "teacanon",
			"name": "ティータイム砲術士ちゃん",
			"bg": "http://i.imgur.com/ivOVQoC.png",
			"scale": 1,
			"width": 650,
			"left": 150,
			"board": {
				"width": 220,
				"height": 350,
				"left": 20,
				"top": 40,
				"slope": 0,
				"fontSize": 38,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/jj0ckH0.png",
			"author": "926年目>>617",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1406703025/617"
		},
		{
			"id": "hienkoji",
			"name": "ヒエン＆コジュウロウ四次元殺法コンビ",
			"bg": "http://i.imgur.com/OyxkYnI.png",
			"scale": 1,
			"board": {
				"width": 750,
				"height": 350,
				"left": 50,
				"top": 25,
				"slope": 0,
				"fontSize": 32,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/1NiryPV.png",
			"author": "926年目>>829",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1406703025/829"
		},
		{
			"id": "iwaimikoto",
			"name": "祝いのミコトちゃん",
			"bg": "http://i.imgur.com/zzEZnCH.png",
			"scale": 0.75,
			"board": {
				"width": 0,
				"height": 0,
				"left": 1160,
				"top": 20,
				"slope": 0,
				"fontSize": 40,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/aGlVz0I.png",
			"author": "1000年目>>54",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1408002932/54"
		},
		{
			"id": "gachivincent",
			"name": "ガチヴィンセントさん",
			"bg": "http://i.imgur.com/vcgU6mc.jpg",
			"scale": 0.5,
			"board": {
				"width": 220,
				"height": 350,
				"left": 160,
				"top": 40,
				"slope": 0,
				"fontSize": 44,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/pjaowGF.jpg",
			"author": "1000年目>>492",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1408002932/492"
		},
		{
			"id": "yuruvincent",
			"name": "ゆるキャラヴィンセントさん",
			"bg": "http://i.imgur.com/NXLPhr7.png",
			"scale": 1,
			"board": {
				"width": 220,
				"height": 350,
				"left": 0,
				"top": 0,
				"slope": 0,
				"fontSize": 36,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/wbps5pe.png",
			"author": "1000年目>>977",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1408002932/977"
		},
		{
			"id": "runhien",
			"name": "全力疾走ヒエン殿",
			"bg": "http://i.imgur.com/PYfDJW5.jpg",
			"scale": 0.5,
			"board": {
				"width": 220,
				"height": 350,
				"left": 740,
				"top": 400,
				"slope": 350,
				"fontSize": 48,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/KTPB4lW.jpg",
			"author": "1001年目>>57",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1408006812/57"
		},
		{
			"id": "pasiriberra",
			"name": "パシるベラちゃん",
			"bg": "http://i.imgur.com/lHJItKb.png",
			"scale": 0.5,
			"board": {
				"width": 220,
				"height": 350,
				"left": 10,
				"top": 40,
				"slope": 0,
				"fontSize": 42,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/3dqnr5l.png",
			"author": "1164年目>>664",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1411136043/664"
		},
		{
			"id": "ritahide",
			"name": "忍んでるリタさん",
			"bg": "https://i.imgur.com/aBesypo.png",
			"scale": 1.5,
			"board": {
				"width": 220,
				"height": 350,
				"left": 230,
				"top": 280,
				"slope": 0,
				"fontSize": 28,
				"dir": "vertical"
			},
			"thumbnail": "https://i.imgur.com/dXQQoYL.png",
			"author": "1292年目>>710",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1412817075/710"
		},
		{
			"id": "otonacarry",
			"name": "おとなのキャリーさん",
			"bg": "http://i.imgur.com/nOict0d.png",
			"scale": 0.66,
			"board": {
				"width": 750,
				"height": 350,
				"left": 120,
				"top": 120,
				"slope": 0,
				"fontSize": 48,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/L3dJfvk.png",
			"author": "1390年目>>266",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1414082199/266"
		},
		{
			"id": "nanamecarry",
			"name": "斜めキャリーさん",
			"bg": "http://i.imgur.com/2TUTjcP.png",
			"scale": 0.5,
			"board": {
				"width": 750,
				"height": 350,
				"left": 610,
				"top": 20,
				"slope": 8,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/xXeJFIj.png",
			"author": "1403年目>>37",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1414251670/37"
		},
		{
			"id": "awakedcarry2",
			"name": "覚醒キャリーさん",
			"bg": "http://i.imgur.com/uDot36b.png",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 300,
				"top": 40,
				"slope": 0,
				"fontSize": 42,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/yBj47NR.png",
			"author": "1403年目>>37",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1414251670/37"
		},
		{
			"id": "frontcarry",
			"name": "正面キャリーさん",
			"bg": "http://i.imgur.com/NM22jUc.png",
			"scale": 0.75,
			"board": {
				"width": 750,
				"height": 350,
				"left": 220,
				"top": 620,
				"slope": 0,
				"fontSize": 38,
				"dir": "horizontal"
			},
			"thumbnail": "http://i.imgur.com/tO4gkrH.png",
			"author": "1403年目>>37",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1414251670/37"
		},
		{
			"id": "jitomecarry",
			"name": "ジト目キャリーさん",
			"bg": "http://i.imgur.com/DvSLgXa.png",
			"scale": 0.75,
			"board": {
				"width": 220,
				"height": 350,
				"left": 50,
				"top": 120,
				"slope": 0,
				"fontSize": 52,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/xcZPGaD.png",
			"author": "1420年目>>294",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1414518546/294"
		},
		{
			"id": "madajerome",
			"name": "まだあわてるようなコストじゃないジェロームさん",
			"bg": "http://i.imgur.com/dQkhvQd.png",
			"scale": 1.25,
			"board": {
				"width": 220,
				"height": 350,
				"left": 350,
				"top": 5,
				"slope": 0,
				"fontSize": 32,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/TOn1iZP.png",
			"author": "1426年目>>829",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1414616556/829"
		},
		{
			"id": "kabemikoto",
			"name": "またミコトの話してる…",
			"bg": "http://i.imgur.com/mjm6ClM.png",
			"scale": 1,
			"board": {
				"width": 220,
				"height": 350,
				"left": 380,
				"top": 35,
				"slope": 0,
				"fontSize": 32,
				"dir": "vertical"
			},
			"thumbnail": "http://i.imgur.com/xUCGy8X.png",
			"author": "1699年目>>776",
			"homepage": "http://kilauea.bbspink.com/test/read.cgi/mobpink/1417616164/776"
		}
	]

/***/ }
]);