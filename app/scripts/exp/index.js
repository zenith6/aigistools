import 'babel-polyfill';
import $ from 'jquery';
import experiences from './db/experiences.json';
import presets from './db/presets.json';
import expUnits from './db/exp_units.json';
import plans from './db/plans.json';
import combineMethods from './db/combine_methods.json';

let defaults = {
  presetId: 3,
  combineMethodId: 4,
};

let $presetId;
let $rarityId;
let $currentLevel;
let $currentRemainExp;
let $targetLevel;
let $breedingSpan;
let $combineMethodId;
let $totalRequiredExp;
let $planId;
let $requiredExpUnits;
let $breedingSpirit;
let $requiredExpLevel;
let breedingSpanChangeEventPrevented = false;
let updateResultTimer;
let updateResultDelay = 100;
let rarityIcons = {
  1: 'iron-sprit',
  2: 'bronze-sprit',
  3: 'silver-sprit',
  4: 'gold-sprit',
  5: 'platinum-sprit',
  6: 'gladys',
  7: 'black-sprit',
};

let rarityNextExperiences = experiences
  .sort(function (a, b) {
    return (a.rarity - b.rarity) * 1000 + (a.level - b.level);
  })
  .reduce(function (all, cur) {
    let exps = all[cur.rarity] || (all[cur.rarity] = []);
    exps.push(cur.next);
    return all;
  }, {});

let experienceMap = experiences
  .reduce(function (map, exp) {
    let rarity = map[exp.rarity] || (map[exp.rarity] = {});
    rarity[exp.level] = exp;
    return map;
  }, {});

function getNextLevelUpExp(rarityId, level) {
  if (!rarityNextExperiences[rarityId]) {
    return 0;
  }

  return rarityNextExperiences[rarityId][level - 1] || 0;
}

function totalRequiredExp(rarityId, from, fromRemainExp, to) {
  let exp = fromRemainExp;

  for (let i = from + 1; i < to; i++) {
    exp += getNextLevelUpExp(rarityId, i);
  }

  return exp;
}

function changePreset(preset) {
  if (typeof preset !== 'object') {
    let id = preset;
    preset = presets.reduce(function (found, preset) {
      found = preset.id == id ? preset : found;
      return found;
    }, null);
  }

  if (!preset) {
    throw new Error('preset was empty');
  }


  $currentLevel.empty();

  for (let i = preset.minLevel; i <= preset.maxLevel; i++) {
    $('<option />').val(i).text(i).appendTo($currentLevel);
  }


  $targetLevel.empty();

  for (let i = preset.minLevel; i <= preset.maxLevel; i++) {
    $('<option />').val(i).text(i).appendTo($targetLevel);
  }


  let slider = $breedingSpan.data('ionRangeSlider');
  breedingSpanChangeEventPrevented = true;
  slider.update({
    min: preset.minLevel,
    max: preset.maxLevel,
    step: 0.001,
    min_interval: 1,
    from: preset.minLevel,
    to: preset.maxLevel
  });
  breedingSpanChangeEventPrevented = false;


  $presetId.select2('val', preset.id);
  $rarityId.val(preset.rarityId);
  $currentLevel.val(preset.defaultCurrentLevel);
  $currentRemainExp.val(preset.defaultCurrentRemainExp);
  $targetLevel.val(preset.defaultTargetLevel);

  onChangeCurrentLevel();
  updateResult();
}

function onChangeCurrentLevel() {
  let rarityId = $rarityId.val();
  let currentLevel = parseInt($currentLevel.val());
  let targetLevel = parseInt($targetLevel.val());

  if (targetLevel < currentLevel) {
    $targetLevel.val(currentLevel);
  }

  let requiredExp = getNextLevelUpExp(rarityId, currentLevel);

  $currentRemainExp.trigger('touchspin.updatesettings', {
    min: requiredExp ? 1 : 0,
    max: requiredExp,
  });

  syncBreedingSpan();
}

function onChangeCurrentRemainExp() {
  syncBreedingSpan();
}

function onChangePlan() {
  let rarityId = $rarityId.val();

  let planId = $planId.data('breeding_plan_id');
  let plan = Array.find(plans, function (plan) {
    return plan.id == planId;
  });

  let presetId = $presetId.val();
  let preset = Array.find(presets, function (preset) {
    return preset.id == presetId;
  });

  $currentLevel.val([plan.currentLevel]);
  $currentRemainExp.val(getNextLevelUpExp(rarityId, plan.currentLevel));
  $targetLevel.val([Math.min(plan.targetLevel, preset.maxLevel)]);

  syncBreedingSpan();
}

