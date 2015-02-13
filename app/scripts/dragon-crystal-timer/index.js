'use strict';

require('jquery.cookie');

// [begin...end)
var periods = [
  ['2015/02/14 00:00:00', '2015/02/16 00:00:00'],
  ['2015/02/21 00:00:00', '2015/02/23 00:00:00'],
  ['2015/02/28 00:00:00', '2015/03/02 00:00:00'],
  ['2015/03/07 00:00:00', '2015/03/09 10:00:00']
].map(function (period) {
  return period.map(Date.parse);
});

var objectiveMode = 'exchange'; // 'achievement' or 'exchange'
var maxObjective = Infinity;
var initialObjective = 300;
var initialCurrent = 20;
var rewardEnabled = true;
var cookieName = 'dragon-crystal-timer';

var objectives = {
};

var prizes = [
  {value: 50, unit: 'aria', name: 'アリア', limit: Infinity},
  {value: 300, unit: 'drania', name: 'ドラニア', limit: Infinity}
];

var maps = [
  {
    name: '竜人の王',
    charisma: 40,
    stamina: 3,
    expectation: 3.96,
    drops: [
      {name: 'ダイヤ', icon: 'diamond'},
      {name: 'ウィルフレッド', icon: 'will'},
      {name: '白銀精霊', icon: 'platinum-sprit'},
      {name: 'エレイン', icon: 'elain'},
      {name: '竜水晶2', icon: 'dragon-crystal-2', set: 3}
    ]
  },
  {
    name: '大侵攻3',
    charisma: 40,
    stamina: 3,
    expectation: 3.84,
    drops: [
      {name: 'ダイヤ', icon: 'diamond', set:2},
      {name: 'ラセル', icon: 'lassell'},
      {name: '金精霊', icon: 'gold-sprit'},
      {name: 'グレイブ', icon: 'grave'},
      {name: '竜水晶2', icon: 'dragon-crystal-2', set: 2}
    ]
  },
  {
    name: '大侵攻2',
    charisma: 35,
    stamina: 3,
    expectation: 3.66,
    drops: [
      {name: 'ダイヤ', icon: 'diamond'},
      {name: 'レオ', icon: 'leo'},
      {name: '金精霊', icon: 'gold-sprit'},
      {name: 'セシリー', icon: 'cecily'},
      {name: '竜水晶2', icon: 'dragon-crystal-2', set: 3}
    ]
  },
  {
    name: '大侵攻1',
    charisma: 35,
    stamina: 3,
    expectation: 3,
    drops: [
      {name: 'ルビー', icon: 'ruby'},
      {name: 'ロイ', icon: 'roy'},
      {name: '銀精霊', icon: 'silver-sprit'},
      {name: 'ソーマ', icon: 'soma'},
      {name: '竜水晶1', icon: 'dragon-crystal-1', set: 3}
    ]
  },
  {
    name: 'ドラゴニュート',
    charisma: 35,
    stamina: 3,
    expectation: 2.43,
    drops: [
      {name: 'ルビー', icon: 'ruby'},
      {name: 'ミーシャ', icon: 'misha'},
      {name: '銀精霊', icon: 'silver-sprit'},
      {name: 'ベルナール', icon: 'bell'},
      {name: '竜水晶1', icon: 'dragon-crystal-1', set: 3}
    ]
  },
  {
    name: '竜を呼ぶ者',
    charisma: 30,
    stamina: 3,
    expectation: 2.43,
    drops: [
      {name: '水晶', icon: 'crystal'},
      {name: 'ヘクター', icon: 'hector'},
      {name: '銅精霊', icon: 'bronze-sprit'},
      {name: 'フィリス', icon: 'philis'},
      {name: '竜水晶1', icon: 'dragon-crystal-1', set: 3}
    ]
  },
  {
    name: '地底からの侵略',
    charisma: 25,
    stamina: 2,
    expectation: 1.42,
    drops: [
      {name: '水晶', icon: 'crystal'},
      {name: 'バーガン', icon: 'bagan'},
      {name: '銅精霊', icon: 'bronze-sprit'},
      {name: 'モーティマ', icon: 'motima'},
      {name: '竜水晶1', icon: 'dragon-crystal-1', set: 2}
    ]
  },
  {
    name: '大地の大穴',
    charisma: 20,
    stamina: 2,
    expectation: 0.71,
    drops: [
      {name: '花束', icon: 'arus'},
      {name: 'アルス', icon: 'arus'},
      {name: '鉄精霊', icon: 'iron-sprit'},
      {name: 'ハリッサ', icon: 'harissa'},
      {name: '竜水晶1', icon: 'dragon-crystal-1'}
    ]
  }
];

