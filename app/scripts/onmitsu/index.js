var icons = require('../../resources/aigisdot/aigisdot.json');
var iconSprite = require('url-loader?mimetype=image/png!../../resources/aigisdot/aigisdot.png');

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
var difficulty;

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
      .attr('data-difficulty', difficulty)
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

function createTileImages(icons, done) {
  var sprite = document.createElement('img');
  sprite.src = iconSprite;

  setTimeout(function () {
    var images = icons.map(function (icon) {
      var work = document.createElement('canvas');
      work.width = iconWidth;
      work.height = iconHeight;

      var workCtx = work.getContext('2d');

      /*
       * Keep dot edge.
       */
      workCtx.imageSmoothingEnabled = false;
      workCtx.webkitImageSmoothingEnabled = false;
      workCtx.mozImageSmoothingEnabled = false;
      workCtx.msImageSmoothingEnabled  = false;

      workCtx.drawImage(sprite,
        icon.left, icon.top, icon.width, icon.height,
        0, 0, iconWidth, iconHeight
      );

      var img = document.createElement('img');
      img.src = work.toDataURL();

      return img;
    });

    done(images);
  }, 0);
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
  createTileImages(icons, function (images) {
    tileImages = images;
  });

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

      difficulty = $(this).val();

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
    })
    .on('dragstart', function (e) {
      e.preventDefault();
    });

  changeScene('menu');
}

$(function () {
  initialize($('#onmitsu'));
});
