webpackJsonp([4],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';

	var icons = __webpack_require__(15);
	var iconSprite = __webpack_require__(16);

	var maxTimeLimit = 60 * 1000;
	var tileContainerWidth;
	var tileContainerHeight;
	var tileMargin;
	var tileImages;
	var originTime;
	var elapsedTime;
	var remainsTime;
	var level;
	var score;
	var correctTileId;
	var $game;
	var $tileContainer;
	var $tileTemplate;
	var $score;
	var $objective;
	var $timerBar;
	var timer;
	var iconWidth = 128, iconHeight = 128;
	var state;

	function play() {
	  if (timer) {
	    clearInterval(timer);
	  }

	  state = 'play';
	  level = 0;
	  score = 0;
	  originTime = (new Date()).getTime();
	  elapsedTime = 0;
	  remainsTime = maxTimeLimit;

	  updateScore(score);
	  nextLevel();

	  timer = setInterval(function () {
	    update();
	  }, 200);
	}

	function update() {
	  var now = (new Date()).getTime();
	  var delta = now - originTime;
	  elapsedTime += delta;
	  remainsTime = Math.max(remainsTime - delta, 0);
	  originTime = now;

	  var width = (remainsTime * 100 / maxTimeLimit) + '%';
	  var hue = 240 * remainsTime / maxTimeLimit;

	  $timerBar.css({
	    width: width,
	    backgroundColor: 'hsl(' + hue + ', 84%, 50%)'
	  });

	  if (remainsTime === 0) {
	    clearInterval(timer);

	    gameover();
	  }
	}

	function gameover() {
	  state = 'result';

	  $game.find('[data-onmitsu-object="tile"]')
	    .addClass('disabled')
	    .each(function () {
	      var $tile = $(this);
	      console.log($tile.data('tileId'));
	      if ($tile.data('tileId') === correctTileId) {
	        $tile.addClass('correct');
	      }
	    });
	}

	function verify(answer) {
	  return answer == correctTileId;
	}

	function increaseScore() {
	  score += 100;

	  return 100;
	}

	function nextLevel() {
	  var recovery = Math.min(level * 100, 5000);

	  remainsTime = Math.min(remainsTime + recovery, maxTimeLimit);
	  level++;

	  updateScore(score);
	  updateStage(level);

	  return recovery;
	}

	function updateScore(score) {
	  $score.text(score.toLocaleString());
	}

	function createStageTiles(num, correctTileId) {
	  var ids = [];

	  for (var i = 0; i < num; i++) {
	    var id = Math.floor(Math.random() * tileImages.length);

	    if (id === correctTileId) {
	      i--;
	      continue;
	    }

	    ids.push(id);
	  }

	  ids[Math.floor(Math.random() * num)] = correctTileId;

	  return ids;
	}

	function updateStage(level) {
	  var $olds = $tileContainer.find('[data-onmitsu-object="tile"]')
	    .css('z-index', 1)
	    .addClass('fadeout');

	  setTimeout(function () {
	    $olds.remove();
	  }, 450);

	  var div = Math.min(Math.ceil(level / 3) + 1, 16);
	  var tileNum = div * div;
	  var margin = tileMargin * (div + 1);
	  var tileWidth = (tileContainerWidth - margin) / div;
	  var tileHeight = (tileContainerHeight - margin) / div;

	  correctTileId = Math.floor(Math.random() * tileImages.length);
	  var tileIds = createStageTiles(tileNum, correctTileId);

	  var $objectiveImage = $(tileImages[correctTileId])
	    .clone()
	    .addClass('fadein')
	    .css({
	      width: '64px',
	      height: '64px'
	    });

	  $objective.empty().append($objectiveImage);

	  tileIds.forEach(function (tileId, i) {
	    var tile = tileImages[tileId];
	    var x = i % div;
	    var y = Math.floor(i / div);
	    var left = (tileWidth + tileMargin) * x + tileMargin;
	    var top = (tileHeight + tileMargin) * y + tileMargin;

	    $tileTemplate.clone()
	      .css({
	        width: tileWidth + 'px',
	        height: tileHeight + 'px',
	        left: left + 'px',
	        top: top + 'px'
	      })
	      .data('tileId',tileId)
	      .append($(tile).clone())
	      .appendTo($tileContainer);
	  });
	}

	function createTileTemplate() {
	  var $tpl = $('<div />')
	    .attr('class', 'onmitsu-tile')
	    .attr('data-onmitsu-object', 'tile')
	    .css('z-index', 100);

	  return $tpl;
	}

	function createTileImages(icons) {
	  var sprite = document.createElement('img');
	  sprite.style.display = 'none';
	  sprite.src = iconSprite;
	  document.documentElement.appendChild(sprite);

	  return icons.map(function (icon) {
	    var work = document.createElement('canvas');
	    work.width = iconWidth;
	    work.height = iconHeight;

	    var workCtx = work.getContext('2d');
	    workCtx.imageSmoothingEnabled = false;
	    workCtx.drawImage(sprite,
	      icon.left, icon.top, icon.width, icon.height,
	      0, 0, iconWidth, iconHeight
	    );

	    var img = document.createElement('img');
	    img.src = work.toDataURL();

	    return img;
	  });
	}

	function changeScene(scene, done) {
	  $('[data-onmitsu-scene]')
	    .addClass('scene-hidden')
	    .hide();

	  $('[data-onmitsu-scene=' + scene + ']')
	    .addClass('scene-visible')
	    .show();

	  setTimeout(done, 0);
	}

	function showScoreLabel($trigger, time) {
	  var $label = $('<span class="onmitsu-getted-score"></span>')
	    .text('+' + (Math.floor(time / 100) / 10).toLocaleString() + '秒')
	    .appendTo($tileContainer);

	  var pos = $trigger.position();
	  var left = pos.left + ($trigger.width() - ($label.text().length * 16)) / 2;
	  var top = pos.top;

	  $label.css({
	      position: 'absolute',
	      left: left + 'px',
	      top: top + 'px'
	    })
	    .delay(900)
	    .queue(function (next) {
	      $(this).remove();
	      next();
	    });
	}

	function initialize($host) {
	  $tileTemplate = createTileTemplate();
	  tileImages = createTileImages(icons);

	  $game = $host;

	  $tileContainer = $game.find('[data-onmitsu-object="tile-container"]');
	  $score = $game.find('[data-onmitsu-object="score"]');
	  $objective = $game.find('[data-onmitsu-object="objective"]');
	  $timerBar = $game.find('[data-onmitsu-object="timer-bar"]');

	  tileContainerWidth = $tileContainer.width();
	  tileContainerHeight = $tileContainer.height();

	  var $sample = $game.find('[data-onmitsu-object="tile"]').first();
	  tileMargin = (tileContainerWidth - $sample.width()) / 2;

	  $game
	    .on('click', 'button[name=play]', function (e) {
	      e.preventDefault();

	      changeScene('main', function () {
	        play();
	      });
	    })
	    .on('click', '[data-onmitsu-object="tile"]', function (e) {
	      if (state !== 'play') {
	        return;
	      }

	      e.preventDefault();

	      var $tile = $(this);
	      var answer = $tile.data('tileId');

	      if (verify(answer)) {
	        increaseScore();
	        var time = nextLevel();
	        showScoreLabel($tile, time);
	      }
	    });

	  changeScene('menu');
	}

	$(function () {
	  initialize($('#onmitsu'));
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ },

/***/ 15:
/***/ function(module, exports, __webpack_require__) {

	module.exports = [
		{
			"name": "一般兵A",
			"left": 0,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.9666666666666669,
			"saturation": 0.032258064516129094,
			"lightness": 0.696078431372549
		},
		{
			"name": "一般兵【弓】A",
			"left": 32,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.8333333333333334,
			"saturation": 0.00621118012422358,
			"lightness": 0.6843137254901961
		},
		{
			"name": "一般兵【弓】B",
			"left": 48,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.09722222222222215,
			"saturation": 0.0750000000000001,
			"lightness": 0.6862745098039216
		},
		{
			"name": "一般兵B",
			"left": 16,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.14285714285714296,
			"saturation": 0.05263157894736845,
			"lightness": 0.7392156862745098
		},
		{
			"name": "一般兵【重装】A",
			"left": 64,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.05555555555555555,
			"saturation": 0.017543859649122744,
			"lightness": 0.6647058823529411
		},
		{
			"name": "一般兵【重装】B",
			"left": 80,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.01986754966887429,
			"lightness": 0.703921568627451
		},
		{
			"name": "一般兵【魔法】A",
			"left": 96,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.04545454545454534,
			"saturation": 0.05418719211822654,
			"lightness": 0.6019607843137255
		},
		{
			"name": "一般兵【魔法】B",
			"left": 112,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.10000000000000003,
			"saturation": 0.1282051282051282,
			"lightness": 0.6176470588235294
		},
		{
			"name": "下忍",
			"left": 128,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.8000000000000002,
			"saturation": 0.027932960893854802,
			"lightness": 0.6490196078431372
		},
		{
			"name": "山賊　手下A",
			"left": 144,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.2828282828282828,
			"saturation": 0.17647058823529407,
			"lightness": 0.6333333333333333
		},
		{
			"name": "山賊　手下B",
			"left": 160,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.08333333333333343,
			"saturation": 0.13207547169811315,
			"lightness": 0.5843137254901961
		},
		{
			"name": "海賊手下",
			"left": 176,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.11656441717791405,
			"lightness": 0.6803921568627451
		},
		{
			"name": "砂漠兵士",
			"left": 192,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.08333333333333333,
			"saturation": 0.1,
			"lightness": 0.6862745098039216
		},
		{
			"name": "足軽",
			"left": 208,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.027624309392265248,
			"lightness": 0.6450980392156862
		},
		{
			"name": "アトラ",
			"left": 224,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.14166666666666675,
			"saturation": 0.12345679012345671,
			"lightness": 0.6823529411764706
		},
		{
			"name": "アルス",
			"left": 240,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.05833333333333332,
			"saturation": 0.13157894736842118,
			"lightness": 0.7019607843137255
		},
		{
			"name": "ウィルフレッド",
			"left": 256,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.11111111111111101,
			"saturation": 0.10344827586206898,
			"lightness": 0.7156862745098039
		},
		{
			"name": "ハシム",
			"left": 272,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.06349206349206346,
			"saturation": 0.1288343558282209,
			"lightness": 0.680392156862745
		},
		{
			"name": "ハヤテ",
			"left": 288,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.9666666666666667,
			"saturation": 0.02857142857142847,
			"lightness": 0.6568627450980392
		},
		{
			"name": "バーガン",
			"left": 304,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.08333333333333343,
			"saturation": 0.1363636363636363,
			"lightness": 0.6549019607843136
		},
		{
			"name": "ヘクター",
			"left": 320,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.777777777777778,
			"saturation": 0.04000000000000005,
			"lightness": 0.7058823529411765
		},
		{
			"name": "マウロ",
			"left": 336,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.02777777777777769,
			"saturation": 0.10465116279069762,
			"lightness": 0.6627450980392157
		},
		{
			"name": "ラセル",
			"left": 352,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.041666666666666664,
			"saturation": 0.015873015873015817,
			"lightness": 0.5058823529411764
		},
		{
			"name": "レオ",
			"left": 368,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.0641025641025642,
			"saturation": 0.08387096774193556,
			"lightness": 0.696078431372549
		},
		{
			"name": "ロイ",
			"left": 384,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.04861111111111113,
			"saturation": 0.1333333333333333,
			"lightness": 0.6470588235294117
		},
		{
			"name": "竜人戦士",
			"left": 400,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.15277777777777782,
			"saturation": 0.06060606060606054,
			"lightness": 0.611764705882353
		},
		{
			"name": "アサル",
			"left": 416,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.02173913043478253,
			"saturation": 0.12568306010928962,
			"lightness": 0.6411764705882352
		},
		{
			"name": "アリサ",
			"left": 432,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.1999999999999998,
			"saturation": 0.03030303030303036,
			"lightness": 0.676470588235294
		},
		{
			"name": "エレイン",
			"left": 448,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.061403508771929884,
			"saturation": 0.1347517730496453,
			"lightness": 0.7235294117647059
		},
		{
			"name": "カゲロウ",
			"left": 464,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.06666666666666672,
			"saturation": 0.10309278350515456,
			"lightness": 0.6196078431372549
		},
		{
			"name": "カリオペ",
			"left": 480,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.9583333333333333,
			"saturation": 0.12500000000000003,
			"lightness": 0.6235294117647059
		},
		{
			"name": "ガドラス",
			"left": 496,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.5666666666666664,
			"saturation": 0.0746268656716418,
			"lightness": 0.6058823529411764
		},
		{
			"name": "クリストファー",
			"left": 512,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.7820512820512822,
			"saturation": 0.08724832214765088,
			"lightness": 0.707843137254902
		},
		{
			"name": "クレイブ",
			"left": 528,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.07407407407407411,
			"saturation": 0.23076923076923067,
			"lightness": 0.6941176470588235
		},
		{
			"name": "グスタフ",
			"left": 544,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.08333333333333333,
			"saturation": 0.07407407407407415,
			"lightness": 0.6823529411764706
		},
		{
			"name": "サノスケ",
			"left": 560,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.9166666666666679,
			"saturation": 0.011904761904762032,
			"lightness": 0.6705882352941177
		},
		{
			"name": "ジョヴァンニ",
			"left": 576,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.04761904761904765,
			"saturation": 0.12727272727272732,
			"lightness": 0.676470588235294
		},
		{
			"name": "セシリー",
			"left": 592,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.02298850574712651,
			"saturation": 0.15183246073298434,
			"lightness": 0.6254901960784314
		},
		{
			"name": "ソーマ",
			"left": 608,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.0873015873015874,
			"saturation": 0.13907284768211925,
			"lightness": 0.7039215686274509
		},
		{
			"name": "ダニエラ",
			"left": 624,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.3055555555555557,
			"saturation": 0.03896103896103901,
			"lightness": 0.6980392156862745
		},
		{
			"name": "ダン",
			"left": 640,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.03124999999999989,
			"saturation": 0.1,
			"lightness": 0.6862745098039216
		},
		{
			"name": "ドルカ",
			"left": 656,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.8030303030303031,
			"saturation": 0.11458333333333322,
			"lightness": 0.6235294117647059
		},
		{
			"name": "ニエル",
			"left": 672,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.13953488372093031,
			"saturation": 0.2925170068027209,
			"lightness": 0.7117647058823529
		},
		{
			"name": "ネーニャ",
			"left": 688,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.9864864864864865,
			"saturation": 0.2587412587412586,
			"lightness": 0.7196078431372549
		},
		{
			"name": "バラッド",
			"left": 720,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.050000000000000024,
			"saturation": 0.1492537313432837,
			"lightness": 0.7372549019607844
		},
		{
			"name": "ハリッサ",
			"left": 704,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.07843137254901962,
			"saturation": 0.09497206703910613,
			"lightness": 0.6490196078431373
		},
		{
			"name": "パレス",
			"left": 736,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.7419354838709677,
			"saturation": 0.19018404907975464,
			"lightness": 0.6803921568627451
		},
		{
			"name": "パーシス",
			"left": 752,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.03846153846153852,
			"saturation": 0.15853658536585363,
			"lightness": 0.6784313725490196
		},
		{
			"name": "フィリス",
			"left": 768,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.6197916666666666,
			"saturation": 0.20779220779220775,
			"lightness": 0.6980392156862745
		},
		{
			"name": "フューネス",
			"left": 784,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.05376344086021511,
			"saturation": 0.13419913419913412,
			"lightness": 0.5470588235294117
		},
		{
			"name": "フーリ",
			"left": 800,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.7604166666666669,
			"saturation": 0.10526315789473682,
			"lightness": 0.7019607843137254
		},
		{
			"name": "ベルナール",
			"left": 816,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.08176100628930823,
			"saturation": 0.29608938547486036,
			"lightness": 0.6490196078431372
		},
		{
			"name": "ミーシャ",
			"left": 832,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.07812500000000001,
			"saturation": 0.1797752808988764,
			"lightness": 0.6509803921568628
		},
		{
			"name": "モーティマ",
			"left": 848,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.05555555555555555,
			"saturation": 0.14917127071823194,
			"lightness": 0.6450980392156862
		},
		{
			"name": "リカルド",
			"left": 864,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.11111111111111076,
			"saturation": 0.04390243902439023,
			"lightness": 0.5980392156862745
		},
		{
			"name": "レアン",
			"left": 880,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.050505050505050476,
			"saturation": 0.19298245614035084,
			"lightness": 0.6647058823529411
		},
		{
			"name": "ロザリー",
			"left": 896,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.1111111111111111,
			"saturation": 0.15151515151515144,
			"lightness": 0.611764705882353
		},
		{
			"name": "ローレン",
			"left": 912,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.15517241379310348,
			"saturation": 0.17365269461077837,
			"lightness": 0.6725490196078432
		},
		{
			"name": "ヴァレリー",
			"left": 928,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.10000000000000019,
			"saturation": 0.07352941176470584,
			"lightness": 0.7333333333333334
		},
		{
			"name": "ヴェロッテ",
			"left": 944,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.00925925925925923,
			"saturation": 0.11538461538461534,
			"lightness": 0.6941176470588235
		},
		{
			"name": "アネモネ(覚醒)",
			"left": 960,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.07142857142857142,
			"saturation": 0.048951048951048785,
			"lightness": 0.7196078431372549
		},
		{
			"name": "アネモネ",
			"left": 976,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.8787878787878787,
			"saturation": 0.06666666666666658,
			"lightness": 0.676470588235294
		},
		{
			"name": "アリア",
			"left": 992,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.9809523809523809,
			"saturation": 0.22875816993464068,
			"lightness": 0.7000000000000001
		},
		{
			"name": "イーリス",
			"left": 1008,
			"top": 0,
			"width": 16,
			"height": 16,
			"hue": 0.9487179487179489,
			"saturation": 0.07262569832402241,
			"lightness": 0.6490196078431373
		},
		{
			"name": "エルン",
			"left": 0,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.01388888888888884,
			"saturation": 0.047999999999999994,
			"lightness": 0.5098039215686274
		},
		{
			"name": "キャリー",
			"left": 16,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.21568627450980404,
			"saturation": 0.10691823899371067,
			"lightness": 0.6882352941176471
		},
		{
			"name": "キュテリ(覚醒)",
			"left": 32,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9294871794871795,
			"saturation": 0.13265306122448978,
			"lightness": 0.615686274509804
		},
		{
			"name": "キュテリ",
			"left": 48,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.007936507936507915,
			"saturation": 0.13043478260869554,
			"lightness": 0.6843137254901961
		},
		{
			"name": "ギャレット",
			"left": 64,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.13333333333333344,
			"saturation": 0.1149425287356321,
			"lightness": 0.6588235294117647
		},
		{
			"name": "クルル",
			"left": 80,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.6666666666666666,
			"saturation": 0.006369426751592334,
			"lightness": 0.692156862745098
		},
		{
			"name": "クレア",
			"left": 96,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.37037037037037024,
			"saturation": 0.055214723926380334,
			"lightness": 0.680392156862745
		},
		{
			"name": "クロリス",
			"left": 112,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9855072463768116,
			"saturation": 0.12432432432432436,
			"lightness": 0.6372549019607844
		},
		{
			"name": "ケイティ",
			"left": 128,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.02380952380952371,
			"saturation": 0.09459459459459467,
			"lightness": 0.7098039215686275
		},
		{
			"name": "コジュウロウ",
			"left": 144,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.1282051282051281,
			"lightness": 0.6941176470588235
		},
		{
			"name": "コンラッド",
			"left": 160,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.07142857142857147,
			"saturation": 0.08860759493670878,
			"lightness": 0.5352941176470588
		},
		{
			"name": "ザラーム",
			"left": 192,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.05128205128205136,
			"saturation": 0.11111111111111113,
			"lightness": 0.5411764705882353
		},
		{
			"name": "サイラス",
			"left": 176,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.07407407407407436,
			"saturation": 0.03964757709251099,
			"lightness": 0.5549019607843136
		},
		{
			"name": "シャオ",
			"left": 208,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9365079365079365,
			"saturation": 0.10047846889952144,
			"lightness": 0.5901960784313726
		},
		{
			"name": "ジーナ",
			"left": 224,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.11666666666666654,
			"saturation": 0.22727272727272735,
			"lightness": 0.7411764705882353
		},
		{
			"name": "ステラ",
			"left": 240,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9540229885057472,
			"saturation": 0.23200000000000004,
			"lightness": 0.7549019607843137
		},
		{
			"name": "ストレイ",
			"left": 256,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.08974358974358977,
			"saturation": 0.24223602484472054,
			"lightness": 0.6843137254901961
		},
		{
			"name": "ゾラ",
			"left": 272,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.14102564102564102,
			"saturation": 0.2795698924731183,
			"lightness": 0.6352941176470588
		},
		{
			"name": "チズル",
			"left": 288,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9761904761904763,
			"saturation": 0.04575163398692812,
			"lightness": 0.7
		},
		{
			"name": "テミス",
			"left": 304,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.1169154228855721,
			"saturation": 0.273469387755102,
			"lightness": 0.5196078431372548
		},
		{
			"name": "ドロシー",
			"left": 320,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.861111111111111,
			"saturation": 0.14814814814814817,
			"lightness": 0.6823529411764706
		},
		{
			"name": "ノエル(覚醒)",
			"left": 336,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.04545454545454564,
			"saturation": 0.07692307692307704,
			"lightness": 0.7196078431372549
		},
		{
			"name": "バルバストラフ",
			"left": 368,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.047619047619047616,
			"saturation": 0.05511811023622027,
			"lightness": 0.7509803921568627
		},
		{
			"name": "ノエル",
			"left": 352,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.030303030303030224,
			"saturation": 0.13749999999999987,
			"lightness": 0.6862745098039216
		},
		{
			"name": "ヒエン(覚醒)",
			"left": 384,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9814814814814813,
			"saturation": 0.09000000000000012,
			"lightness": 0.607843137254902
		},
		{
			"name": "ヒエン",
			"left": 400,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9285714285714287,
			"saturation": 0.06542056074766346,
			"lightness": 0.5803921568627451
		},
		{
			"name": "フェドラ",
			"left": 416,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.19230769230769224,
			"saturation": 0.08609271523178795,
			"lightness": 0.7039215686274509
		},
		{
			"name": "ベティ",
			"left": 432,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.005050505050505034,
			"saturation": 0.15789473684210525,
			"lightness": 0.5901960784313726
		},
		{
			"name": "ベラ",
			"left": 448,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.04583333333333329,
			"saturation": 0.22988505747126436,
			"lightness": 0.6588235294117647
		},
		{
			"name": "ベルニス",
			"left": 464,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9166666666666666,
			"saturation": 0.23170731707317072,
			"lightness": 0.6784313725490195
		},
		{
			"name": "マリエ",
			"left": 480,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.625,
			"saturation": 0.022988505747126353,
			"lightness": 0.6588235294117647
		},
		{
			"name": "メル",
			"left": 496,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.13333333333333325,
			"saturation": 0.13157894736842118,
			"lightness": 0.7019607843137255
		},
		{
			"name": "メーリス",
			"left": 512,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.047619047619047644,
			"saturation": 0.24378109452736313,
			"lightness": 0.6058823529411764
		},
		{
			"name": "モニカ",
			"left": 528,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9404761904761906,
			"saturation": 0.19178082191780835,
			"lightness": 0.7137254901960784
		},
		{
			"name": "ユユ",
			"left": 544,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.17596566523605153,
			"lightness": 0.5431372549019609
		},
		{
			"name": "ユリアン",
			"left": 560,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.09803921568627456,
			"saturation": 0.0928961748633881,
			"lightness": 0.6411764705882352
		},
		{
			"name": "リュリュ",
			"left": 576,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9479166666666669,
			"saturation": 0.10810810810810811,
			"lightness": 0.7098039215686275
		},
		{
			"name": "ロベルト",
			"left": 592,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.0686274509803922,
			"saturation": 0.08292682926829266,
			"lightness": 0.5980392156862745
		},
		{
			"name": "ヴィンセント",
			"left": 608,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.055555555555555663,
			"saturation": 0.06666666666666668,
			"lightness": 0.5588235294117647
		},
		{
			"name": "アカネ",
			"left": 624,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.03225806451612891,
			"lightness": 0.7568627450980392
		},
		{
			"name": "アザミ",
			"left": 640,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.791666666666667,
			"saturation": 0.02197802197802206,
			"lightness": 0.6431372549019608
		},
		{
			"name": "アデル",
			"left": 656,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.8686868686868685,
			"saturation": 0.17837837837837833,
			"lightness": 0.6372549019607843
		},
		{
			"name": "アネリア(覚醒)",
			"left": 672,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9916666666666667,
			"saturation": 0.09090909090909084,
			"lightness": 0.5686274509803921
		},
		{
			"name": "アネリア",
			"left": 688,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9210526315789475,
			"saturation": 0.09547738693467346,
			"lightness": 0.6098039215686275
		},
		{
			"name": "イメリア(覚醒)",
			"left": 704,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.8958333333333334,
			"saturation": 0.0761904761904762,
			"lightness": 0.5882352941176471
		},
		{
			"name": "イメリア",
			"left": 720,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9236111111111109,
			"saturation": 0.1363636363636363,
			"lightness": 0.6549019607843136
		},
		{
			"name": "ウズメ(覚醒)",
			"left": 736,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.007575757575757552,
			"saturation": 0.22448979591836724,
			"lightness": 0.6156862745098038
		},
		{
			"name": "ウズメ",
			"left": 752,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.7500000000000001,
			"saturation": 0.1111111111111112,
			"lightness": 0.6470588235294118
		},
		{
			"name": "ウル",
			"left": 768,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.026881720430107583,
			"saturation": 0.18128654970760233,
			"lightness": 0.6647058823529411
		},
		{
			"name": "エイダ",
			"left": 784,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.07471264367816095,
			"saturation": 0.20863309352517992,
			"lightness": 0.7274509803921568
		},
		{
			"name": "エキドナ",
			"left": 800,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.10465116279069765,
			"saturation": 0.26060606060606056,
			"lightness": 0.6764705882352942
		},
		{
			"name": "エミリア",
			"left": 816,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.8981481481481481,
			"saturation": 0.11842105263157907,
			"lightness": 0.7019607843137254
		},
		{
			"name": "エリザ",
			"left": 832,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.5396825396825395,
			"saturation": 0.13375796178343938,
			"lightness": 0.692156862745098
		},
		{
			"name": "エリザベート",
			"left": 848,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.07971014492753614,
			"saturation": 0.11442786069651743,
			"lightness": 0.6058823529411765
		},
		{
			"name": "エルヴァ",
			"left": 864,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.010752688172043124,
			"saturation": 0.1657754010695187,
			"lightness": 0.6333333333333333
		},
		{
			"name": "オデット",
			"left": 880,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.7450980392156863,
			"saturation": 0.11409395973154361,
			"lightness": 0.707843137254902
		},
		{
			"name": "カグラ",
			"left": 896,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9027777777777776,
			"saturation": 0.06521739130434774,
			"lightness": 0.6392156862745098
		},
		{
			"name": "カミラ",
			"left": 912,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.893939393939394,
			"saturation": 0.06358381502890183,
			"lightness": 0.6607843137254902
		},
		{
			"name": "カルマ(ヴァンパイアクイーン)",
			"left": 928,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.9444444444444444,
			"saturation": 0.05976095617529876,
			"lightness": 0.5078431372549019
		},
		{
			"name": "カルマ(ヴァンパイアプリンセス)",
			"left": 944,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.02083333333333326,
			"saturation": 0.04444444444444443,
			"lightness": 0.6470588235294117
		},
		{
			"name": "ガラニア(覚醒)",
			"left": 960,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.07183908045977011,
			"saturation": 0.2761904761904761,
			"lightness": 0.588235294117647
		},
		{
			"name": "ガラニア",
			"left": 976,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.06521739130434799,
			"saturation": 0.1299435028248588,
			"lightness": 0.6529411764705882
		},
		{
			"name": "クローディア(剣あり)",
			"left": 1008,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.8939393939393938,
			"saturation": 0.0472103004291845,
			"lightness": 0.5431372549019607
		},
		{
			"name": "クロエ",
			"left": 992,
			"top": 16,
			"width": 16,
			"height": 16,
			"hue": 0.04040404040404041,
			"saturation": 0.1404255319148936,
			"lightness": 0.5392156862745098
		},
		{
			"name": "クローディア(剣あり2)",
			"left": 0,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.02298850574712651,
			"saturation": 0.1638418079096046,
			"lightness": 0.6529411764705882
		},
		{
			"name": "クローディア",
			"left": 16,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.02380952380952388,
			"saturation": 0.17948717948717957,
			"lightness": 0.6941176470588235
		},
		{
			"name": "サクヤ",
			"left": 32,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9385964912280703,
			"saturation": 0.09743589743589738,
			"lightness": 0.6176470588235294
		},
		{
			"name": "サビーネ",
			"left": 48,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.041666666666666664,
			"saturation": 0.17391304347826084,
			"lightness": 0.6392156862745098
		},
		{
			"name": "サーシャ",
			"left": 64,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.061904761904761844,
			"saturation": 0.1955307262569832,
			"lightness": 0.6490196078431373
		},
		{
			"name": "サーリア",
			"left": 80,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.05555555555555555,
			"saturation": 0.03797468354430366,
			"lightness": 0.6901960784313725
		},
		{
			"name": "シェリー",
			"left": 96,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.013157894736842056,
			"saturation": 0.16101694915254244,
			"lightness": 0.5372549019607844
		},
		{
			"name": "シズカ",
			"left": 112,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.6458333333333328,
			"saturation": 0.038461538461538464,
			"lightness": 0.592156862745098
		},
		{
			"name": "シプリア",
			"left": 128,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.5833333333333333,
			"saturation": 0.07692307692307701,
			"lightness": 0.6941176470588235
		},
		{
			"name": "シホ",
			"left": 144,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.14035087719298248,
			"lightness": 0.7764705882352941
		},
		{
			"name": "シャルロット",
			"left": 160,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.09139784946236557,
			"saturation": 0.23308270676691736,
			"lightness": 0.7392156862745098
		},
		{
			"name": "シュウカ",
			"left": 176,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9924242424242424,
			"saturation": 0.13095238095238101,
			"lightness": 0.6705882352941177
		},
		{
			"name": "シーディス",
			"left": 192,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.12318840579710161,
			"saturation": 0.15862068965517237,
			"lightness": 0.7156862745098038
		},
		{
			"name": "ジェシカ",
			"left": 208,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.16666666666666666,
			"saturation": 0.17730496453900702,
			"lightness": 0.7235294117647059
		},
		{
			"name": "ジェリウス",
			"left": 224,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.10714285714285704,
			"saturation": 0.08045977011494257,
			"lightness": 0.6588235294117647
		},
		{
			"name": "ジェローム",
			"left": 240,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.030303030303030224,
			"saturation": 0.06666666666666658,
			"lightness": 0.676470588235294
		},
		{
			"name": "ジャンナ(覚醒)",
			"left": 256,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.06349206349206346,
			"saturation": 0.11351351351351359,
			"lightness": 0.6372549019607844
		},
		{
			"name": "ジャンナ",
			"left": 272,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9393939393939396,
			"saturation": 0.06432748538011691,
			"lightness": 0.6647058823529413
		},
		{
			"name": "スピカ",
			"left": 288,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.14814814814814822,
			"saturation": 0.15929203539823006,
			"lightness": 0.5568627450980391
		},
		{
			"name": "セリア",
			"left": 304,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.25555555555555554,
			"saturation": 0.10067114093959736,
			"lightness": 0.707843137254902
		},
		{
			"name": "ゼノビア",
			"left": 320,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.0757575757575759,
			"saturation": 0.15068493150684936,
			"lightness": 0.7137254901960784
		},
		{
			"name": "ソラノ",
			"left": 336,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.04761904761904742,
			"saturation": 0.044585987261146515,
			"lightness": 0.692156862745098
		},
		{
			"name": "ダリア",
			"left": 352,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9166666666666669,
			"saturation": 0.076086956521739,
			"lightness": 0.6392156862745098
		},
		{
			"name": "テティス",
			"left": 368,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.1470588235294117,
			"saturation": 0.23287671232876708,
			"lightness": 0.7137254901960784
		},
		{
			"name": "バシラ",
			"left": 384,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.8148148148148149,
			"saturation": 0.12162162162162159,
			"lightness": 0.7098039215686275
		},
		{
			"name": "パトラ",
			"left": 400,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.05769230769230768,
			"saturation": 0.1444444444444444,
			"lightness": 0.6470588235294118
		},
		{
			"name": "ヒナ",
			"left": 416,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.033333333333333236,
			"saturation": 0.07352941176470584,
			"lightness": 0.7333333333333334
		},
		{
			"name": "ビエラ",
			"left": 432,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.1333333333333333,
			"saturation": 0.2229299363057324,
			"lightness": 0.692156862745098
		},
		{
			"name": "フィグネリア",
			"left": 448,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9795918367346939,
			"saturation": 0.2934131736526948,
			"lightness": 0.6725490196078432
		},
		{
			"name": "フラメル",
			"left": 464,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.10000000000000019,
			"saturation": 0.08474576271186432,
			"lightness": 0.7686274509803921
		},
		{
			"name": "フラン",
			"left": 480,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.777777777777778,
			"saturation": 0.044117647058823574,
			"lightness": 0.7333333333333333
		},
		{
			"name": "ベアトリカ",
			"left": 496,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.03153153153153149,
			"saturation": 0.14859437751004015,
			"lightness": 0.48823529411764705
		},
		{
			"name": "ベリンダ",
			"left": 512,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9824561403508772,
			"saturation": 0.10982658959537565,
			"lightness": 0.6607843137254902
		},
		{
			"name": "ホルエス",
			"left": 528,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.7499999999999996,
			"saturation": 0.0384615384615385,
			"lightness": 0.6941176470588235
		},
		{
			"name": "マリウス",
			"left": 544,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.13333333333333344,
			"saturation": 0.08196721311475402,
			"lightness": 0.7607843137254902
		},
		{
			"name": "マリーベル",
			"left": 560,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9333333333333333,
			"saturation": 0.16556291390728478,
			"lightness": 0.703921568627451
		},
		{
			"name": "マーニー",
			"left": 576,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9833333333333334,
			"saturation": 0.06024096385542165,
			"lightness": 0.6745098039215687
		},
		{
			"name": "マール",
			"left": 592,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.19696969696969688,
			"saturation": 0.15492957746478858,
			"lightness": 0.7215686274509804
		},
		{
			"name": "モミジ",
			"left": 624,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.8095238095238093,
			"saturation": 0.10447761194029853,
			"lightness": 0.6058823529411764
		},
		{
			"name": "メメント",
			"left": 608,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.016666666666666597,
			"saturation": 0.1075268817204302,
			"lightness": 0.6352941176470589
		},
		{
			"name": "モルディベート",
			"left": 640,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.04166666666666686,
			"saturation": 0.08450704225352122,
			"lightness": 0.7215686274509804
		},
		{
			"name": "ユリナ",
			"left": 656,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.08333333333333304,
			"saturation": 0.05063291139240506,
			"lightness": 0.6901960784313725
		},
		{
			"name": "ライラ",
			"left": 672,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.026041666666666723,
			"saturation": 0.18181818181818182,
			"lightness": 0.6549019607843137
		},
		{
			"name": "リタ",
			"left": 688,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.029126213592232907,
			"lightness": 0.596078431372549
		},
		{
			"name": "リッカ",
			"left": 704,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.993827160493827,
			"saturation": 0.19148936170212774,
			"lightness": 0.7235294117647059
		},
		{
			"name": "リッカ人形",
			"left": 720,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.7333333333333333,
			"saturation": 0.17006802721088435,
			"lightness": 0.711764705882353
		},
		{
			"name": "リディ",
			"left": 736,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.2583333333333334,
			"saturation": 0.09259259259259267,
			"lightness": 0.5764705882352942
		},
		{
			"name": "リリア",
			"left": 752,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.014705882352941126,
			"saturation": 0.17525773195876285,
			"lightness": 0.6196078431372549
		},
		{
			"name": "リン",
			"left": 768,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.08095238095238096,
			"saturation": 0.17948717948717943,
			"lightness": 0.6176470588235294
		},
		{
			"name": "レイチェル",
			"left": 784,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.847826086956522,
			"saturation": 0.12299465240641712,
			"lightness": 0.6333333333333333
		},
		{
			"name": "レン",
			"left": 800,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.07142857142857148,
			"saturation": 0.06796116504854371,
			"lightness": 0.596078431372549
		},
		{
			"name": "ロアナ",
			"left": 816,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.03846153846153866,
			"saturation": 0.08387096774193556,
			"lightness": 0.696078431372549
		},
		{
			"name": "ワルツ",
			"left": 832,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.022727272727272856,
			"saturation": 0.10377358490566042,
			"lightness": 0.5843137254901961
		},
		{
			"name": "ヴィクトリア",
			"left": 848,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.09803921568627445,
			"saturation": 0.2098765432098765,
			"lightness": 0.6823529411764706
		},
		{
			"name": "アイシャ",
			"left": 864,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.2291666666666664,
			"saturation": 0.05882352941176469,
			"lightness": 0.7333333333333333
		},
		{
			"name": "アンナ",
			"left": 880,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.011111111111111384,
			"saturation": 0.10948905109489052,
			"lightness": 0.7313725490196078
		},
		{
			"name": "アーニャ",
			"left": 896,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.5833333333333336,
			"saturation": 0.051282051282051294,
			"lightness": 0.6941176470588236
		},
		{
			"name": "イリス",
			"left": 912,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9629629629629631,
			"saturation": 0.1384615384615384,
			"lightness": 0.7450980392156863
		},
		{
			"name": "エスタ",
			"left": 928,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.0866141732283466,
			"lightness": 0.7509803921568627
		},
		{
			"name": "オリヴィエ",
			"left": 944,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.12903225806451624,
			"saturation": 0.2296296296296294,
			"lightness": 0.7352941176470588
		},
		{
			"name": "カルマ(イモータルクイーン)",
			"left": 960,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.11904761904761901,
			"saturation": 0.14285714285714293,
			"lightness": 0.711764705882353
		},
		{
			"name": "カルマ(イモータルプリンセス)",
			"left": 976,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.07142857142857113,
			"saturation": 0.0569105691056911,
			"lightness": 0.7588235294117648
		},
		{
			"name": "クリッサ",
			"left": 992,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.9814814814814813,
			"saturation": 0.09890109890109904,
			"lightness": 0.6431372549019608
		},
		{
			"name": "コーネリア(覚醒)",
			"left": 1008,
			"top": 32,
			"width": 16,
			"height": 16,
			"hue": 0.08333333333333333,
			"saturation": 0.11688311688311682,
			"lightness": 0.6980392156862745
		},
		{
			"name": "コーネリア",
			"left": 0,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.04109589041095889,
			"lightness": 0.5705882352941176
		},
		{
			"name": "サキ",
			"left": 16,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.016260162601626073,
			"saturation": 0.20812182741116753,
			"lightness": 0.6137254901960785
		},
		{
			"name": "シビラ",
			"left": 32,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.9555555555555557,
			"saturation": 0.08474576271186443,
			"lightness": 0.6529411764705882
		},
		{
			"name": "ソフィー(覚醒)",
			"left": 48,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.09999999999999994,
			"saturation": 0.14423076923076927,
			"lightness": 0.592156862745098
		},
		{
			"name": "ソフィー",
			"left": 64,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.03333333333333336,
			"saturation": 0.06437768240343349,
			"lightness": 0.4568627450980392
		},
		{
			"name": "ディーナ(覚醒)",
			"left": 80,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.07692307692307689,
			"saturation": 0.3679245283018869,
			"lightness": 0.5843137254901961
		},
		{
			"name": "ディーナ",
			"left": 96,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.10109289617486339,
			"saturation": 0.28372093023255807,
			"lightness": 0.5784313725490196
		},
		{
			"name": "デスピア",
			"left": 112,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.004273504273504259,
			"saturation": 0.1604938271604938,
			"lightness": 0.5235294117647059
		},
		{
			"name": "ドラニア",
			"left": 128,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.5705128205128206,
			"saturation": 0.10236220472440948,
			"lightness": 0.5019607843137255
		},
		{
			"name": "ナナリー",
			"left": 144,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.07017543859649127,
			"saturation": 0.1519999999999999,
			"lightness": 0.7549019607843137
		},
		{
			"name": "ファルネ",
			"left": 160,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.055555555555555663,
			"saturation": 0.07772020725388604,
			"lightness": 0.6215686274509804
		},
		{
			"name": "ベルナ",
			"left": 176,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.257142857142857,
			"lightness": 0.7254901960784313
		},
		{
			"name": "ミコト",
			"left": 208,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.061111111111111095,
			"saturation": 0.19736842105263147,
			"lightness": 0.7019607843137255
		},
		{
			"name": "マツリ",
			"left": 192,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.8214285714285714,
			"saturation": 0.076086956521739,
			"lightness": 0.6392156862745098
		},
		{
			"name": "ミネルバ",
			"left": 224,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.020833333333333554,
			"saturation": 0.07407407407407407,
			"lightness": 0.5764705882352941
		},
		{
			"name": "たまも",
			"left": 240,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.04320987654320991,
			"saturation": 0.18120805369127513,
			"lightness": 0.707843137254902
		},
		{
			"name": "カグヤ",
			"left": 256,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.6111111111111116,
			"saturation": 0.01986754966887429,
			"lightness": 0.703921568627451
		},
		{
			"name": "アイギス様",
			"left": 272,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.10317460317460315,
			"saturation": 0.25609756097560976,
			"lightness": 0.6784313725490196
		},
		{
			"name": "アイナ(鉄の聖霊)",
			"left": 288,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.6014492753623188,
			"saturation": 0.12568306010928962,
			"lightness": 0.6411764705882352
		},
		{
			"name": "クリスティア(虹の聖霊)",
			"left": 304,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.8939393939393938,
			"saturation": 0.09565217391304334,
			"lightness": 0.7745098039215685
		},
		{
			"name": "サラ(銅の聖霊)",
			"left": 320,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.01851851851851846,
			"saturation": 0.30201342281879184,
			"lightness": 0.707843137254902
		},
		{
			"name": "シリル(銀の聖霊)",
			"left": 336,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.027777777777777776,
			"saturation": 0.03409090909090897,
			"lightness": 0.6549019607843137
		},
		{
			"name": "スケルトン(メメントトークン)",
			"left": 352,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.08333333333333304,
			"saturation": 0.057142857142857134,
			"lightness": 0.7254901960784313
		},
		{
			"name": "セリア(白金の聖霊)",
			"left": 368,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.6363636363636364,
			"saturation": 0.09401709401709389,
			"lightness": 0.7705882352941176
		},
		{
			"name": "ニナ(金の聖霊)",
			"left": 384,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.04761904761904756,
			"saturation": 0.20710059171597647,
			"lightness": 0.6686274509803922
		},
		{
			"name": "ハッピー(祝福の聖霊)",
			"left": 400,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.011494252873563185,
			"saturation": 0.1946308724832214,
			"lightness": 0.707843137254902
		},
		{
			"name": "フルール(時の聖霊)",
			"left": 416,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.24999999999999878,
			"saturation": 0.01492537313432852,
			"lightness": 0.7372549019607844
		},
		{
			"name": "フローリカ(黒の聖霊)",
			"left": 432,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.0878787878787879,
			"saturation": 0.282051282051282,
			"lightness": 0.6176470588235293
		},
		{
			"name": "ブルーマン",
			"left": 448,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.5942028985507246,
			"saturation": 0.13450292397660824,
			"lightness": 0.6647058823529413
		},
		{
			"name": "ヴィクトワール(覚醒の聖霊)",
			"left": 464,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.07723577235772354,
			"saturation": 0.29496402877697847,
			"lightness": 0.7274509803921569
		},
		{
			"name": "式鬼",
			"left": 480,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.004629629629629615,
			"saturation": 0.18556701030927827,
			"lightness": 0.6196078431372549
		},
		{
			"name": "王子(目無し)",
			"left": 496,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.01111111111111107,
			"saturation": 0.08474576271186443,
			"lightness": 0.6529411764705882
		},
		{
			"name": "王子",
			"left": 512,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.011904761904761882,
			"saturation": 0.07692307692307679,
			"lightness": 0.6431372549019607
		},
		{
			"name": "白バケツ",
			"left": 528,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.5877192982456141,
			"saturation": 0.12418300653594781,
			"lightness": 0.7
		},
		{
			"name": "金バケツ",
			"left": 544,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.1282051282051282,
			"saturation": 0.14772727272727285,
			"lightness": 0.6549019607843137
		},
		{
			"name": "キングマミー",
			"left": 560,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.07575757575757577,
			"saturation": 0.15492957746478858,
			"lightness": 0.7215686274509804
		},
		{
			"name": "スケルトン",
			"left": 576,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.05555555555555555,
			"saturation": 0.022900763358778546,
			"lightness": 0.7431372549019608
		},
		{
			"name": "スケルトンシューター",
			"left": 592,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.02521008403361359,
			"lightness": 0.7666666666666666
		},
		{
			"name": "スケルトンランサー",
			"left": 608,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.03703703703703692,
			"saturation": 0.05882352941176467,
			"lightness": 0.7
		},
		{
			"name": "マミー",
			"left": 624,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.06481481481481487,
			"saturation": 0.1475409836065573,
			"lightness": 0.7607843137254902
		},
		{
			"name": "レッサーヴァンパイア",
			"left": 640,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.6583333333333333,
			"saturation": 0.1333333333333334,
			"lightness": 0.7058823529411764
		},
		{
			"name": "ヴァンパイア",
			"left": 656,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.10526315789473688,
			"saturation": 0.10270270270270278,
			"lightness": 0.6372549019607843
		},
		{
			"name": "不死者リッチ",
			"left": 672,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.06593406593406584,
			"lightness": 0.6431372549019607
		},
		{
			"name": "吸血コウモリ",
			"left": 688,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.04285714285714291,
			"lightness": 0.7254901960784315
		},
		{
			"name": "死者の王",
			"left": 704,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.019607843137254836,
			"saturation": 0.08717948717948716,
			"lightness": 0.6176470588235294
		},
		{
			"name": "骸骨騎兵(緑)",
			"left": 720,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.12500000000000014,
			"saturation": 0.0396039603960396,
			"lightness": 0.6039215686274509
		},
		{
			"name": "骸骨騎兵(赤)",
			"left": 736,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.0729166666666667,
			"saturation": 0.14545454545454545,
			"lightness": 0.5686274509803921
		},
		{
			"name": "オーガ(赤)",
			"left": 752,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.03240740740740743,
			"saturation": 0.17307692307692302,
			"lightness": 0.592156862745098
		},
		{
			"name": "オーガ(黒)",
			"left": 768,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.11904761904761908,
			"saturation": 0.08936170212765956,
			"lightness": 0.46078431372549017
		},
		{
			"name": "オーガ",
			"left": 784,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.9133333333333332,
			"saturation": 0.11111111111111106,
			"lightness": 0.5588235294117646
		},
		{
			"name": "ゴブリン(ケンキョ)",
			"left": 800,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.033333333333333146,
			"saturation": 0.04950495049504959,
			"lightness": 0.8019607843137254
		},
		{
			"name": "ゴブリン(緑)",
			"left": 816,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.18333333333333326,
			"saturation": 0.08474576271186432,
			"lightness": 0.7686274509803921
		},
		{
			"name": "ゴブリン(赤)",
			"left": 832,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.008333333333333309,
			"saturation": 0.1562499999999999,
			"lightness": 0.7490196078431373
		},
		{
			"name": "ゴブリン(黒)",
			"left": 848,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.05555555555555555,
			"saturation": 0.04166666666666652,
			"lightness": 0.7176470588235294
		},
		{
			"name": "ゴブリン",
			"left": 864,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.9,
			"saturation": 0.10638297872340427,
			"lightness": 0.7235294117647059
		},
		{
			"name": "ゴブリンアーチャー(赤)",
			"left": 880,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.022727272727272856,
			"saturation": 0.1692307692307693,
			"lightness": 0.7450980392156863
		},
		{
			"name": "ゴブリンアーチャー",
			"left": 912,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.047619047619048095,
			"saturation": 0.048275862068965544,
			"lightness": 0.7156862745098039
		},
		{
			"name": "ゴブリンキング(赤)",
			"left": 928,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.9222222222222222,
			"saturation": 0.10638297872340427,
			"lightness": 0.7235294117647059
		},
		{
			"name": "ゴブリンアーチャー(黒)",
			"left": 896,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.05952380952380945,
			"saturation": 0.19178082191780835,
			"lightness": 0.7137254901960784
		},
		{
			"name": "ゴブリンキング(黒)",
			"left": 944,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.12222222222222208,
			"saturation": 0.09316770186335406,
			"lightness": 0.6843137254901961
		},
		{
			"name": "ゴブリンキング",
			"left": 960,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.02083333333333326,
			"saturation": 0.10666666666666669,
			"lightness": 0.7058823529411765
		},
		{
			"name": "ゴブリングラディエーター(赤)",
			"left": 976,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.07777777777777779,
			"saturation": 0.1666666666666667,
			"lightness": 0.6470588235294118
		},
		{
			"name": "ゴブリングラディエーター(黒)",
			"left": 992,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0.16666666666666666,
			"saturation": 0.040816326530612235,
			"lightness": 0.6156862745098038
		},
		{
			"name": "ゴブリングラディエーター",
			"left": 1008,
			"top": 48,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.08333333333333319,
			"lightness": 0.6705882352941176
		},
		{
			"name": "ゴブリンメイジ(赤)",
			"left": 0,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.0347222222222223,
			"saturation": 0.17910447761194026,
			"lightness": 0.7372549019607842
		},
		{
			"name": "ゴブリンメイジ(黒)",
			"left": 16,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.08333333333333358,
			"saturation": 0.06756756756756753,
			"lightness": 0.7098039215686275
		},
		{
			"name": "ゴブリンメイジ",
			"left": 32,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.9404761904761904,
			"saturation": 0.0985915492957747,
			"lightness": 0.7215686274509804
		},
		{
			"name": "ゴブリンライダー(黒)",
			"left": 64,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.9629629629629629,
			"saturation": 0.1179039301310043,
			"lightness": 0.5509803921568627
		},
		{
			"name": "ゴブリンライダー(赤)",
			"left": 48,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.07017543859649127,
			"saturation": 0.0808510638297872,
			"lightness": 0.5392156862745098
		},
		{
			"name": "ゴブリンライダー",
			"left": 80,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.9523809523809522,
			"saturation": 0.0630630630630631,
			"lightness": 0.5647058823529412
		},
		{
			"name": "赤鬼",
			"left": 96,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.9605263157894737,
			"saturation": 0.1583333333333333,
			"lightness": 0.5294117647058824
		},
		{
			"name": "青鬼",
			"left": 112,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.6705426356589147,
			"saturation": 0.19999999999999996,
			"lightness": 0.5784313725490196
		},
		{
			"name": "鬼",
			"left": 128,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.20833333333333318,
			"saturation": 0.047999999999999994,
			"lightness": 0.5098039215686274
		},
		{
			"name": "黒鬼",
			"left": 144,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0,
			"saturation": 0.01680672268907557,
			"lightness": 0.5333333333333333
		},
		{
			"name": "リビングアーマー(灰)",
			"left": 160,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.0454545454545455,
			"saturation": 0.04526748971193417,
			"lightness": 0.4764705882352941
		},
		{
			"name": "リビングアーマー(砲撃)",
			"left": 176,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.9950980392156863,
			"saturation": 0.1370967741935484,
			"lightness": 0.48627450980392156
		},
		{
			"name": "リビングアーマー(赤)",
			"left": 192,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.024390243902439046,
			"saturation": 0.16872427983539098,
			"lightness": 0.47647058823529415
		},
		{
			"name": "リビングアーマー(金)",
			"left": 208,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.15624999999999997,
			"saturation": 0.2424242424242424,
			"lightness": 0.38823529411764707
		},
		{
			"name": "リビングアーマー(青)",
			"left": 224,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.5416666666666671,
			"saturation": 0.03603603603603604,
			"lightness": 0.5647058823529413
		},
		{
			"name": "暗黒騎兵",
			"left": 240,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.8666666666666666,
			"saturation": 0.021276595744680837,
			"lightness": 0.46078431372549017
		},
		{
			"name": "暗黒騎士(砲撃)",
			"left": 256,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.06060606060606063,
			"saturation": 0.09243697478991593,
			"lightness": 0.4666666666666667
		},
		{
			"name": "暗黒騎士",
			"left": 272,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.0454545454545455,
			"saturation": 0.05365853658536587,
			"lightness": 0.4019607843137255
		},
		{
			"name": "暗黒騎士団長",
			"left": 288,
			"top": 64,
			"width": 16,
			"height": 16,
			"hue": 0.7836879432624113,
			"saturation": 0.2146118721461187,
			"lightness": 0.4294117647058824
		}
	]

/***/ },

/***/ 16:
/***/ function(module, exports, __webpack_require__) {

	module.exports = "data:image/png;base64,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"

/***/ }

});