'use strict';

import _ from 'lodash';
import experiences from './db/experiences.json';
import presets from './db/presets.json';
import expUnits from './db/exp_units.json';
import breedingPlans from './db/breeding_plans.json';

var defaults = {
  presetId: 3,
};

var $presetId;
var $rarityId;
var $currentLevel;
var $currentRemainExp;
var $targetLevel;
var $breedingSpan;
var $totalRequiredExp;
var $requiredExpUnit;
var $expUnitId;
var $breedingPlanId;
var breedingSpanChangeEventPrevented = false;
var updateResultTimer;
var updateResultDelay = 50;

var rarityNextExperiences = experiences
  .sort(function (a, b) {
    return (a.rarity - b.rarity) * 1000 + (a.level - b.level);
  })
  .reduce(function (all, cur) {
    var exps = all[cur.rarity] || (all[cur.rarity] = []);
    exps.push(cur.next);
    return all;
  }, {});

function getNextLevelUpExp(rarityId, level) {
  if (!rarityNextExperiences[rarityId]) {
    return 0;
  }

  return rarityNextExperiences[rarityId][level - 1] || 0;
}

function totalRequiredExp(rarityId, from, fromRemainExp, to) {
  var exp = fromRemainExp;

  for (var i = from + 1; i < to; i++) {
    exp += getNextLevelUpExp(rarityId, i);
  }

  return exp;
}

function changePreset(preset) {
  if (typeof preset !== 'object') {
    var id = preset;
    preset = presets.reduce(function (found, preset) {
      found = preset.id == id ? preset : found;
      return found;
    }, null);
  }

  if (!preset) {
    throw new Error('preset was empty');
  }


  $currentLevel.empty();

  for (var i = preset.minLevel; i <= preset.maxLevel; i++) {
    $('<option />').val(i).text(i).appendTo($currentLevel);
  }


  $targetLevel.empty();

  for (i = preset.minLevel; i <= preset.maxLevel; i++) {
    $('<option />').val(i).text(i).appendTo($targetLevel);
  }


  var slider = $breedingSpan.data('ionRangeSlider');
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
  var rarityId = $rarityId.val();
  var currentLevel = parseInt($currentLevel.val());
  var targetLevel = parseInt($targetLevel.val());

  if (targetLevel < currentLevel) {
    $targetLevel.val(currentLevel);
  }

  var requiredExp = getNextLevelUpExp(rarityId, currentLevel);

  $currentRemainExp.trigger('touchspin.updatesettings', {
    min: requiredExp ? 1 : 0,
    max: requiredExp,
  });

  syncBreedingSpan();
}

function onChangeCurrentRemainExp() {
  syncBreedingSpan();
}

function onChangeBreedingPlan() {
  var rarityId = $rarityId.val();

  var breedingPlanId = $breedingPlanId.data('breeding_plan_id');
  var breedingPlan = _.find(breedingPlans, function (breedingPlan) {
    return breedingPlan.id == breedingPlanId;
  });

  var presetId = $presetId.val();
  var preset = _.find(presets, function (preset) {
    return preset.id == presetId;
  });

  $currentLevel.val([breedingPlan.currentLevel]);
  $currentRemainExp.val(getNextLevelUpExp(rarityId, breedingPlan.currentLevel));
  $targetLevel.val([Math.min(breedingPlan.targetLevel, preset.maxLevel)]);

  syncBreedingSpan();
}

function syncBreedingSpan() {
  var rarityId = $rarityId.val();
  var currentLevel = parseInt($currentLevel.val());
  var currentRemainExp = parseInt($currentRemainExp.val()) || 0;
  var requiredExp = getNextLevelUpExp(rarityId, currentLevel);
  var from = 1 + currentLevel - currentRemainExp / requiredExp;

  var targetLevel = parseInt($targetLevel.val());
  var to = targetLevel;

  var slider = $breedingSpan.data('ionRangeSlider');
  breedingSpanChangeEventPrevented = true;
  slider.update({from: from, to: to});
  breedingSpanChangeEventPrevented = false;
}

