webpackJsonp([1],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';

	__webpack_require__(2);

	// [begin...end)
	var periods = [
	  ['2015/02/05 15:00:00', '2015/02/12 10:00:00'],
	  ['2015/02/12 15:00:00', '2015/02/19 10:00:00']
	].map(function (period) {
	  return period.map(Date.parse);
	});

	var objectiveMode = 'achievement'; // 'achievement' or 'exchange'
	var maxObjective = Infinity;
	var initialObjective = 1500;
	var initialCurrent = 20;
	var rewardEnabled = true;
	var cookieName = 'treasure-fragment-timer';
	var initialEstimateMap = 0;
	var initialEstimateRank = 100;
	var initialEstimateUseCrystal = 'both';
	var initialEstimateNaturalRecovery = true;

	var objectives = {
	  '25': 'エーテルが仲間になる',
	  '50': 'リアナが仲間になる',
	  '100': '初期レベル10',
	  '200': '初期レベル20',
	  '300': 'スキルレベル2',
	  '400': '出撃コスト-1',
	  '500': '初期レベル20',
	  '600': 'スキルレベル3',
	  '700': '出撃コスト-2',
	  '800': '初期レベル40',
	  '900': 'スキルレベル4',
	  '1000': '出撃コスト-3',
	  '1100': '初期レベル50',
	  '1200': 'スキルレベル5',
	  '1400': '出撃コスト-4',
	  '1500': '出撃コスト-5'
	};

	var prizes = [
	];

	var maps = [
	  {
	    name: '強魔大結集',
	    charisma: 90,
	    stamina: 12,
	    expectation: 22,
	    drops: [
	      {name: 'カケラ5', icon: 'treasure-fragment-5', set: 3},
	      {name: 'カケラ3', icon: 'treasure-fragment-3', set: 2},
	      {name: 'カケラ1', icon: 'treasure-fragment-1'},
	      {name: '虹精霊', icon: 'rainbow-sprit'}
	    ]
	  },
	  {
	    name: '合成魔獣',
	    charisma: 70,
	    stamina: 8,
	    expectation: 13,
	    drops: [
	      {name: 'カケラ5', icon: 'treasure-fragment-5', set: 2},
	      {name: 'カケラ3', icon: 'treasure-fragment-3'},
	      {name: 'カリオペ', icon: 'calliope'},
	      {name: 'ルビー', icon: 'ruby', set: 2}
	    ]
	  },
	  {
	    name: '怪しげな冒険者たち',
	    charisma: 40,
	    stamina: 5,
	    expectation: 7,
	    drops: [
	      {name: 'カケラ5', icon: 'treasure-fragment-5', set: 2},
	      {name: 'カケラ1', icon: 'treasure-fragment-1'},
	      {name: 'サノスケ', icon: 'sanosuke'},
	      {name: '魔水晶1', icon: 'magical-crystal-1'}
	    ]
	  },
	  {
	    name: '触手の脅威',
	    charisma: 35,
	    stamina: 3,
	    expectation: 4,
	    drops: [
	      {name: 'カケラ5', icon: 'treasure-fragment-5', set: 2},
	      {name: 'カケラ1', icon: 'treasure-fragment-1'},
	      {name: 'バラッド', icon: 'barrad'},
	      {name: '金精霊', icon: 'gold-sprit'}
	    ]
	  },
	  {
	    name: '大魔行列',
	    charisma: 50,
	    stamina: 7,
	    expectation: 11,
	    drops: [
	      {name: 'カケラ5', icon: 'treasure-fragment-5', set: 2},
	      {name: 'カケラ1', icon: 'treasure-fragment-1'},
	      {name: 'クリストファー', icon: 'christ'},
	      {name: '黒精霊', icon: 'black-sprit'}
	    ]
	  },
	  {
	    name: '凶魔の巣窟',
	    charisma: 40,
	    stamina: 4,
	    expectation: 5,
	    drops: [
	      {name: 'カケラ3', icon: 'treasure-fragment-3'},
	      {name: 'カケラ1', icon: 'treasure-fragment-1', set: 2},
	      {name: 'アサル', icon: 'atholl'},
	      {name: '魔水晶3', icon: 'magical-crystal-3'}
	    ]
	  },
	  {
	    name: '魔物の奇襲',
	    charisma: 35,
	    stamina: 2,
	    expectation: 2,
	    drops: [
	      {name: 'カケラ1', icon: 'treasure-fragment-1', set: 2},
	      {name: 'ダニエラ', icon: 'daniela'},
	      {name: '水晶', icon: 'crystal'}
	    ]
	  },
	  {
	    name: '至宝のカケラ',
	    charisma: 20,
	    stamina: 1,
	    expectation: 1,
	    drops: [
	      {name: 'カケラ1', icon: 'treasure-fragment-1'}
	    ]
	  }
	];

	var rewards = [
	  {amount: 45, unit: 'gold-bucket'},
	  {amount: 90, unit: 'gold-sprit'},
	  {amount: 135, unit: 'platinum-bucket'},
	  {amount: 180, unit: 'gold-sprit'},
	  {amount: 225, unit: 'crystal-fragment'},
	  {amount: 270, unit: 'platinum-sprit'},
	  {amount: 315, unit: 'gold-bucket'},
	  {amount: 360, unit: 'platinum-sprit'},
	  {amount: 405, unit: 'platinum-bucket'},
	  {amount: 450, unit: 'black-sprit'},
	  {amount: 495, unit: 'crystal-fragment'},
	  {amount: 540, unit: 'black-sprit'},
	  {amount: 585, unit: 'gold-bucket'},
	  {amount: 630, unit: 'rainbow-sprit'},
	  {amount: 675, unit: 'platinum-bucket'},
	  {amount: 720, unit: 'platinum-sprit'},
	  {amount: 765, unit: 'crystal-fragment'},
	  {amount: 810, unit: 'platinum-sprit'},
	  {amount: 855, unit: 'gold-bucket'},
	  {amount: 900, unit: 'black-sprit'},
	  {amount: 945, unit: 'platinum-bucket'},
	  {amount: 990, unit: 'platinum-sprit'},
	  {amount: 1035, unit: 'crystal-fragment'},
	  {amount: 1080, unit: 'platinum-sprit'},
	  {amount: 1125, unit: 'gold-bucket'},
	  {amount: 1170, unit: 'black-sprit'},
	  {amount: 1215, unit: 'platinum-bucket'},
	  {amount: 1260, unit: 'black-sprit'},
	  {amount: 1305, unit: 'crystal-fragment'},
	  {amount: 1350, unit: 'rainbow-sprit'},
	  {amount: 1395, unit: 'gold-bucket'},
	  {amount: 1440, unit: 'platinum-sprit'},
	  {amount: 1485, unit: 'platinum-bucket'},
	  {amount: 1530, unit: 'platinum-sprit'},
	  {amount: 1575, unit: 'crystal-fragment'},
	  {amount: 1620, unit: 'black-sprit'},
	  {amount: 1665, unit: 'gold-bucket'},
	  {amount: 1710, unit: 'black-sprit'},
	  {amount: 1755, unit: 'platinum-bucket'},
	  {amount: 1800, unit: 'rainbow-sprit'}
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
	  var amount = format(norma_per_day, 3).split('.');
	  $('#norma_per_day')
	    .find('.norma-amount-actual').text(amount[0]).parent()
	    .find('.norma-amount-fraction').text('.' + amount[1]).parent();
	  amount = format(norma_per_hour, 3).split('.');
	  $('#norma_per_hour')
	    .find('.norma-amount-actual').text(amount[0]).parent()
	    .find('.norma-amount-fraction').text('.' + amount[1]).parent();
	  amount = format(norma_per_minute, 3).split('.');
	  $('#norma_per_minute')
	    .find('.norma-amount-actual').text(amount[0]).parent()
	    .find('.norma-amount-fraction').text('.' + amount[1]).parent();
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
	  $('#prediction_collection').text(format(Math.floor(estimate)));
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

	  $('[data-objective-mode="' + objectiveMode + '"]').show();
	  $('[data-objective-mode][data-objective-mode!="' + objectiveMode + '"]').remove();

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
	    $('select[name=objective]').click(function () {
	      this.select();
	    });

	    var $list = $('#increse_objective_list');
	    prizes.forEach(function (prize) {
	      $('<button class="btn btn-default" name="add"  type="button" />')
	        .val(prize.value)
	        .attr('title', prize.name)
	        .append($('<i class="fa fa-arrow-up" />'))
	        .append($('<span />').addClass('icon icon-' + prize.unit))
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
	      .append($('<h4 class="prize-list-header" />').text(prize.name)
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

	  var $estimateMap = $('[name=estimate_map]:input').change(function () {
	    updateEstimate();
	    state.estimateMap = parseInt($(this).val());
	    saveState(state);
	  });

	  maps.forEach(function (map, index) {
	    $('<option />')
	      .val(index)
	      .text(map.name + ' (' + map.charisma + '/' + map.stamina + ')')
	      .appendTo($estimateMap);
	  });

	  var $estimateRank = $('[name=estimate_rank]:input').change(function () {
	    updateEstimate();
	    state.estimateRank = parseInt($(this).val());
	    saveState(state);
	  });

	  for (var rank = 1; rank <= 200; rank++) {
	    var charisma = calculateCharismaCapacity(rank);
	    var stamina = calculateStaminaCapacity(rank);
	    var label = '' + rank + ' (' + charisma + '/' + stamina + ')';
	    $('<option />').val(rank).text(label).appendTo($estimateRank);
	  }

	  var $estimateUseCrystal = $('[name=estimate_use_crystal]').change(function () {
	    updateEstimate();
	    state.estimateUseCrystal = $(this).val();
	    saveState(state);
	  });

	  var $estimateNaturalRecovery = $('[name=estimate_natural_recovery]:input').change(function () {
	    updateEstimate();
	    state.estimateNaturalRecovery = this.checked;
	    saveState(state);
	  });

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
	    updateEstimate();
	  });

	  $estimateMap.val(state.estimateMap);
	  $estimateRank.val(state.estimateRank);
	  $estimateUseCrystal.val(state.estimateUseCrystal);
	  $estimateNaturalRecovery.prop('checked', state.estimateNaturalRecovery);

	  if (objectiveMode == 'exchange') {
	    updatePrizeList();
	  }

	  if (rewardEnabled) {
	    updateRewardList();
	  }

	  updateExpectationChart();
	  updateMarathon();
	  updateEstimate();
	}

	function loadState() {
	  var state = {};

	  var defaults = {
	    current: initialCurrent,
	    objective: initialObjective,
	    estimateMap: initialEstimateMap,
	    estimateRank: initialEstimateRank,
	    estimateUseCrystal: initialEstimateUseCrystal,
	    estimateNaturalRecovery: initialEstimateNaturalRecovery
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

	function updateEstimate() {
	  var current = parseInt($('[name=current]:input').val());
	  var objective = parseInt($('[name=objective]:input').val());
	  var map = maps[parseInt($('[name=estimate_map]:input').val())];
	  var left = Math.max(objective - current, 0);
	  var requiredMarathon = Math.ceil(left / map.expectation);
	  $('#estimate_required_marathon').text(requiredMarathon);

	  var now = (new Date()).getTime();
	  var remains = periods.reduce(function (expired, period) {
	    return expired + Math.max(period[1], now) - Math.max(period[0], now);
	  }, 0);
	  var useNaturalRecovery = 0 + $('[name=estimate_natural_recovery]:input').prop('checked');
	  var naturalRecoveryCharisma = Math.floor(remains / (1000 * 60 * 3)) * useNaturalRecovery;
	  var naturalRecoveryStamina = Math.floor(remains / (1000 * 60 * 60)) * useNaturalRecovery;

	  var rank = parseInt($('[name=estimate_rank]').val());
	  var capacityCharisma = calculateCharismaCapacity(rank);
	  var capacityStamina = calculateStaminaCapacity(rank);
	  var requiredCharisma = Math.ceil(map.charisma * requiredMarathon);
	  var requiredStamina = Math.ceil(map.stamina * requiredMarathon);
	  var useCrystal = $('[name=estimate_use_crystal]:input').val();
	  var useForCharisma = 0 + (useCrystal === 'both' || useCrystal === 'charisma');
	  var useForStamina = 0 + (useCrystal === 'both' || useCrystal === 'stamina');
	  var charismaCrystal = Math.ceil(Math.max(requiredCharisma - naturalRecoveryCharisma, 0) / capacityCharisma) * useForCharisma;
	  var staminaCrystal = Math.ceil(Math.max(requiredStamina - naturalRecoveryStamina, 0) / capacityStamina) * useForStamina;
	  var requiredCrystal = charismaCrystal + staminaCrystal;
	  $('#estimate_required_crystal').text(requiredCrystal);

	  var klass = charismaCrystal === 0 ? 'diff-eq' : charismaCrystal > 0 ? 'diff-plus' : 'diff-minus';
	  $('#estimate_required_crystal_for_charisma').attr('class', klass).text(charismaCrystal);

	  klass = staminaCrystal === 0 ? 'diff-eq' : staminaCrystal > 0 ? 'diff-plus' : 'diff-minus';
	  $('#estimate_required_crystal_for_stamina').attr('class', klass).text(staminaCrystal);

	  var availableCharisma = naturalRecoveryCharisma + (capacityCharisma * charismaCrystal);
	  var availableStamina = naturalRecoveryStamina + (capacityStamina * staminaCrystal);
	  var availableMarathon = Math.floor(Math.min(availableCharisma / map.charisma, availableStamina / map.stamina, requiredMarathon));
	  $('#estimate_available_marathon').text(availableMarathon);

	  var delta = availableMarathon - requiredMarathon;
	  klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
	  var text = (delta >= 0 ? '+' : '') + delta;
	  $('#estimate_available_marathon_diff').attr('class', klass).text(text);

	  var usingCharisma = map.charisma * availableMarathon;
	  $('#estimate_using_charisma').text(usingCharisma);

	  delta = usingCharisma - requiredCharisma;
	  klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
	  text = (delta >= 0 ? '+' : '') + delta;
	  $('#estimate_using_charisma_diff').attr('class', klass).text(text);

	  var usingStamina = Math.ceil(map.stamina * availableMarathon);
	  $('#estimate_using_stamina').text(usingStamina);

	  delta = usingStamina - requiredStamina;
	  klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
	  text = (delta >= 0 ? '+' : '') + delta;
	  $('#estimate_using_stamina_diff').attr('class', klass).text(text);

	  var result = current + Math.ceil(map.expectation * availableMarathon);
	  $('#estimate_result_collection').text(result);

	  delta = result - objective;
	  klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
	  text = (delta >= 0 ? '+' : '') + delta;
	  $('#estimate_result_collection_diff').attr('class', klass).text(text);
	}

	function calculateCharismaCapacity(rank) {
	  return 27 + (rank <= 100 ? rank * 3 : 300 + rank - 100);
	}

	function calculateStaminaCapacity(rank) {
	  return 12 + (rank <= 100 ? 0 : (Math.floor((rank - 100) / 20) + 1));
	}

	$(function () {
	  initialize();
	  setInterval(update, 1000);
	});
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }
]);