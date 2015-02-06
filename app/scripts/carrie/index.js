'use strict';

require('jquery-minicolors');
require('ionrangeslider');

var loadImage  = require('./loadimage');
var components = require('./components');
var commands   = require('./commands');
var effects    = require('./effects');

var templates = require('json!./db/templates.json')
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
    backgroundColor: $('input[name=backgroundColor]').minicolors('rgbaString'),
    foregroundColor: $('input[name=foregroundColor]').minicolors('rgbaString'),
    fontSize       : $('select[name=fontSize]').val(),
    fontFamily     : $('select[name=fontFamily]').val(),
    outline        : !!parseInt($('input[name=outline]:checked').val()),
    outlineColor   : $('input[name=outlineColor]').minicolors('rgbaString'),
    shadow         : !!parseInt($('input[name=shadow]:checked').val()),
    shadowColor    : $('input[name=shadowColor]').minicolors('rgbaString'),
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
    '&l=' + encodeURIComponent(options.outline ? 1 : 0) +
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

  defaults.e.split('').forEach(function (id) {
    if (id in effects) {
      $('[name=effect]').find('[value=' + id + ']').prop('checked', true);
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