var rewards = [
];


var totalPeriod = periods.reduce(function (total, period) {
  return total + period[1] - period[0];
}, 0);

function update() {
  var current = parseInt($('[name=current]:input').val());
  var objective = parseInt($('[name=objective]:input').val());
  var now = (new Date()).getTime();
  var remains = periods.reduce(function (expired, period) {
    return expired + Math.max(period[1], now) - Math.max(period[0], now);
  }, 0);

  var norma = Math.max(objective - current, 0);
  var days = remains / (1000 * 60 * 60 * 24);
  var norma_per_day = Math.min(norma / days, norma);
  var hours = remains / (1000 * 60 * 60);
  var norma_per_hour = Math.min(norma / hours, norma);
  var minutes = remains / (1000 * 60 * 30);
  var norma_per_minute = Math.min(norma / minutes, norma);
  $('#norma_per_day').text(format(norma_per_day, 4));
  $('#norma_per_hour').text(format(norma_per_hour, 4));
  $('#norma_per_minute').text(format(norma_per_minute, 4));
  $('#remains_days').text(format(days, 0));
  $('#remains_hours').text(format(hours, 0));
  $('#remains_minutes').text(format(hours * 60, 0));

  var collected = Math.min(current, objective) * 100;
  var obj_progress = parseInt(collected / objective) || 0;
  var elapsed = totalPeriod - remains;
  var time_progress = parseInt(elapsed * 100 / totalPeriod) || 0;
  var bar_class;

  if (obj_progress == 100) {
    bar_class = 'progress-bar-success';
  } else if (obj_progress >= time_progress) {
    bar_class = 'progress-bar-success';
  } else if (obj_progress > time_progress * 0.7) {
    bar_class = 'progress-bar-info';
  } else if (obj_progress > time_progress * 0.4) {
    bar_class = 'progress-bar-warning';
  } else {
    bar_class = 'progress-bar-danger';
  }

  $('#objective_progress > .progress-bar')
    .width(obj_progress + '%')
    .removeClass('progress-bar-success progress-bar-info progress-bar-danger progress-bar-warning')
    .addClass(bar_class)
    .children('span')
    .text(obj_progress + '%達成');
  $('#period_progress > .progress-bar')
    .width(time_progress + '%')
    .children('span')
    .text(time_progress + '%経過');

  var estimate = current * totalPeriod / elapsed;
  $('#estimate_num').text(format(Math.floor(estimate)));
  var per = Math.min(estimate / objective, 1);
  var width = $('#objective_progress').width();
  var left = width * per - 47;
  $('.pointer').css('left', left + 'px');
  var margin = width - left < 230 ? -250 : 0;
  $('.pointer-label').css('margin-left', margin + 'px');
}

function format(value, scale) {
  scale = scale || 0;
  return (value === Infinity || value === -Infinity) ? '∞' : value.toFixed(scale);
}

