// [begin...end)
let periods = [
  ['2015/08/27 16:00:00', '2015/09/03 10:00:00'],
  ['2015/09/03 15:00:00', '2015/09/10 10:00:00']
];

let objectives = {
  '25': 'ピピンが仲間になる',
  '50': 'スキルレベル2',
  '100': '初期レベル10',
  '150': 'スキルレベル3',
  '200': '出撃コスト-1',
  '250': 'スキルレベル4',
  '300': '出撃コスト-2',
  '400': 'スキルレベル5',
  '500': '初期レベル20',
  '600': 'スキルレベル6',
  '700': '出撃コスト-3',
  '800': 'スキルレベル7',
  '900': '初期レベル30',
  '1000': 'スキルレベル8',
  '1100': '出撃コスト-4',
  '1200': '初期レベル40',
  '1300': 'スキルレベル9',
  '1400': '出撃コスト-5',
  '1500': 'スキルレベル10',
  '1600': '初期レベル50',
  '1620': '+ 黒聖霊',
  '1665': '+ ゴールドアーマー',
  '1710': '+ 黒聖霊',
  '1755': '+ プラチナアーマー',
  '1800': '+ 虹聖霊'
};

let prizes = [
];

let maps = [
  {
    name: '紅の霧の脅威',
    charisma: 20,
    stamina: 1,
    expectation: 2,
    drops: [
      {name: '魔神の骨片1', icon: 'demon-bone-1', set: 2},
      {name: '花束', icon: 'flower'}
    ]
  },
  {
    name: '密林の防衛戦',
    charisma: 30,
    stamina: 2,
    expectation: 3,
    drops: [
      {name: '魔神の骨片1', icon: 'demon-bone-1', set: 3},
      {name: 'フューネス', icon: 'funes'},
      {name: '魔水晶', icon: 'demon-crystal-1'}
    ]
  },
  {
    name: '猛追の奪還戦',
    charisma: 40,
    stamina: 4,
    expectation: 6,
    drops: [
      {name: '魔神の骨片3', icon: 'demon-bone-3', set: 1},
      {name: '魔神の骨片5', icon: 'demon-bone-1', set: 3},
      {name: 'ソーマ', icon: 'soma'},
      {name: 'バラッド', icon: 'barrad'}
    ]
  },
  {
    name: '魔神の骨の力',
    charisma: 50,
    stamina: 7,
    expectation: 16,
    drops: [
      {name: '魔神の骨片5', icon: 'demon-bone-5', set: 2},
      {name: '魔神の骨片3', icon: 'demon-bone-3', set: 2},
      {name: 'ジョバンニ', icon: 'giovanni'},
      {name: '白銀の聖霊', icon: 'platinum-sprit'}
    ]
  },
  {
    name: '忍者と盗賊',
    charisma: 80,
    stamina: 9,
    expectation: 15,
    drops: [
      {name: '魔神の骨片5', icon: 'demon-bone-5', set: 3},
      {name: 'リカルド', icon: 'ricard'},
      {name: '白バケツ', icon: 'platinum-bucket'},
      {name: '魔水晶', icon: 'demon-crystal-2'}
    ]
  },
  {
    name: '紅の包囲網',
    charisma: 40,
    stamina: 5,
    expectation: 6,
    drops: [
      {name: '魔神の骨片3', icon: 'demon-bone-3', set: 1},
      {name: '魔神の骨片1', icon: 'demon-bone-1', set: 3},
      {name: 'カゲロウ', icon: 'kagerou'},
      {name: '白バケツ', icon: 'platinum-bucket'}
    ]
  },
  {
    name: '邪悪な共謀',
    charisma: 70,
    stamina: 8,
    expectation: 13,
    drops: [
      {name: '魔神の骨片5', icon: 'demon-bone-5', set: 2},
      {name: '魔神の骨片3', icon: 'demon-bone-3', set: 1},
      {name: 'ルビー', icon: 'ruby'},
      {name: 'ミーシャ', icon: 'misha'}
    ]
  },
  {
    name: '魔に身を捧げし者',
    charisma: 90,
    stamina: 12,
    expectation: 26,
    drops: [
      {name: '魔神の骨片5', icon: 'demon-bone-5', set: 4},
      {name: '魔神の骨片3', icon: 'demon-bone-3', set: 2},
      {name: '虹の聖霊', icon: 'rainbow-sprit'}
    ]
  },
  {
    name: 'ピピンの決心',
    charisma: 100,
    stamina: 2,
    expectation: 0,
    drops: [
      {name: '金の聖霊', icon: 'gold-sprit'},
      {name: '白の聖霊', icon: 'platinum-sprit'},
      {name: '黒の聖霊', icon: 'black-sprit'},
      {name: '虹の聖霊', icon: 'rainbow-sprit'}
    ]
  }
];

