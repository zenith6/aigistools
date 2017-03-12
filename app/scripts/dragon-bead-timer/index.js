import "babel-polyfill";
import i18next from "i18next";
import moment from "moment-timezone";
import events from "./db/events.json";
import locales from "./locales";
import jqueryI18next from "jquery-i18next";
import Reporter from "./lib/Reporter";
import StatLoader from "./lib/StatLoader";
import ReportLoader from "./lib/ReportLoader";
import config from "../../config/index.js";
import organizations from "./db/organizations.json";

let reporter;
let statLoader;
let reportLoader;
let stat;
let state;
let t;

moment.locale('ja');

let event = events[0];

let periods = event.periods.map((period) => {
  return period.map(Date.parse);
});

let totalPeriod = periods.reduce(function (total, period) {
  return total + period[1] - period[0];
}, 0);

event.maxObjective = event.maxObjective === null ? Infinity : event.maxObjective;

let prizes = event.prizes;
let maps = event.maps;
let rewards = event.rewards;
let objectiveMode = 'achievement'; // 'achievement' or 'exchange'
let rewardEnabled = true;
let cookieName = 'cursed-weapon-timer';
let defaultChart = 'drop';
let expectationInputMode = 'aggregate'; // 'aggregate' or 'direct'
let syncCurrentEnabled = true;
let storage;
let $current;
let $objective;
let $dropRate;
let $statDropRateFilter;

let defaultState = {
  current: 20,
  objective: 1400,
  estimateMap: 4,
  estimateRank: 100,
  estimateUseCrystal: 'both',
  estimateNaturalRecovery: true,
  expectationInputMode: expectationInputMode,
  syncCurrentEnabled: syncCurrentEnabled,
  maps: maps.map((map) => {
    return {
      numLaps: 1,
      numDrops: map.max_drop,
      expectation: map.expectation
    };
  }),
  estimateTutorialHidden: false,
  version: 2,
  language: (window.navigator.language || window.navigator.userLanguage),
  report: false,
  credentials: null,
  dropRate: 1,
  statDropRateFilter: null,
};

let defaultStorage = {
  active: '',
  slots: {
    '': 1,
    '_2': 2,
    '_3': 3,
  },
};

function switchLanguage(lang) {
  i18next
    .init({
      lng: lang,
      resources: locales,
    }, (err, _t) => {
      if (err) {
        console.error(err);
      }

      t = _t;

      jqueryI18next.init(i18next, $, {});

      $('body').localize();
    });
}

function calculateCharismaCapacity(rank) {
  return 27 + (rank <= 100 ? rank * 3 : 300 + rank - 100);
}

function calculateStaminaCapacity(rank) {
  return 12 + (rank <= 100 ? 0 : (Math.floor((rank - 100) / 20) + 1));
}