function initialize() {
  var now = (new Date()).getTime();
  var view = $('#period_dates');
  periods.forEach(function (period) {
    var span = period[1] - period[0];
    var width = (span * 100 / totalPeriod) + '%';
    var begin = new Date(period[0]);
    var end = new Date(period[1] - 1);
    var label = (begin.getMonth() + 1) + '/' + begin.getDate() +
      '-' + (end.getMonth() + 1) + '/' + end.getDate();
    var active = now >= period[0] && now < period[1];
    var expired = now >= period[1];
    var klass = active ? 'progress-bar-active'
      : expired ? 'progress-bar-expired' : 'progress-bar-remain';
    $('<div class="progress-bar">')
      .width(width)
      .text(label)
      .addClass(klass)
      .appendTo(view);
  });

  $('[name=current]:input').click(function () {
    this.select();
  }).TouchSpin({
    min: 0,
    max: maxObjective,
    step: 1
  });

  if (objectiveMode == 'achievement') {
    var $objective = $('[name=objective]:input');
    $.each(objectives, function (value, label) {
      $('<option />')
        .attr('value', value)
        .text(label + ' (' + value + '個)')
        .appendTo($objective);
    });
  } else {
    $('[name=objective]:input').click(function () {
      this.select();
    });

    var $list = $('#increse_objective_list');
    prizes.forEach(function (prize) {
      $('<button class="btn btn-default" name="add" type="button" />')
        .val(prize.value)
        .attr('title', prize.name)
        .append($('<i class="fa fa-arrow-up" />'))
        .append($('<i />').addClass('icon icon-' + prize.unit))
        .appendTo($list);
    });
  }

  $('button[name=add]').click(function (e) {
    e.preventDefault();
    var increment = parseInt($(this).val());
    var amount = parseInt($('[name=objective]:input').val());
    $('[name=objective]:input').val(amount + increment);
  });

  $('button[name=reset]').click(function (e) {
    e.preventDefault();
    $('[name=objective]:input').val(0);
  });

  $('[name=expectation]:input').change(function () {
    updateExpectationChart();
    updateMarathon();
  }).val('drop');

  var $prizeList = $('#prize_list');
  prizes.forEach(function (prize) {
    $('<div class="prize-list" />')
      .append($('<h4 class="prize-list-header" />').text(prize.name + '換算')
      .append($('<span class="prize-value" />').text('@' + prize.value)))
      .append($('<div class="prize-list-body" />').attr('data-prize', prize.unit))
      .appendTo($prizeList);
  });

  var maxDrops = maps.reduce(function (num, map) {
    return Math.max(num, map.drops.length);
  }, 0);
  var $tbody = $('#map tbody');

  maps.forEach(function (map, i) {
    var $chart = $('<td />')
      .attr('data-chart', i)
      .append($('<span class="barchart" />'))
      .append($('<span class="barchart-label" />'))
      .append($('<span class="marathon" />'));

    $('<tr />')
      .append($('<th />').text(map.name))
      .append($('<td />').text('' + map.charisma + '/' + map.stamina))
      .append(function () {
        var $drops = map.drops.map(function (drop) {
          var $icon = drop.icon ?
            $('<i />').attr('title', drop.name).addClass('icon icon-' + drop.icon) :
            $('<span />').text(drop.name);

          var $set = drop.set ?
            $('<span class="badge" />').text('x' + drop.set) :
            null;

          return $('<td />')
            .append($icon)
            .append($set);
        });

        for (var i = map.drops.length; i < maxDrops; i++) {
          $drops.push($('<td />'));
        }

        return $drops;
      })
      .append($chart)
      .appendTo($tbody);
  });

  $('#map thead th.drops').attr('colspan', maxDrops);

  if (rewardEnabled) {
    var $rewardList = $('#rewards tbody');
    rewards.forEach(function (reward) {
      $('<tr />')
        .attr('data-amount', reward.amount)
        .append($('<td class="text-right" />').html('<span class="diff"></span> ' + reward.amount))
        .append($('<td />').html('<span class="icon icon-' + reward.unit + '"></span>'))
        .appendTo($rewardList);
    });
  }

  $('*[title]').tooltip();

  var state = loadState();

  $('[name=current]:input').val(state.current);

  if (objectiveMode == 'exchange') {
    $('[name=objective]:input').val(state.objective);
  } else {
    $('[name=objective]:input').val([state.objective]);
  }

  $('[name=current]:input, [name=objective]:input').change(function () {
    state[this.name] = this.value;
    saveState(state);

    updateRewardList();
    updatePrizeList();
    updateMarathon();
  }).trigger('change');

  if (objectiveMode == 'exchange') {
    updatePrizeList();
  }

  if (rewardEnabled) {
    updateRewardList();
  }

  updateExpectationChart();
  updateMarathon();
}