function onChangeBreedingSpan() {
  var rarityId = $rarityId.val();
  var from = $breedingSpan.data('from');
  var currentLevel = parseInt(from);
  var requiredExp = getNextLevelUpExp(rarityId, currentLevel);
  var currentRemainExp = requiredExp - Math.floor(requiredExp * (from - currentLevel));
  var targetLevel = Math.floor($breedingSpan.data('to'));

  $currentLevel.val([currentLevel]);
  $currentRemainExp.val(currentRemainExp);
  $targetLevel.val([targetLevel]);

  $currentRemainExp.trigger('touchspin.updatesettings', {
    min: 0,
    max: requiredExp,
  });
}

function updateResult() {
  if (updateResultTimer) {
    clearTimeout(updateResultTimer);
  }

  updateResultTimer = setTimeout(_updateResult, updateResultDelay);
}

function _updateResult() {
  var rarityId = $rarityId.val();
  var currentLevel = parseInt($currentLevel.val());
  var currentRemainExp = parseInt($currentRemainExp.val()) || 0;
  var targetLevel = parseInt($targetLevel.val());

  var requiredExp = totalRequiredExp(rarityId, currentLevel, currentRemainExp, targetLevel);

  $totalRequiredExp.text(requiredExp.toLocaleString());


  var expUnitId = $expUnitId.val();
  var expUnit = expUnits.reduce(function (found, cur) {
    found = cur.id == expUnitId ? cur : found;
    return found;
  });

  if (!expUnit) {
    throw new Error('Experience unit does not have experience point.');
  }

  var $tpl = $('<tr><td class="unit">' +
    '<span data-ph="unit"></span> セット</td>' +
    '<td class="exp"><span class="diff" data-ph="exp"></span></td>' +
    '</tr>');
  $requiredExpUnit.empty();
  var unitExp = expUnit.exp;

  for (var exp = requiredExp, limit = 10; limit > 0 && exp >= 0; exp -= unitExp, limit--) {
    var unitNum = Math.ceil(exp / unitExp);
    var delta = unitExp * unitNum - requiredExp;
    var deltaClass = delta === 0 ? 'diff-eq' : delta > 0 ? 'diff-plus' : 'diff-minus';
    var deltaText = delta === 0 ? '0' : (delta > 0 ? '+' : '') + delta.toLocaleString();

    $tpl
      .clone()
      .find('[data-ph="unit"]')
      .text(unitNum.toLocaleString())
      .end()
      .find('[data-ph="exp"]')
      .addClass(deltaClass)
      .text(deltaText)
      .end()
      .appendTo($requiredExpUnit);
  }
}

function formatPresetItem(item) {
  var preset = _.find(presets, function (preset) {
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


  $totalRequiredExp = $view.find('[data-ph="total-required-exp"]');
  $requiredExpUnit = $view.find('[data-ph="required-exp-unit"]');


  $expUnitId = $view
    .find('select[name=exp_unit_id]')
    .change(function () {
      updateResult();
    });

  expUnits.forEach(function (expUnit) {
    $('<option />')
      .val(expUnit.id)
      .text(expUnit.name)
      .appendTo($expUnitId);
  });


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


  var slider;
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
        var to = Math.floor(data.to);
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


  $breedingPlanId = $view
    .find('[data-ph="breeding_plan_id"]')
    .empty()
    .on('click', 'button', function (e) {
      e.preventDefault();

      $breedingPlanId.data('breeding_plan_id', $(e.target).val());

      onChangeBreedingPlan();
      updateResult();
    });

  breedingPlans.forEach(function (plan) {
    $('<button type="button" class="btn btn-default btn-sm" />')
      .text(plan.name)
      .val(plan.id)
      .appendTo($breedingPlanId);
  });
}


$(function () {
  initialize($('#app'));

  changePreset(defaults.presetId);
});