function syncBreedingSpan() {
  let rarityId = $rarityId.val();
  let currentLevel = parseInt($currentLevel.val());
  let currentRemainExp = parseInt($currentRemainExp.val()) || 0;
  let requiredExp = getNextLevelUpExp(rarityId, currentLevel);
  let from = 1 + currentLevel - currentRemainExp / requiredExp;
  let to = parseInt($targetLevel.val());

  let slider = $breedingSpan.data('ionRangeSlider');
  breedingSpanChangeEventPrevented = true;
  slider.update({from: from, to: to});
  breedingSpanChangeEventPrevented = false;
}

function onChangeBreedingSpan() {
  let rarityId = $rarityId.val();
  let from = $breedingSpan.data('from');
  let currentLevel = parseInt(from);
  let requiredExp = getNextLevelUpExp(rarityId, currentLevel);
  let currentRemainExp = requiredExp - Math.floor(requiredExp * (from - currentLevel));
  let targetLevel = Math.floor($breedingSpan.data('to'));

  $currentLevel.val([currentLevel]);
  $currentRemainExp.val(currentRemainExp);
  $targetLevel.val([targetLevel]);

  $currentRemainExp.trigger('touchspin.updatesettings', {
    min: 0,
    max: requiredExp,
  });
}

function getMilestones(unitExp, rarityId, targetLevel, currentLevel, currentRemainExp) {
  let milestones = [];
  let exps = experienceMap[rarityId];
  let exp = exps[currentLevel];
  let current = exp.total + (exp.next - currentRemainExp);
  let required = experienceMap[rarityId][targetLevel].total;
  let level = targetLevel;
  let times = 0;

  while ((required -= unitExp) > current) {
    for (let i = level; i > 0; i--) {
      let exp = exps[i];

      if (exp.total < required) {
        level = exp.level;
        times++;
        milestones.unshift({
          times: times,
          level: level,
          remainExp: exp.next - (required - exp.total)
        });
        break;
      }
    }
  }

  return milestones;
}

function updateResult() {
  if (updateResultTimer) {
    clearTimeout(updateResultTimer);
  }

  updateResultTimer = setTimeout(_updateResult, updateResultDelay);
}

function _updateResult() {
  let rarityId = $rarityId.val();
  let currentLevel = parseInt($currentLevel.val());
  let currentRemainExp = parseInt($currentRemainExp.val()) || 0;
  let targetLevel = parseInt($targetLevel.val());
  let hasBreedingSpirit = $breedingSpirit.prop('checked');
  let requiredExp = totalRequiredExp(rarityId, currentLevel, currentRemainExp, targetLevel);

  $totalRequiredExp.text(requiredExp.toLocaleString());
  $requiredExpLevel.text(`Lv${currentLevel} → Lv${targetLevel}`);

  let combineMethodId = $combineMethodId.val();
  let combineMethod = combineMethods.reduce(function (found, cur) {
    found = cur.id == combineMethodId ? cur : found;
    return found;
  });

  $requiredExpUnits.empty();

  expUnits.map(function (unit) {
    let klass = unit.restricted && unit.rarityId != rarityId ? 'exp-unit-item-disabled' : '';
    let $item = $('<li class="exp-unit-item" />')
      .appendTo($requiredExpUnits)
      .addClass(klass);

    let $name = $('<div class="exp-unit-name"></div>')
      .text(unit.name)
      .appendTo($item);

    let amplification = unit.standalone ? 1 : combineMethod.amplification;
    amplification = amplification * (hasBreedingSpirit ? 1.1 : 1);
    let unitExp = Math.floor(unit.exp * amplification);
    let combines = Math.ceil(requiredExp / unitExp);
    let total = combines * combineMethod.units;
    let remainder = combines * unitExp - requiredExp;

    let $count = $('<span class="exp-unit-count"></span>')
      .text('x' + total.toLocaleString())
      .appendTo($item);

    if (remainder > 0) {
      let percentage = Math.min(remainder / unitExp, 1);
      let hue = 220 * (1 - percentage);
      let width = 100 * percentage;
      $('<span class="exp-unit-remainder"></span>')
        .append($('<span class="exp-unit-remainder-label" />').text('余剰 ' + remainder.toLocaleString() + ' EXP'))
        .append($('<span class="exp-unit-remainder-chart" />').css({'background-color': `hsl(${hue}, 61%, 35%)`, 'width': `${width}%`}))
        .appendTo($item);
    }

    let $units = $('<div class="exp-unit-units"></div>')
      .appendTo($item);

    for (let i = 0; i < total; i++) {
      $('<span class="icon" />')
        .addClass('icon-' + unit.icon)
        .appendTo($units);
    }

    let spirits = unit.standalone ? 0 : combines * combineMethod.spirits;
    let icon = 'icon-' + (combineMethod.same ? rarityIcons[rarityId] : rarityId == 1 ? 'bronze-sprit' : 'iron-sprit');

    for (let i = 0; i < spirits; i++) {
      $('<span class="icon icon-spirit " />')
        .addClass(icon)
        .appendTo($units);
    }

    let milestones = getMilestones(unitExp, rarityId, targetLevel, currentLevel, currentRemainExp);

    if (milestones.length > 0) {
      let $milestone = $('<div class="milestone">')
        .appendTo($item);

      $('<span class="milestone-header"></span>')
        .text(`Lv ${targetLevel} に必要な合成回数と開始地点`)
        .appendTo($milestone);

      let $list = $('<span class="milestone-list"></span>')
        .appendTo($milestone);

      milestones.map(function (milestone) {
        $('<span class="milestone-list-item"></span>')
          .text(`${milestone.times}回 → Lv ${milestone.level} ＋ ${milestone.remainExp}`)
          .appendTo($list);
      });
    }
  });

}