function loadState() {
  var state = {};

  var defaults = {
    current: initialCurrent,
    objective: initialObjective
  };

  try {
    state = JSON.parse($.cookie(cookieName));
  } catch (e) {
  }

  return $.extend(defaults, state);
}

function saveState(state) {
  $.cookie(cookieName, JSON.stringify(state), {expires: 30});
}

function updateRewardList() {
  if (!rewardEnabled) {
    return;
  }

  var stride = 45, slot = 7;
  var current = parseInt($('[name=current]:input').val());
  var rewardList = $('#rewards tbody');
  rewardList.find('tr').removeClass('active').each(function () {
    var self = $(this);
    var delta = self.attr('data-amount') - current;
    if (delta < -stride) {
      self.hide();
    } else if (delta < 0) {
      self.css('opacity', 0.5).show();
    } else if (delta < stride) {
      self.addClass('active').css('opacity', 1).show();
    } else if (delta < stride * slot) {
      var opacity = 1 - Math.floor(delta / stride) * stride / (stride * (slot + 1));
      self.show().css('opacity', opacity);
    } else {
      self.hide();
    }
    var klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
    var text = delta === 0 ? '' : (delta > 0 ? '+' : '') + delta;
    self.find('span.diff')
      .removeClass('diff-eq diff-plus diff-minus')
      .addClass(klass)
      .text(text);
  });
}

function updatePrizeList() {
  if (objectiveMode != 'exchange') {
    return;
  }

  var current = parseInt($('[name=current]:input').val());
  prizes.forEach(function (prize) {
    var $container = $('[data-prize="' + prize.unit + '"]').empty();
    for (var i = 0; i < current; i += prize.value) {
      var icon = $('<i />').addClass('icon icon-' + prize.unit);
      var width = 25 * Math.min(current - i, prize.value) / prize.value;
      $('<div class="prize-gage" />')
        .append(icon.clone().css({position: 'absolute', opacity: 0.2, boxShadow: 'none', paddingRight: 25 - width}))
        .append(icon.clone().css({width: width + 'px'}))
        .appendTo($container);
    }
  });
}

function updateExpectationChart() {
  var mode = $('[name=expectation]:input').val();
  var min = Infinity, max = 0;
  var dividor = mode == 'drop' ? null : mode;
  var data = maps.map(function (map) {
    var value = map.expectation / ((dividor && map[dividor]) || 1);
    min = 0; // Math.min(min, value);
    max = Math.max(max, value);
    return value;
  });

  var scale = dividor ? 3 : 2;
  maps.forEach(function (map, i) {
    var $chart = $('[data-chart=' + i + ']');
    var value = data[i];
    var rate = value / (max - min);

    var hue = 120 * rate + 240;
    $chart.find('span.barchart-label').text(format(value, scale) + '個');
    $chart.find('span.barchart')
      .css({
        width: (rate * 100) + '%',
        backgroundColor: 'hsla(' + hue + ', 80%, 50%, 0.5)'
      });
  });
}

function updateMarathon() {
  var objective = parseInt($('[name=objective]:input').val());
  var current = parseInt($('[name=current]:input').val());
  var norma = Math.max(objective - current, 0);
  maps.forEach(function (map, i) {
    var $chart = $('[data-chart=' + i + ']');
    var marathon = norma ? Math.ceil(norma / map.expectation) : 0;
    $chart.find('span.marathon').text('残り' + format(marathon) + '周');
  });
}

$(function () {
  initialize();
  setInterval(update, 1000);
});