let rewards = [
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

let objectiveMode = 'achievement'; // 'achievement' or 'exchange'
let maxObjective = Infinity;
let rewardEnabled = true;
let cookieName = 'demon-bone-timer';
let defaultChart = 'stamina';
let expectationInputMode = 'direct'; // 'aggregate' or 'direct'
let syncCurrentEnabled = true;

let defaultState = {
  current: 20,
  objective: 1500,
  estimateMap: 7,
  estimateRank: 100,
  estimateUseCrystal: 'both',
  estimateNaturalRecovery: true,
  expectationInputMode: expectationInputMode,
  syncCurrentEnabled: syncCurrentEnabled,
  maps: maps.map(function (map) {
    return {
      numLaps: 1,
      numDrops: Math.floor(map.expectation),
      expectation: map.expectation
    };
  }),
  estimateTutorialHidden: false,
  version: 2,
};

periods = periods.map(function (period) {
  return period.map(Date.parse);
});

let totalPeriod = periods.reduce(function (total, period) {
  return total + period[1] - period[0];
}, 0);

function calculateCharismaCapacity(rank) {
  return 27 + (rank <= 100 ? rank * 3 : 300 + rank - 100);
}

function calculateStaminaCapacity(rank) {
  return 12 + (rank <= 100 ? 0 : (Math.floor((rank - 100) / 20) + 1));
}

function format(value, scale) {
  scale = scale || 0;

  if (isNaN(value)) {
    return '?';
  }

  if (value === Infinity || value === -Infinity) {
    return '∞';
  }

  let parts = value.toFixed(scale).split('.');
  let decimal = parseInt(parts[0]);

  return decimal.toLocaleString() + (parts.length === 1 ? '' : '.' + parts[1]);
}

function syncCurrent() {
  if (!syncCurrentEnabled) {
    return;
  }

  let current = $('#map')
    .find('tbody tr input[name=num_drops]')
    .map(function () {
      return parseInt($(this).val()) || 0;
    })
    .toArray()
    .reduce(function (total, num) {
      return total + num;
    }, 0);

  $('input[name=current]').val(current).trigger('change');
}

function loadState() {
  let state = {};

  try {
    state = JSON.parse($.cookie(cookieName));

    if (state.version === undefined) {
      state.version = 1;
    }
  } catch (e) {
    console.warn(e);
  }

  return $.extend(true, defaultState, state);
}

function saveState(state) {
  $.cookie(cookieName, JSON.stringify(state), {expires: 30});
}

function updateRewardList() {
  if (!rewardEnabled) {
    return;
  }

  let stride = 45, slot = 7;
  let current = parseInt($('[name=current]:input').val());
  let rewardList = $('#rewards tbody');
  rewardList.find('tr').removeClass('active').each(function () {
    let self = $(this);
    let delta = self.attr('data-amount') - current;
    if (delta < -stride) {
      self.hide();
    } else if (delta < 0) {
      self.css('opacity', 0.5).show();
    } else if (delta < stride) {
      self.addClass('active').css('opacity', 1).show();
    } else if (delta < stride * slot) {
      let opacity = 1 - Math.floor(delta / stride) * stride / (stride * (slot + 1));
      self.show().css('opacity', opacity);
    } else {
      self.hide();
    }
    let klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
    let text = delta === 0 ? '' : (delta > 0 ? '+' : '') + delta;
    self.find('span.diff')
      .removeClass('diff-eq diff-plus diff-minus')
      .addClass(klass)
      .text(text);
  });
}

function updatePrizeList() {
  if (objectiveMode !== 'exchange') {
    return;
  }

  let current = parseInt($('[name=current]:input').val());
  prizes.forEach(function (prize) {
    let $container = $('[data-prize="' + prize.unit + '"]').empty();
    for (let i = 0; i < current; i += prize.value) {
      let icon = $('<i />').addClass('icon icon-' + prize.unit);
      let width = 25 * Math.min(current - i, prize.value) / prize.value;
      $('<div class="prize-gage" />')
        .append(icon.clone().css({position: 'absolute', opacity: 0.2, boxShadow: 'none', paddingRight: 25 - width}))
        .append(icon.clone().css({width: width + 'px'}))
        .appendTo($container);
    }
  });
}

function updateExpectationChart() {
  let mode = $('[name=expectation]:input').val();
  let min = Infinity, max = 0;
  let dividor = mode === 'drop' ? null : mode;
  let data = maps.map(function (map) {
    let value = map.expectation / ((dividor && map[dividor]) || 1);
    min = 0; // Math.min(min, value);
    max = Math.max(max, value);
    return value;
  });

  let scale = dividor ? 3 : 2;
  maps.forEach(function (map, i) {
    let $chart = $('[data-chart=' + i + ']');
    let value = data[i];
    let rate = value / (max - min);
    let hue = 120 * rate + 240;
    $chart.find('span.barchart-label').text(format(value, scale) + '個');
    $chart.find('span.barchart')
      .css({
        width: (rate * 100) + '%',
        backgroundColor: 'hsla(' + hue + ', 80%, 50%, 0.5)'
      });
  });
}

function updateMarathon() {
  let objective = parseInt($('[name=objective]:input').val());
  let current = parseInt($('[name=current]:input').val());
  let norma = Math.max(objective - current, 0);
  maps.forEach(function (map, i) {
    let $chart = $('[data-chart=' + i + ']');
    let marathon = norma ? Math.ceil(norma / map.expectation) : 0;
    $chart.find('span.marathon').text('残り' + format(marathon) + '周');
  });
}

function updateEstimate() {
  let current = parseInt($('[name=current]:input').val());
  let objective = parseInt($('[name=objective]:input').val());
  let map = maps[parseInt($('[name=estimate_map]:input').val())];
  let left = Math.max(objective - current, 0);
  let requiredMarathon = Math.ceil(left / map.expectation);
  $('#estimate_required_marathon').text(format(requiredMarathon));

  let now = (new Date()).getTime();
  let remains = periods.reduce(function (expired, period) {
    return expired + Math.max(period[1], now) - Math.max(period[0], now);
  }, 0);
  let useNaturalRecovery = 0 + $('[name=estimate_natural_recovery]:input').prop('checked');
  let naturalRecoveryCharisma = Math.floor(remains / (1000 * 60 * 3)) * useNaturalRecovery;
  let naturalRecoveryStamina = Math.floor(remains / (1000 * 60 * 60)) * useNaturalRecovery;

  let rank = parseInt($('[name=estimate_rank]').val());
  let capacityCharisma = calculateCharismaCapacity(rank);
  let capacityStamina = calculateStaminaCapacity(rank);
  let requiredCharisma = Math.ceil(map.charisma * requiredMarathon);
  let requiredStamina = Math.ceil(map.stamina * requiredMarathon);
  let useCrystal = $('[name=estimate_use_crystal]:input').val();
  let useForCharisma = 0 + (useCrystal === 'both' || useCrystal === 'charisma');
  let useForStamina = 0 + (useCrystal === 'both' || useCrystal === 'stamina');
  let suppliedCharisma = useForCharisma ? requiredCharisma : naturalRecoveryCharisma;
  let suppliedStamina = useForStamina ? requiredStamina : naturalRecoveryStamina;
  let availableMarathon = Math.floor(Math.min(suppliedCharisma / map.charisma, suppliedStamina / map.stamina));
  $('#estimate_available_marathon').text(format(availableMarathon));

  let charismaCrystal = Math.ceil(Math.max(map.charisma * availableMarathon - naturalRecoveryCharisma, 0) / capacityCharisma);
  let staminaCrystal = Math.ceil(Math.max(map.stamina * availableMarathon - naturalRecoveryStamina, 0) / capacityStamina);
  let requiredCrystal = charismaCrystal + staminaCrystal;
  $('#estimate_required_crystal').text(format(requiredCrystal));

  let klass = charismaCrystal === 0 ? 'diff-eq' : charismaCrystal > 0 ? 'diff-plus' : 'diff-minus';
  $('#estimate_required_crystal_for_charisma').attr('class', klass).text(format(charismaCrystal));

  klass = staminaCrystal === 0 ? 'diff-eq' : staminaCrystal > 0 ? 'diff-plus' : 'diff-minus';
  $('#estimate_required_crystal_for_stamina').attr('class', klass).text(format(staminaCrystal));

  let delta = availableMarathon - requiredMarathon;
  klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
  let text = (delta >= 0 ? '+' : '') + format(delta);
  $('#estimate_available_marathon_diff').attr('class', klass).text(text);

  let usingCharisma = map.charisma * availableMarathon;
  $('#estimate_using_charisma').text(format(usingCharisma));

  delta = usingCharisma - requiredCharisma;
  klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
  text = (delta >= 0 ? '+' : '') + format(delta);
  $('#estimate_using_charisma_diff').attr('class', klass).text(text);

  let usingStamina = Math.ceil(map.stamina * availableMarathon);
  $('#estimate_using_stamina').text(format(usingStamina));

  delta = usingStamina - requiredStamina;
  klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
  text = (delta >= 0 ? '+' : '') + format(delta);
  $('#estimate_using_stamina_diff').attr('class', klass).text(text);

  let result = current + Math.floor(map.expectation * availableMarathon);
  $('#estimate_result_collection').text(format(result));

  delta = result - objective;
  klass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
  text = (delta >= 0 ? '+' : '') + format(delta);
  $('#estimate_result_collection_diff').attr('class', klass).text(text);
}

function update() {
  let current = parseInt($('[name=current]:input').val());
  let objective = parseInt($('[name=objective]:input').val());
  let now = (new Date()).getTime();
  let remains = periods.reduce(function (expired, period) {
    return expired + Math.max(period[1], now) - Math.max(period[0], now);
  }, 0);

  let norma = Math.max(objective - current, 0);
  let days = remains / (1000 * 60 * 60 * 24);
  let norma_per_day = norma / Math.max(days, 1);
  let hours = remains / (1000 * 60 * 60);
  let norma_per_hour = norma / Math.max(hours, 1);
  let minutes = remains / (1000 * 60 * 30);
  let norma_per_minute = norma / Math.max(minutes, 1);
  let amount = format(norma_per_day, 3).split('.');
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

  let collected = Math.min(current, objective) * 100;
  let obj_progress = parseInt(collected / objective) || 0;
  let elapsed = totalPeriod - remains;
  let time_progress = parseInt(elapsed * 100 / totalPeriod) || 0;
  let bar_class;

  if (obj_progress === 100) {
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

  let estimate = current * totalPeriod / elapsed;
  $('#prediction_collection').text(format(Math.floor(estimate)));

  let per = Math.min(estimate / objective, 1);
  let width = $('#objective_progress').width();
  let left = width * per - 47;
  $('.pointer').css('left', left + 'px');
  let margin = width - left < 230 ? -250 : 0;
  $('.pointer-label').css('margin-left', margin + 'px');

  let completionDate = '';
  if (current < objective && estimate >= objective) {
    let start, end;
    periods.forEach(function (period) {
      start = start || period[0];
      end = end || period[1];
    });

    let completionSpan = objective / estimate * totalPeriod;
    let date = periods.reduce(function (date, period) {
      if (date) {
        return date;
      }

      let span = period[1] - period[0];
      if (span < completionSpan) {
        completionSpan -= span;
        return null;
      }

      return new Date(period[0] + completionSpan);
    }, null);
    let m = date.getMonth(), d = date.getDate(), h = date.getHours(), i = date.getMinutes();
    let formatted = (m + 1) + '/' + d + ' ' + (h < 10 ? '0' + h : h) + ':' + (i < 10 ? '0' + i : i);
    completionDate = formatted + '頃に目標達成できそうよ。';
  }

  $('#prediction_completion_date').text(completionDate);
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Using_CSS_animations/Detecting_CSS_animation_support
 */
function isAnimationSupported() {
  let domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
    elm = document.createElement('div');

  if (elm.style.animationName !== undefined) {
    return true;
  }

  for (let i = 0; i < domPrefixes.length; i++) {
    if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
      return true;
    }
  }

  return false;
}

function initialize() {
  let now = (new Date()).getTime();
  let view = $('#period_dates');
  periods.forEach(function (period) {
    let span = period[1] - period[0];
    let width = (span * 100 / totalPeriod) + '%';
    let begin = new Date(period[0]);
    let end = new Date(period[1] - 1);
    let label = (begin.getMonth() + 1) + '/' + begin.getDate() +
      '-' + (end.getMonth() + 1) + '/' + end.getDate();
    let active = now >= period[0] && now < period[1];
    let expired = now >= period[1];
    let klass = active ? 'progress-bar-active'
      : expired ? 'progress-bar-expired' : 'progress-bar-remain';
    $('<div class="progress-bar">')
      .width(width)
      .text(label)
      .addClass(klass)
      .appendTo(view);
  });

  $('[data-objective-mode="' + objectiveMode + '"]').show();
  $('[data-objective-mode][data-objective-mode!="' + objectiveMode + '"]').remove();

  $('[name=current]:input')
    .click(function () {
      this.select();
    })
    .TouchSpin({
      min: 0,
      max: maxObjective,
      step: 1
    });

  if (objectiveMode === 'achievement') {
    let $objective = $('[name=objective]:input');
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

    let $list = $('#increse_objective_list');
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
    let increment = parseInt($(this).val());
    let amount = parseInt($('[name=objective]:input').val());
    $('[name=objective]:input').val(amount + increment).trigger('change');
  });

  $('button[name=reset]').click(function (e) {
    e.preventDefault();
    $('[name=objective]:input').val(0).trigger('change');
  });

  $('[name=expectation]:input').change(function () {
    updateExpectationChart();
    updateMarathon();
  }).val(defaultChart);

  let $prizeList = $('#prize_list');
  prizes.forEach(function (prize) {
    $('<div class="prize-list" />')
      .append($('<h4 class="prize-list-header" />').text(prize.name)
      .append($('<span class="prize-value" />').text('@' + prize.value)))
      .append($('<div class="prize-list-body" />').attr('data-prize', prize.unit))
      .appendTo($prizeList);
  });

  let maxDrops = maps.reduce(function (num, map) {
    return Math.max(num, map.drops.length);
  }, 0);

  let state = loadState();

  state.maps.forEach(function (mapState, mapId) {
    maps[mapId].expectation = mapState.expectation;
  });

  syncCurrentEnabled = state.syncCurrentEnabled;

  let updateExpectationTimer;
  let updateExpectation = function () {
    if (updateExpectationTimer) {
      clearTimeout(updateExpectationTimer);
    }

    setTimeout(function () {
      let $map = $('#map');

      maps.forEach(function (map, mapId) {
        let $tr = $map.find('tr[data-map=' + mapId + ']');
        let numLaps = Math.max(parseInt($tr.find('input[name=num_laps]').val()) || 0, 0);
        let numDrops = Math.max(parseInt($tr.find('input[name=num_drops]').val()) || 0, 0);
        let $expectation = $tr.find('input[name=actual_expectation]');
        let expectation = Math.max(parseFloat($expectation.val()) || 0, 0);

        if (expectationInputMode === 'aggregate') {
          expectation = (numDrops / numLaps) || 0;
          $expectation.val(expectation);
        }

        let increment = Math.floor(expectation);
        $tr
          .find('button[name=increase]')
          .val(increment)
          .text('+' + format(increment));

        state.maps[mapId].numLaps = numLaps;
        state.maps[mapId].numDrops = numDrops;
        map.expectation = state.maps[mapId].expectation = expectation;
      });

      saveState(state);

      updateEstimate();
      updateExpectationChart();
      updateMarathon();
    }, 100);
  };

  let $map = $('#map')
    .on('keyup', 'input[type=number]', function () {
      updateExpectation();
      syncCurrent();
    })
    .on('change', 'input[type=number]', function () {
      updateExpectation();
      syncCurrent();
    })
    .on('click', 'input[type=number]', function () {
      this.select();
    })
    .on('click', 'button[name=increase]', function (e) {
      e.preventDefault();
      let $tr = $(this).closest('tr');
      let $numLaps = $tr.find('input[name=num_laps]');
      let numLaps = parseInt($numLaps.val()) + 1;
      $numLaps.val(numLaps);

      let $numDrops = $tr.find('input[name=num_drops]');
      let numDrops = parseInt($numDrops.val()) + parseInt(this.value);
      $numDrops.val(numDrops);

      $numDrops.trigger('change');
    })
    .on('change', 'input[name=expectation_input_mode]', function () {
      expectationInputMode = $(this).val();

      state.expectationInputMode = expectationInputMode;
      saveState(state);

      $map
        .find('input[name=num_laps], input[name=num_drops]')
          .parent()
            .toggle(expectationInputMode === 'aggregate')
          .end()
        .end()
        .find('input[name=actual_expectation]')
          .parent()
            .toggle(expectationInputMode === 'direct')
          .end()
        .end()
        .find('input[name=sync]')
          .closest('tfoot')
            .toggle(expectationInputMode === 'aggregate');

      updateExpectation();
    })
    .on('click', 'input[name=sync]', function () {
      state.syncCurrentEnabled = syncCurrentEnabled = this.checked;
      saveState(state);

      syncCurrent();
    });

  let $tbody = $map.find('tbody');

  maps.forEach(function (map, idx) {
    let mapState = state.maps[idx];

    let $chart = $('<td />')
      .attr('data-chart', idx)
      .append($('<span class="barchart" />'))
      .append($('<span class="barchart-label" />'))
      .append($('<span class="marathon" />'));

    $('<tr />')
      .attr('data-map', idx)
      .append($('<th />').text(map.name))
      .append($('<td />').text('' + map.charisma + '/' + map.stamina))
      .append(function () {
        let $drops = map.drops.map(function (drop) {
          let $icon = drop.icon ?
            $('<i />').attr('title', drop.name).addClass('icon icon-' + drop.icon) :
            $('<span />').text(drop.name);

          let $set = drop.set ? $('<span class="badge" />').text('x' + drop.set) : null;

          return $('<td />')
            .append($icon)
            .append($set);
        });

        for (let i = map.drops.length; i < maxDrops; i++) {
          $drops.push($('<td />'));
        }

        return $drops;
      })
      .append(function () {
        let $expectation = $('<span class="input-group input-group-sm" />')
          .append($('<span class="input-group-addon">1周の期待値</span>'))
          .append($('<input type="number" name="actual_expectation" min="0" class="form-control" />').val(mapState.expectation));

        let $marathon = $('<span class="input-group input-group-sm" />')
          .append($('<span class="input-group-addon">周回</span>'))
          .append($('<input type="number" name="num_laps" min="0" class="form-control" />').val(mapState.numLaps))
          .append($('<span class="input-group-addon">ドロップ</span>'))
          .append($('<input type="number" name="num_drops" min="0" class="form-control" />').val(mapState.numDrops))
          .append($('<span class="input-group-btn"><button name="increase" class="btn btn-default"></button></span>'));

        return $('<td class="expectation" />')
          .append($marathon)
          .append($expectation);
      })
      .append($chart)
      .prependTo($tbody);
  });

  $('#map thead th.drops').attr('colspan', maxDrops);

  if (rewardEnabled) {
    let $rewardList = $('#rewards tbody');
    rewards.forEach(function (reward) {
      let $icon = $('<span class="icon" />').addClass('icon-' + reward.unit);
      $('<tr />')
        .attr('data-amount', reward.amount)
        .append($('<td class="text-right" />').html('<span class="diff"></span> ' + reward.amount))
        .append($('<td />').html($icon))
        .appendTo($rewardList);
    });
  }

  let $estimateMap = $('[name=estimate_map]:input').change(function () {
    updateEstimate();
    state.estimateMap = parseInt($(this).val());
    saveState(state);
  });

  maps.forEach(function (map, index) {
    $('<option />')
      .val(index)
      .text(map.name + ' (' + map.charisma + '/' + map.stamina + ')')
      .prependTo($estimateMap);
  });

  let $estimateRank = $('[name=estimate_rank]:input').change(function () {
    updateEstimate();
    state.estimateRank = parseInt($(this).val());
    saveState(state);
  });

  for (let rank = 1; rank <= 200; rank++) {
    let charisma = calculateCharismaCapacity(rank);
    let stamina = calculateStaminaCapacity(rank);
    let label = '' + rank + ' (' + charisma + '/' + stamina + ')';
    $('<option />').val(rank).text(label).appendTo($estimateRank);
  }

  let $estimateUseCrystal = $('[name=estimate_use_crystal]').change(function () {
    updateEstimate();
    state.estimateUseCrystal = $(this).val();
    saveState(state);
  });

  let $estimateNaturalRecovery = $('[name=estimate_natural_recovery]:input').change(function () {
    updateEstimate();
    state.estimateNaturalRecovery = this.checked;
    saveState(state);
  });

  $('*[title]').tooltip();

  $('[name=current]:input').val(state.current);

  if (objectiveMode === 'exchange') {
    $('[name=objective]:input').val(state.objective);
  } else {
    $('[name=objective]:input').val([state.objective]);
  }

  $('[name=current]:input, [name=objective]:input').change(function () {
    state[this.name] = $(this).val();
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

  if (objectiveMode === 'exchange') {
    updatePrizeList();
  }

  if (rewardEnabled) {
    updateRewardList();
  }

  $map
    .find('input[name=sync]')
    .prop('checked', syncCurrentEnabled)
    .end()
    .find('input[name=expectation_input_mode][value="' + state.expectationInputMode + '"]')
    .prop('checked', true)
    .trigger('change')
    .parent()
    .addClass('active');

  $('#initialize-button')
    .on('click', function () {
      $.removeCookie(cookieName);
      window.location.reload();
    });

  let animationSupporeted = isAnimationSupported();
  let animationEndEventName = [
    'webkitAnimationEnd',
    'mozAnimationEnd',
    'MSAnimationEnd',
    'oanimationend',
    'animationend'
  ].join(' ');

  $('#estimate_tutorial')
    .on('click', 'a', function (e) {
     $('#map .expectation').each(function () {
        let $this = $(this);

        if (animationSupporeted) {
          e.preventDefault();
          $this
            .addClass('animated flash')
            .one(animationEndEventName, function () {
              $this.removeClass('animated flash');
            });
        }
      });
    })
    .on('click', 'button', function (e) {
      state.estimateTutorialHidden = true;
      saveState(state);

      $(e.delegateTarget)
        .each(function () {
          let $this = $(this);

          if (animationSupporeted) {
            $this
              .addClass('animated zoomOutRight')
              .one(animationEndEventName, function () {
                $this.hide();
              });
          } else {
            $this.hide();
          }
        });
    })
    .toggle(!state.estimateTutorialHidden)
    .each(function () {
      let $tutorial = $(this);
      let $anna = $tutorial.find('.anna');
      $tutorial
        .on('mouseenter', function () {
          $anna.addClass('animated bounce');
        })
        .on('mouseleave', function () {
          $anna.removeClass('animated bounce');
        });
    });

  $('#estimate_bug')
    .on('click', 'button', function (e) {
      state.version++;
      saveState(state);

      $(e.delegateTarget).each(function () {
        let $this = $(this);

        if (animationSupporeted) {
          $this
            .addClass('animated hinge')
            .one(animationEndEventName, function () {
              $this.hide();
            });
        } else {
          $this.hide();
        }
      });
    })
    .toggle(state.version === 1)
    .each(function () {
      let $tutorial = $(this);
      let $anna = $tutorial.find('.anna');
      $tutorial
        .on('mouseenter', function () {
          $anna.addClass('animated bounce');
        })
        .on('mouseleave', function () {
          $anna.removeClass('animated bounce');
        });
    });
}

$(function () {
  initialize();
  setInterval(update, 1000);
});