function format(value, scale = 0) {
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
  if (!syncCurrentEnabled || expectationInputMode === 'direct') {
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

function loadStorage() {
  let storage;

  try {
    storage = JSON.parse($.cookie(cookieName + '_storage'));
  } catch (e) {
    console.warn(e);

    storage = defaultStorage;
  }

  return storage;
}

function saveStorage(storage) {
  $.cookie(cookieName + '_storage', JSON.stringify(storage), {expires: 30});
}

function loadState(storage) {
  let state;

  try {
    state = JSON.parse($.cookie(cookieName + storage.active));
  } catch (e) {
    console.warn(e);

    state = {};
  }

  return $.extend(true, defaultState, state);
}

function saveState(state) {
  $.cookie(cookieName + storage.active, JSON.stringify(state), {expires: 30});
}

function updateRewardList() {
  if (!rewardEnabled) {
    return;
  }

  let stride = 45, slot = 7;
  let current = parseInt($current.val());
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

  let current = parseInt($current.val());
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
  let divider = mode === 'drop' ? null : mode;

  let data = maps.map(function (map) {
    let own = map.expectation / ((divider && map[divider]) || 1);
    let theirs = stat && map.id in stat ? stat[map.id].drop_average / ((divider && map[divider]) || 1) : 0;
    min = 0; // Math.min(min, value);
    max = Math.max(max, own, theirs);

    return {
      own: own,
      theirs: theirs,
    };
  });

  let scale = divider ? 3 : 2;
  maps.forEach(function (map, i) {
    let $chart = $('[data-chart=' + i + ']');

    let value = data[i].theirs;
    let rate = value / (max - min);
    let hue = 120 * rate + 240;

    $chart.find('.barchart-theirs > .barchart-label')
      .html(t('{{amount}}個 <small class="barchart-label-sub">(標本{{samples}}件)</small>', {
        amount: format(value, scale),
        samples: format(stat && map.id in stat ? stat[map.id].samples : '?', 0),
      }));

    $chart.find('.barchart-theirs > .barchart-bar')
      .css({
        width: (rate * 100) + '%',
        backgroundColor: 'hsla(' + hue + ', 80%, 50%, 0.5)'
      });

    value = data[i].own;
    rate = value / (max - min);
    hue = 120 * rate + 240;

    $chart.find('.barchart-own > .barchart-label')
      .html(t('{{amount}}個', {
        amount: format(value, scale),
      }));

    $chart.find('.barchart-own > .barchart-bar')
      .css({
        width: (rate * 100) + '%',
        backgroundColor: 'hsla(' + hue + ', 80%, 50%, 0.5)'
      });
  });
}

function updateMarathon() {
  let objective = parseInt($objective.val());
  let current = parseInt($current.val());
  let norma = Math.max(objective - current, 0);
  maps.forEach(function (map, i) {
    let $chart = $('[data-chart=' + i + ']');
    let expectation = stat && map.id in stat ? stat[map.id].drop_average : 0;
    let marathon = norma ? Math.ceil(norma / expectation) : 0;
    $chart.find('.barchart-theirs > .marathon').text(t('残り{{lap}}周', {lap: format(marathon)}));

    expectation = map.expectation;
    marathon = norma ? Math.ceil(norma / expectation) : 0;
    $chart.find('.barchart-own > .marathon').text(t('残り{{lap}}周', {lap: format(marathon)}));
  });

  $('#expectation_drop_total').text(format(current));
}

function updateEstimate() {
  let current = parseInt($current.val());
  let objective = parseInt($objective.val());
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

  let experience = Math.floor(map.experience * availableMarathon);
  text = (experience > 0 ? '+' : '') + format(experience);
  $('#estimate_experience').text(text);

  let experienceAvg = requiredCrystal ? experience / requiredCrystal : 0;
  text = (experienceAvg > 0 ? '+' : '') + format(experienceAvg);
  $('#estimate_avg_experience').text(text);

  let gold = Math.floor(map.gold * availableMarathon);
  text = (gold > 0 ? '+' : '') + format(gold);
  $('#estimate_gold').text(text);

  let goldAvg = requiredCrystal ? gold / requiredCrystal : 0;
  text = (goldAvg > 0 ? '+' : '') + format(goldAvg);
  $('#estimate_avg_gold').text(text);
}

function update() {
  let current = parseInt($current.val());
  let objective = parseInt($objective.val());
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
  $('#remains_days').text(t('残り{{days}}日', {days: format(days, 0)}));
  $('#remains_hours').text(t('残り{{hours}}時間', {hours: format(hours, 0)}));
  $('#remains_minutes').text(t('残り{{minutes}}分', {minutes: format(hours * 60, 0)}));

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
    .text(t('{{percentage}}%達成', {percentage: obj_progress}));
  $('#period_progress > .progress-bar')
    .width(time_progress + '%')
    .children('span')
    .text(t('{{percentage}}%経過', {percentage: time_progress}));

  let estimate = current * totalPeriod / elapsed;
  $('#prediction_label')
    .empty()
    .append(t('このペースなら最終日までに <strong>{{result}}</strong> 個集まるわ。', {result: format(Math.floor(estimate))}));

  let per = Math.min(estimate / objective, 1);
  let width = $('#objective_progress').width();
  let left = width * per - 47;
  $('.pointer').css('left', left + 'px');
  let margin = width - left < 230 ? -250 : 0;
  $('.pointer-label').css('margin-left', margin + 'px');

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
    let at = t('<strong>{{date}}</strong>頃に目標達成できそうよ', {date: formatted});
    $('#prediction_label')
      .append('<span> </span>')
      .append($('<span />').html(at));
  }
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Using_CSS_animations/Detecting_CSS_animation_support
 */
function isAnimationSupported() {
  let animationstring = 'animated bounce',
    keyframeprefix = '',
    domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
    pfx = '',
    elm = document.createElement('div');

  if (elm.style.animationName !== undefined) {
    return true;
  }

  for (let i = 0; i < domPrefixes.length; i++) {
    if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
      pfx = domPrefixes[i];
      animationstring = pfx + 'Animation';
      keyframeprefix = '-' + pfx.toLowerCase() + '-';
      return true;
    }
  }

  return false;
}

function formatObjectiveItem(item) {
  var objective = event.objectives.find(function (objective) {
    return objective.value == item.id;
  });

  return $('<div />')
    .append($('<i />').addClass('icon icon-' + objective.icon))
    .append($('<span />').text(' '))
    .append($('<span />').text(t(objective.title)))
    .append($('<span />').text(' '))
    .append($('<span class="label label-default" />').text(objective.value))
    .each(function (i, option) {
      if (objective.unconfirmed) {
        $(option)
          .append($('<span> </span>'))
          .append($('<span class="label label-danger">未確認</span>'))
      }
    })
    .html();
}

function _report() {
  let data = {};

  data.map = $('#map tr[data-map]')
    .map(function () {
      let $tr = $(this);
      let map = maps[parseInt($tr.attr('data-map'))];
      let lap = Math.max(parseInt($tr.find('input[name=num_laps]').val()) || 0, 0);
      let quantity = Math.max(parseInt($tr.find('input[name=num_drops]').val()) || 0, 0);

      return {
        id: map.id,
        lap: lap,
        quantity: quantity,
        rate: state.dropRate,
      };
    })
    .toArray();

  return reporter.send(data)
    .then((account) => {
      state.credentials = account.api_token;
      saveState(state);
    })
    .catch((e) => {
      console.error('Failed to reporting.');
    })
    .then(() => {
      updateStat();
      updateRecentReport();
    });
}

let reportDelayTimer = null;

function report() {
  if (!state.report) {
    return;
  }

  $('[data-chart]').css('opacity', 0.4);
  $('#recent_report').css('opacity', 0.4);

  if (reportDelayTimer) {
    clearTimeout(reportDelayTimer);
  }

  reportDelayTimer = setTimeout(_report, 1000);
}

function deleteReport() {
  $('#recent_report').css('opacity', 0.4);

  reporter.clear()
    .then(() => {
      updateStat();
      updateRecentReport();
    })
    .catch(() => {
      console.error('Failed to delete reports.');
    });
}

function updateStat() {
  $('[data-chart]').css('opacity', 0.4);

  let filter = {
    drop_rate: state.statDropRateFilter,
  };

  statLoader.fetch(filter)
    .then((data) => {
      stat = data.maps.reduce((stat, data) => {
        stat[data.id] = data;

        return stat;
      }, {});
    })
    //.catch(() => {
    //  console.error('Failed to load statistics.');
    //})
    .then(() => {
      updateExpectationChart();
      updateMarathon();

      $('[data-chart]').css('opacity', 1);
    });
}


function updateRecentReport() {
  $('#recent_report').css('opacity', 0.4);

  reportLoader.fetch()
    .then((data) => {
      let $container = $('#recent_report_list')
        .empty();

      data.data.forEach((report) => {
        $('<tr />')
          .append($('<td />').text(report.player_uuid))
          .append($('<td />').text(report.map))
          .append($('<td class="text-right" />').text(format(report.lap)))
          .append($('<td class="text-right" />').text(format(report.drop)))
          .append($('<td class="text-right" />').text(format(report.drop / report.lap, 3)))
          .append($('<td class="text-right" />').text(format(report.rate * 100) + '%'))
          .append($('<td />').text(moment(report.updated_at).tz('Asia/Tokyo').format('LLLL')))
          .appendTo($container);
      });

      $('#report_total').text(t('全{{total}}件', {total: data.total}));
    })
    .catch(() => {
      console.error('Failed to load recent report.');
    })
    .then(() => {
      $('#recent_report').css('opacity', 1);
    });
}

function initialize() {
  storage = loadStorage();
  state = loadState(storage);

  switchLanguage(state.language);

  $current = $('[name=current]:input');

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

  $current
    .click(function () {
      this.select();
    })
    .TouchSpin({
      min: 0,
      max: 10000,
      step: 1
    });


  $objective = $('[name=objective]:input');

  if (objectiveMode === 'achievement') {
    event.objectives.map(function (objective) {
      $('<option />')
        .attr('value', objective.value)
        .text(objective.title + ' (' + objective.value + '個)')
        .appendTo($objective);
    });

    $objective.select2({
      formatSelection: formatObjectiveItem,
      formatResult: formatObjectiveItem
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
    let amount = parseInt($objective.val());
    $objective.val(amount + increment).trigger('change');
  });

  $('button[name=reset]').click(function (e) {
    e.preventDefault();
    $objective.val(0).trigger('change');
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
    .on('keyup', 'input[name=num_laps], input[name=actual_expectation]', function () {
      updateExpectation();
    })
    .on('keyup', 'input[name=num_drops]', function () {
      updateExpectation();
      syncCurrent();
    })
    .on('change', 'input[name=actual_expectation]', function () {
      updateExpectation();
    })
    .on('change', 'input[name=num_laps]', function () {
      updateExpectation();
      report();
    })
    .on('change', 'input[name=num_drops]', function () {
      updateExpectation();
      syncCurrent();
      report();
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
        .find('input[name=sync]');

      $('[data-report]').toggle(expectationInputMode === 'aggregate');

      updateExpectation();
    })
    .on('click', 'input[name=sync]', function () {
      state.syncCurrentEnabled = syncCurrentEnabled = this.checked;
      saveState(state);

      syncCurrent();
    });

  let $tbody = $('#map_list');

  maps.forEach(function (map, idx) {
    let mapState = state.maps[idx];

    let $chart = $('<td class="barchart-container" />')
      .attr('data-chart', idx)
      .append($('<span class="barchart barchart-own"><span class="barchart-bar" /><span class="barchart-label" /><span class="marathon" />'))
      .append($('<span class="barchart barchart-theirs"><span class="barchart-bar" /><span class="barchart-label" /><span class="marathon" />'))
      .append();

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
          .append($('<span class="input-group-addon"></span>').text(t('1周の期待値')))
          .append($('<input type="number" name="actual_expectation" min="0" class="form-control" />').val(mapState.expectation));

        let $marathon = $('<span class="input-group input-group-sm" />')
          .append($('<span class="input-group-addon"></span>').text(t('周回')))
          .append($('<input type="number" name="num_laps" min="0" class="form-control" />').val(mapState.numLaps))
          .append($('<span class="input-group-addon"></span>').text(t('ドロップ')))
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

  $current.val(state.current);

  if (objectiveMode === 'exchange') {
    $objective.val(state.objective);
  } else {
    $objective.select2('val', state.objective);
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
      $.removeCookie(cookieName + '_storage');
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

  let $slot = $('[name=slot]')
    .change(function () {
      storage.active = $(this).val();
      saveStorage(storage);
      window.location.reload();
    });

  $.map(storage.slots, function (label, value) {
    let active = value === storage.active;
    $('<option />')
      .val(value)
      .text(label + (active ? ' *' : ''))
      .attr('selected', active)
      .appendTo($slot);
  });

  var $lang = $('[name=lang]:input')
    .change(function () {
      state.language = $(this).val();
      saveState(state);
      window.location.reload();
    });

  $.each(locales, function (lang) {
    $('<option />').val(lang).text(t(lang)).appendTo($lang);
  });

  $lang.val(state.language);

  $('[name=report]:input')
    .prop('checked', state.report)
    .change(function () {
      state.report = this.checked;
      saveState(state);

      if (state.report) {
        report();
      }
    });

  $('#refresh_stat_button').click(function (e) {
    e.preventDefault();
    updateStat();
  });

  $('a[href="#map"]').click(function (e) {
    e.preventDefault();

    let $target = $('#map');
    $('html, body')
      .stop()
      .animate({
        scrollTop: $target.offset().top - ($(window).height() - $target.height()) / 2
      }, 400);
  });

  $('#switch_aggregate_input_mode').click(function (e) {
    e.preventDefault();

    $('[name=expectation_input_mode]')
      .closest('.btn')
      .removeClass('active');

    $('[name=expectation_input_mode][value="aggregate"]:input')
      .prop('checked', true)
      .trigger('change')
      .closest('.btn')
      .addClass('active');
  });


  $('#refresh_recent_report_button').click(function (e) {
    e.preventDefault();
    updateRecentReport();
  });


  $('#delete_report_button').click(function (e) {
    e.preventDefault();

    deleteReport();
  });


  $dropRate = $('[name=drop_rate]')
    .on('change', function () {
      state.dropRate = $(this).val();
      saveState(state);
      report();
    });

  organizations.forEach((organization) => {
    $('<option />')
      .val(organization.rate)
      .text(organization.name)
      .appendTo($dropRate);
  });

  if (state.dropRate !== null) {
    $dropRate.val(state.dropRate);
  }


  $statDropRateFilter = $('[name=stat_drop_rate_filter]')
    .on('change', function () {
      state.statDropRateFilter = $(this).val();
      saveState(state);
      updateStat();
    });

  $('<option />')
    .val('')
    .text('すべて')
    .appendTo($statDropRateFilter);

  organizations.forEach((organization) => {
    $('<option />')
      .val(organization.rate)
      .text(organization.name)
      .appendTo($statDropRateFilter);
  });

  if (state.statDropRateFilter !== null) {
    $dropRate.val(state.statDropRateFilter);
  }


  reporter = new Reporter(config.api, state.credentials);
  statLoader = new StatLoader(config.api);
  reportLoader = new ReportLoader(config.api);

  updateStat();
  updateRecentReport();

  switch (state.version) {
  }
}

$(function () {
  initialize();
  setInterval(update, 1000);
});