function formatPresetItem(item) {
  let preset = Array.find(presets, function (preset) {
    return preset.id == item.id;
  });

  return $('<div />')
    .append($('<i />').addClass('icon icon-' + preset.icon))
    .append($('<span />').text(preset.name))
    .html();
}

function initialize($view) {
  $presetId = $view
    .find('select[name=preset_id]')
    .select2({
      formatSelection: formatPresetItem,
      formatResult: formatPresetItem
    })
    .change(function () {
      changePreset($(this).val());
      updateResult();
    });

  presets.forEach(function (preset) {
    $('<option />')
      .val(preset.id)
      .text(preset.name)
      .appendTo($presetId);
  });


  $totalRequiredExp = $view.find('[data-ph="total_required_exp"]');
  $requiredExpUnits = $view.find('[data-ph="required_exp_units"]');
  $requiredExpLevel = $view.find('[data-ph="required_exp_level"]');


  $rarityId = $view
    .find('input[name=rarity_id]');


  $currentLevel = $view
    .find('select[name=current_level]')
    .change(function () {
      onChangeCurrentLevel();
      updateResult();
    });


  $currentRemainExp = $view
    .find('input[name=current_remain_exp]')
    .click(function () {
      this.select();
    })
    .TouchSpin()
    .change(function () {
      onChangeCurrentRemainExp();
      updateResult();
    })
    .keyup(function () {
      onChangeCurrentRemainExp();
      updateResult();
    });


  $targetLevel = $view
    .find('select[name=target_level]')
    .change(function () {
      syncBreedingSpan();
      updateResult();
    });


  let slider;
  $breedingSpan = $view
    .find('input[name=breeding_span]')
    .ionRangeSlider({
      type: 'double',
      grid: true,
      prefix: 'Lv ',
      prettify: function (num) {
        return Math.floor(num);
      },
      decorate_both: true,
      values_separator: ' → ',
      onFinish: function (data) {
        let to = Math.floor(data.to);
        setTimeout(function () {
          breedingSpanChangeEventPrevented = true;
          slider.update({to: to});
          breedingSpanChangeEventPrevented = false;
        });
      }
    })
    .change(function () {
      if (breedingSpanChangeEventPrevented) {
        return;
      }

      onChangeBreedingSpan();
      updateResult();
    });

  slider = $breedingSpan.data('ionRangeSlider');


  $planId = $view
    .find('[data-ph="breeding_plan_id"]')
    .empty()
    .on('click', 'button', function (e) {
      e.preventDefault();

      $planId.data('breeding_plan_id', $(e.target).val());

      onChangePlan();
      updateResult();
    });

  plans.forEach(function (plan) {
    $('<button type="button" class="btn btn-default btn-sm" />')
      .text(plan.name)
      .val(plan.id)
      .appendTo($planId);
  });


  $combineMethodId = $view
    .find('[name="combine_method_id"]')
    .on('change', function (e) {
      updateResult();
    });

  combineMethods.map(function (combineMethod) {
    $('<option />')
      .val(combineMethod.id)
      .text(combineMethod.name + ' (x' + combineMethod.amplification + ')')
      .appendTo($combineMethodId);
  });


  $breedingSpirit = $view
    .find('[name="breeding_spirit"]')
    .on('change', function (e) {
      updateResult();
    });
}


$(function () {
  initialize($('#app'));

  $combineMethodId.val(defaults.combineMethodId);

  changePreset(defaults.presetId);
});
