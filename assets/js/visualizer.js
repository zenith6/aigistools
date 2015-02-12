webpackJsonp([4],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($, process) {/* globals google */

	// 'use strict';

	__webpack_require__(6);
	__webpack_require__(7);
	__webpack_require__(4);
	__webpack_require__(3);

	__webpack_require__(15);

	function bootstrap() {
	  $('#loading').show();

	  var db = new Database(Aigis.settings.databaseUrl);
	  var loading = Aigis.tables.length;
	  var aborted = false;
	  var join = function () {
	    if (aborted) {
	      $('#loading').hide();
	      return;
	    }

	    if (--loading) {
	      return;
	    }

	    process([
	      function () { initialize(); },
	      function () {
	        var condition = getCondition();
	        var units = getUnits();
	        updateGraph(units, condition, function () {
	          $('#loading').hide();
	        }, function (error) {
	          notice(error, 'danger');
	          $('#loading').hide();
	        });
	      }
	    ]);
	  };

	  Aigis.tables.forEach(function (table) {
	    db.query(table, function (data) {
	      Aigis.data[table] = data;
	      join();
	    }, function (e) {
	      aborted = true;
	      notice('Unable to load ' + table + ' data from database. ' + e.toString(), 'danger');
	      join();
	    });
	  });
	}

	function initialize() {
	  $.map(Aigis.data.Settings, function (kv) {
	    Aigis.settings[kv.key] = JSON.parse(kv.value);
	  });

	  Aigis.settings.infomation.forEach(function (info) {
	    notice(info);
	  });

	  if (Aigis.settings.debug) {
	    Aigis.data.DefaultUnit = Aigis.debugUnits;
	  }

	  var hash = location.hash.substring(1) || 'damage';
	  Aigis.state.currentGraph = hash;

	  var qs = location.search.substring(1);
	  clearUnitList();
	  var units = createUnitsFromQs(qs);
	  if (units.length) {
	    units.forEach(function (unit) {
	      addUnit(unit);
	    });
	  } else {
	    Aigis.settings.defaultUnits.forEach(function (base) {
	      var unit = prepareUnit(base.unitId);
	      unit.level = base.unitLevel || 1;
	      unit.skillLevel = base.skillLevel || 1;
	      unit.intimacy = 0;
	      addUnit(unit);
	    });
	  }

	  var groups = {};
	  var ccprefix = ['', '', 'CC', '覚醒'];
	  var sortKeys = $.map(Aigis.data.Unit, function (unit) {
	    return {id: unit.id, weight: unit.weight};
	  });
	  sortKeys.sort(function (a, b) { return a.weight - b.weight; });
	  sortKeys.forEach(function (sortKey) {
	    var unit = Aigis.data.Unit[sortKey.id];
	    var klass = Aigis.data.Class[unit.classId];
	    var group;
	    if (!(klass.id in groups)) {
	      group = $('<optgroup />').attr('label', klass.name);
	      groups[klass.id] = group;
	    }
	    group = groups[klass.id];
	    var label = ccprefix[unit.classChange] + unit.name;
	    $('<option />')
	      .val(unit.id)
	      .text(label)
	      .appendTo(group);
	  });

	  sortKeys = $.map(Aigis.data.Class, function (klass) {
	    return {id: klass.id, weight: klass.weight};
	  });
	  sortKeys.sort(function (a, b) { return a.weight - b.weight; });

	  var unitTemplateControl = $('#unitList select[name=new_unit]');
	  $('<option />').appendTo(unitTemplateControl);
	  sortKeys.forEach(function (sortKey) {
	    var group = groups[sortKey.id];
	    if (group) {
	      group.appendTo(unitTemplateControl);
	    }
	  });
	  unitTemplateControl.select2({
	    placeholder: 'ユニットを選択して下さい',
	    closeOnSelect: false,
	    formatResult: function (option) {
	      if (!option.id) {
	        return option.text;
	      }
	      var unit = Aigis.data.Unit[option.id];
	      var style = 'background-position: -' + unit.iconSX +
	        'px -' + unit.iconSY + 'px;' +
	        'background-image: url(' + Aigis.settings.sprite + ');';
	      var icon = '<i class="small-icon" style="' + style + '"></i> ';
	      var info = unit.baseHealth == 1 || unit.potentialHealth == 1 ? ' <span class="label label-sm label-warning">ステータス未入力</span>' : '';
	      return icon + option.text + info;
	    }
	  }).change(function () {
	    var self = $(this);
	    var unit = prepareUnit(self.val());
	    addUnit(unit);
	    self.select2('val', null);
	  });

	  $('#unitList button[name=clear]').click(function (event) {
	    event.preventDefault();
	    clearUnitList();
	  });

	  $('button[name=refresh]').click(function (event) {
	    event.preventDefault();

	    var self = $(this);
	    self.attr('disabled', true);
	    $('#loading').show();
	    $('#notices').empty();
	    var condition = getCondition();
	    var units = getUnits();
	    updateGraph(units, condition, function () {
	      self.attr('disabled', false);
	      $('#loading').hide();
	    }, function (error) {
	      notice(error, 'danger');
	      self.attr('disabled', false);
	      $('#loading').hide();
	    });
	  });

	  $('input[name=target_defence], input[name=target_resistance], input[name=target_health]').TouchSpin({
	    min: 0,
	    max: 99999
	  });

	  $('input[name=starting_time]').TouchSpin({
	    min: 0,
	    max: 600
	  });

	  $('input[name=ending_time]').TouchSpin({
	    min: 1,
	    max: 600
	  });

	  $('button[name=clearDamagePickup]').click(function () {
	    Aigis.damageChart.setSelection();
	    updateDamagePickup();
	  });

	  $('button[name=clearRecoveryPickup]').click(function () {
	    Aigis.recoveryChart.setSelection();
	    updateRecoveryPickup();
	  });

	  $('button[name=clearScorePickup]').click(function () {
	    Aigis.scoreChart.setSelection();
	    updateScorePickup();
	  });

	  $('button[name=clearCostPickup]').click(function () {
	    Aigis.costChart.setSelection();
	    updateCostPickup();
	  });

	  $('input[name=rank]').TouchSpin({
	    min: 1,
	    max: 200
	  });

	  var princeTitleControl = $('select[name=prince_title]');
	  $.map(Aigis.data.PrinceTitle, function (title) {
	    $('<option />').val(title.id).text(title.name).appendTo(princeTitleControl);
	  });
	  princeTitleControl.val(Aigis.settings.defaultPriceTitle);

	  $('#switch a[data-toggle=tab]').on('show.bs.tab', function (e) {
	  }).on('shown.bs.tab', function (e) {
	    if (!Aigis.state.result) {
	      return;
	    }
	    var graph = $(this).attr('data-graph');
	    Aigis.state.currentGraph = graph;
	    process([
	      function () {
	        updateCurrentGraph();
	      }
	    ]);

	    var hash = '#' + graph;
	    if (history.replaceState) {
	      history.replaceState(null, null, hash);
	    }
	  });
	  var graph = Aigis.state.currentGraph;
	  $('#switch a[data-toggle=tab][data-graph=' + graph + ']').tab('show');

	  $('#downloadDamageChart').click(function () {
	    window.open(Aigis.damageChart.getImageURI(), '_blank');
	  });

	  $('#downloadRecoveryChart').click(function () {
	    window.open(Aigis.recoveryChart.getImageURI(), '_blank');
	  });

	  $('#downloadScoreChart').click(function () {
	    window.open(Aigis.scoreChart.getImageURI(), '_blank');
	  });

	  $('#downloadCostChart').click(function () {
	    window.open(Aigis.costChart.getImageURI(), '_blank');
	  });

	  $('#url').click(function (event) {
	    event.preventDefault();
	    this.select();
	  });

	  sortKeys = $.map(Aigis.data.Unit, function (unit) {
	    return {id: unit.id, weight: unit.weight};
	  });
	  sortKeys.sort(function (a, b) { return a.weight - b.weight; });
	  var select = $('select[name=template_enemy]');
	  sortKeys.forEach(function (sortKey) {
	    var unit = Aigis.data.Unit[sortKey.id];
	    if (unit.enemy) {
	      $('<option />').val(unit.id).text(unit.name).appendTo(select);
	    }
	  });

	  var condition = createConditionFromQs(qs);
	  setCondition(condition);

	  select.select2().change(function () {
	    var self = $(this);
	    updateTargetProperties(Aigis.data.Unit[self.val()]);
	  }).trigger('change');

	  $('#unitList tbody')
	    .sortable({});
	}

	function formatTime(time, scale) {
	  scale = scale || 2;
	  time = (time == Infinity || time == -Infinity) ? '∞' : (time / 1000).toFixed(scale);
	  return time + '秒';
	}

	function simulate(attackers, condition) {
	  var data = [];

	  var defenders = attackers.map(function (attacker, index) {
	    var defender = new Unit();
	    defender.group = 2;
	    defender.name = '#' + (index + 1);
	    defender.health = condition.targetHealth;
	    defender.defence = condition.targetDefence;
	    defender.resistance = condition.targetResistance;
	    defender.rarity = Aigis.data.Rarity['2'];
	    defender.actions.attack = new NullAttack(defender);
	    defender.actions.heal = new NullHeal(defender);
	    defender.actions.skill = new NullSkill(defender, 1);
	    defender.ability = new NullAbility(defender);

	    attacker.group = 1;
	    attacker.target = defender;

	    return defender;
	  });
	  var units = attackers.concat(defenders);

	  var prince = null;
	  var princeExists = attackers.some(function (unit) {
	    prince = unit;
	    return unit.base.id == '1';
	  });
	  if (condition.princeOnField && !princeExists) {
	    prince = createDummyPrince();
	    units = units.concat(prince);
	  }

	  units.forEach(function (attacker, index) {
	    attacker.actions.attack.callbacks.warmup = function (elapsedTime) {
	      this.execute(elapsedTime);

	      var defender = this.owner.target;
	      var damage = defender.calcDamage(this.owner, defender);
	      var message = this.name + ' ダメージ:' + damage;
	      data.push({
	        type: 'anotation',
	        time: elapsedTime,
	        object: this.owner,
	        message: message
	      });

	      defender.damaged(damage, this.owner, elapsedTime);
	    };

	    attacker.callbacks.damaged = function (elapsedTime, damage, from, before, after) {
	      data.push({
	        type: 'damage',
	        time: elapsedTime,
	        object: from,
	        damage: damage
	      });

	      if (this.damage >= this.status.health) {
	        data.push({
	          type: 'destroy',
	          time: elapsedTime,
	          object: from
	        });

	        var message = '攻撃対象' + this.name + 'を撃破' +
	          ' 最大HP:' + this.status.health +
	          ' 合計ダメージ:' + this.damage;
	        data.push({
	          type: 'anotation',
	          time: elapsedTime,
	          object: from,
	          message: message
	        });

	        this.damage = 0;

	        from.dispatch('destroyed', this, elapsedTime);
	      }
	    };

	    attacker.actions.heal.callbacks.warmup = function (elapsedTime) {
	      this.execute(elapsedTime);

	      var target = attacker;
	      var recovery = target.calcRecovery(this.owner, target);
	      var message = this.name +
	        ' 対象:' + target.name +
	        ' 回復量:' + recovery;
	      data.push({
	        type: 'anotation',
	        time: elapsedTime,
	        object: this.owner,
	        message: message
	      });

	      target.recover(recovery, attacker, elapsedTime);
	    };

	    attacker.callbacks.recovered = function (elapsedTime, recovery, from, before, after) {
	      data.push({
	        type: 'recovery',
	        time: elapsedTime,
	        object: this,
	        from: from,
	        recovery: recovery
	      });

	      var message = 'HPが回復 ' + recovery;
	      data.push({
	        type: 'anotation',
	        time: elapsedTime,
	        object: this,
	        message: message
	      });
	    };

	    if (condition.useSkill) {
	      attacker.actions.skill.callbacks.warmup = function (elapsedTime) {
	        var duration = this.getDuration();
	        var message = 'スキル ' + this.name + ' を発動' +
	          ' Lv:' + this.level;
	        data.push({
	          type: 'anotation',
	          time: elapsedTime,
	          object: this.owner,
	          message: message
	        });
	        this.execute(elapsedTime);
	      };
	    }

	    attacker.callbacks.effectAdded = function (elapsedTime, effect) {
	      var message = effect.name + ' の効果が発生 ' + effect.dump();
	      data.push({
	        type: 'anotation',
	        time: elapsedTime,
	        object: this,
	        message: message
	      });
	    };

	    attacker.callbacks.effectRemoved = function (elapsedTime, effect) {
	      var message = effect.name + ' の効果が終了 ' + effect.dump();
	      data.push({
	        type: 'anotation',
	        time: elapsedTime,
	        object: this,
	        message: message
	      });
	    };

	    attacker.ability.callbacks.started = function (ability, elapsedTime) {
	      var message = 'アビリティ ' + ability.name + ' を発動';
	      data.push({
	        type: 'anotation',
	        time: elapsedTime,
	        object: ability.owner,
	        message: message
	      });
	    };
	  });

	  var stage = new Stage();

	  stage.callbacks.costChanged = function (elapsedTime, cost, from, before, after) {
	    data.push({
	      type: 'cost',
	      time: elapsedTime,
	      object: from,
	      from: from,
	      cost: cost
	    });

	    var message = 'コスト変動' +
	      ' ' + (cost <= 0 ? '' : '+') + cost +
	      ' (Σ' + after + ')' +
	      ' ユニット:' + from.name;
	    data.push({
	      type: 'anotation',
	      time: elapsedTime,
	      object: this,
	      message: message
	    });
	  };

	  stage.condition = condition;
	  units.forEach(function (unit) {
	    stage.addUnit(unit);
	  });

	  stage.start();

	  stage.units.forEach(function (unit) {
	    unit.ability.start(0);
	  });

	  stage.units.forEach(function (unit) {
	    if (unit.group == 1) {
	      stage.addCost(-unit.cost, unit, 0);
	    }
	  });

	  for (var time = condition.startingTime; time <= condition.endingTime; time += condition.resolution) {
	    stage.update(time);
	  }
	  stage.stop();

	  return data;
	}

	function createDummyPrince() {
	  var prince = new Unit();
	  var base = Aigis.data.Unit[Aigis.settings.princeId];
	  prince.base = base;
	  prince.rarity = Aigis.data.Rarity[base.rarityId];
	  prince.class = Aigis.data.Class[base.classId];
	  prince.name = 'ダミー王子';
	  prince.actions.attack = new NullAttack(prince);
	  prince.actions.heal = new NullHeal(prince);
	  var data = Aigis.data.Skill[base.skillId];
	  var parameters = JSON.parse(data.parameters);
	  var skill = new window[data.type](prince, 1, parameters);
	  skill.name = data.name;
	  skill.warmupTime = 0;
	  prince.actions.skill = skill;
	  data = Aigis.data.Ability[base.abilityId];
	  var ability = new window[data.type](prince);
	  ability.name = data.name;
	  ability.parameters = JSON.parse(data.parameters);
	  prince.ability = ability;
	  return prince;
	}

	function process(processes, self) {
	  setTimeout(function () {
	    var p = processes.shift();
	    p.apply(self);
	    if (processes.length) {
	      process(processes, self);
	    }
	  });
	}

	function updateUrl() {
	  $('#url').val(getSharingUrl());
	}

	function updateCurrentGraph() {
	  var graph = Aigis.state.currentGraph;
	  if (!Aigis.cache.graph[graph]) {
	    Aigis.cache.graph[graph] = true;
	    switch (graph) {
	      case 'damage':
	        updateDamageGraph(Aigis.state.result, Aigis.state.attackers, Aigis.state.condition);
	        break;

	      case 'recovery':
	        updateRecoveryGraph(Aigis.state.result, Aigis.state.attackers, Aigis.state.condition);
	        break;

	      case 'score':
	        updateScoreGraph(Aigis.state.result, Aigis.state.attackers, Aigis.state.condition);
	        break;

	      case 'log':
	        updateLog(Aigis.state.result, Aigis.state.attackers, Aigis.state.condition);
	        break;

	      case 'cost':
	        updateCostGraph(Aigis.state.result, Aigis.state.attackers, Aigis.state.condition);
	        break;
	    }
	  }

	  updateUrl();
	}

	function updateGraph(attackers, condition, onCompleted, onError) {
	  if (attackers.length === 0) {
	    onError('比較対象がありません。ユニットを追加して下さい。');
	    return;
	  }

	  Aigis.state.attackers = attackers;
	  Aigis.state.condition = condition;
	  Aigis.state.result = null;
	  Aigis.cache.graph = {};

	  process([
	    function () { Aigis.state.result = simulate(Aigis.state.attackers, Aigis.state.condition); },
	    function () { updateCurrentGraph(); },
	    function () { onCompleted(); }
	  ]);
	}

	function getChartType(id) {
	  return {
	    line: {
	      class: google.visualization.LineChart,
	      options: {
	      }
	    },
	    area: {
	      class: google.visualization.AreaChart,
	      options: {
	      }
	    },
	    stack: {
	      class: google.visualization.SteppedAreaChart,
	      options: {
	        isStacked: true
	      }
	    }
	  }[id];
	}

	function updateDamageGraph(result, attackers, condition) {
	  var table = toDamageDataTable(result, attackers, condition);
	  Aigis.damageChartData = table;
	  Aigis.damageChartUnits = attackers;
	  if (table.getNumberOfRows() === 0) {
	    notice('表示可能なデータがありません。', 'warning');
	    return;
	  }

	  var canvas = document.getElementById('damageChart');
	  var chartType = getChartType(condition.chartType);
	  var chart = new chartType.class(canvas);
	  google.visualization.events.addListener(chart, 'select', function () {
	    updateDamagePickup();
	  });
	  Aigis.damageChart = chart;

	  var view = new google.visualization.DataView(table);
	  var columns = Array.apply(null, new Array(table.getNumberOfColumns())).map(function (v, i) { return i; });
	  columns[0] = {calc: function(data, row) { return formatTime(data.getValue(row, 0), 1); }, type:'string'};
	  view.setColumns(columns);


	  var title = 'ダメージ量 攻撃対象' + ' 防御力:' + condition.targetDefence;

	  var options = {
	    title: title,
	    hAxis: {
	      title: '経過時間 (秒)',
	      viewWindow: {
	        min: 0
	      }
	    },
	    vAxis: {
	      viewWindow: {
	        min: 0
	      }
	    },
	    focusTarget: 'category',
	    selectionMode: 'multiple',
	    width: $('#graph').width(),
	    height: condition.height
	  };

	  var opt = $.extend({}, chartType.options, options);
	  chart.draw(view, opt);
	  chart.setSelection([{row: table.getNumberOfRows() - 1, column: null}]);

	  setTimeout(updateDamagePickup);
	}

	function updateRecoveryGraph(result, attackers, condition) {
	  var table = toRecoveryDataTable(result, attackers, condition);
	  Aigis.recoveryChartData = table;
	  Aigis.recoveryChartUnits = attackers;
	  if (table.getNumberOfRows() === 0) {
	    notice('表示可能なデータがありません。', 'warning');
	    return;
	  }

	  var canvas = document.getElementById('recoveryChart');
	  var chartType = getChartType(condition.chartType);
	  var chart = new chartType.class(canvas);
	  google.visualization.events.addListener(chart, 'select', function () {
	    updateRecoveryPickup();
	  });
	  Aigis.recoveryChart = chart;

	  var view = new google.visualization.DataView(table);
	  var columns = Array.apply(null, new Array(table.getNumberOfColumns())).map(function (v, i) { return i; });
	  columns[0] = {calc: function(data, row) { return formatTime(data.getValue(row, 0), 1); }, type:'string'};
	  view.setColumns(columns);


	  var title = '回復量';

	  var options = {
	    title: title,
	    hAxis: {
	      title: '経過時間 (秒)',
	      viewWindow: {
	        min: 0
	      }
	    },
	    vAxis: {
	      viewWindow: {
	        min: 0
	      }
	    },
	    focusTarget: 'category',
	    selectionMode: 'multiple',
	    width: $('#graph').width(),
	    height: condition.height
	  };
	  var opt = $.extend({}, chartType.options, options);
	  chart.draw(view, opt);
	  chart.setSelection([{row: table.getNumberOfRows() - 1, column: null}]);

	  setTimeout(updateRecoveryPickup);
	}

	function updateScoreGraph(result, attackers, condition) {
	  var table = toScoreDataTable(result, attackers, condition);
	  Aigis.scoreChartData = table;
	  Aigis.scoreChartUnits = attackers;
	  if (table.getNumberOfRows() === 0) {
	    notice('表示可能なデータがありません。', 'warning');
	    return;
	  }

	  var canvas = document.getElementById('scoreChart');
	  var chartType = getChartType(condition.chartType);
	  var chart = new chartType.class(canvas);
	  google.visualization.events.addListener(chart, 'select', function () {
	    updateScorePickup();
	  });
	  Aigis.scoreChart = chart;

	  var view = new google.visualization.DataView(table);
	  var columns = Array.apply(null, new Array(table.getNumberOfColumns())).map(function (v, i) { return i; });
	  columns[0] = {calc: function(data, row) { return formatTime(data.getValue(row, 0), 1); }, type:'string'};
	  view.setColumns(columns);


	  var title = '撃破数 攻撃対象' +
	    ' HP:' + condition.targetHealth +
	    ' 防御力:' + condition.targetDefence;

	  var options = {
	    title: title,
	    hAxis: {
	      title: '経過時間 (秒)',
	      viewWindow: {
	        min: 0
	      }
	    },
	    vAxis: {
	      viewWindow: {
	        min: 0
	      }
	    },
	    focusTarget: 'category',
	    selectionMode: 'multiple',
	    width: $('#graph').width(),
	    height: condition.height
	  };
	  var opt = $.extend({}, chartType.options, options);
	  chart.draw(view, opt);
	  chart.setSelection([{row: table.getNumberOfRows() - 1, column: null}]);

	  setTimeout(updateScorePickup);
	}

	function updateCostGraph(result, attackers, condition) {
	  var table = toCostDataTable(result, attackers, condition);
	  Aigis.costChartData = table;
	  Aigis.costChartUnits = attackers;
	  if (table.getNumberOfRows() === 0) {
	    notice('表示可能なデータがありません。', 'warning');
	    return;
	  }

	  var canvas = document.getElementById('costChart');
	  var chartType = getChartType(condition.chartType);
	  var chart = new chartType.class(canvas);
	  google.visualization.events.addListener(chart, 'select', function () {
	    updateCostPickup();
	  });
	  Aigis.costChart = chart;

	  var view = new google.visualization.DataView(table);
	  var columns = Array.apply(null, new Array(table.getNumberOfColumns())).map(function (v, i) { return i; });
	  columns[0] = {calc: function(data, row) { return formatTime(data.getValue(row, 0), 1); }, type:'string'};
	  view.setColumns(columns);


	  var title = '出撃コスト回復量 攻撃対象' +
	    ' 防御力:' + condition.targetDefence +
	    ' HP:' + condition.targetHealth;
	  var baseline = -attackers.reduce(function (p, c) { return Math.max(p, c.cost); }, 0);
	  baseline = chartType.options.isStacked ? 0 : baseline;
	  var options = {
	    title: title,
	    hAxis: {
	      title: '経過時間 (秒)',
	      viewWindow: {
	        min: 0
	      }
	    },
	    vAxis: {
	      baseline: baseline
	    },
	    focusTarget: 'category',
	    selectionMode: 'multiple',
	    width: $('#graph').width(),
	    height: condition.height
	  };

	  var opt = $.extend({}, chartType.options, options);
	  chart.draw(view, opt);
	  chart.setSelection([{row: table.getNumberOfRows() - 1, column: null}]);

	  setTimeout(updateCostPickup);
	}

	function getUnits() {
	  var objects = [];
	  var id = 0;
	  var table = $('#unitList');
	  table.children('tbody').children('tr[data-id]').each(function () {
	    var unit = new Unit(objects.length);
	    var row = $(this);

	    unit.base = Aigis.data.Unit[row.attr('data-unit-id')];
	    unit.name = row.find('input[name=name]').val();
	    unit.class = Aigis.data.Class[row.find('*[name=class]').val()];
	    unit.rarity = Aigis.data.Rarity[row.find('*[name=rarity]').val()];
	    unit.level = parseInt(row.find('select[name=level]').val());
	    unit.health = parseInt(row.find('input[name=health]').val());
	    unit.strength = parseInt(row.find('input[name=strength]').val());
	    unit.defence = parseInt(row.find('input[name=defence]').val());
	    unit.attackTimes = unit.base.attackTimes;

	    var warmupTime = 0;
	    var cooldownTime = Math.round(parseFloat(row.find('input[name=attack-cooldown-time]').val()) * 1000);
	    var data = Aigis.data.Attack[unit.class.attackId];

	    var attack = new window[data.type](unit, warmupTime, cooldownTime);
	    attack.name = data.name;
	    unit.actions.attack = attack;

	    data = Aigis.data.Heal[unit.class.healId];
	    var heal = new window[data.type](unit, warmupTime, cooldownTime);
	    heal.name = data.name;
	    unit.actions.heal = heal;

	    data = Aigis.data.Skill[row.find('*[name=skill]').val()];
	    var skillLevel = parseInt(row.find('*[name=skill_lv]').val());
	    var klass = skillLevel ? window[data.type] || NullSkill : NullSkill;
	    var parameters = JSON.parse(data.parameters);
	    var skill = new klass(unit, skillLevel, parameters);
	    skill.name = data.name;
	    unit.actions.skill = skill;

	    data = Aigis.data.Ability[row.find('*[name=ability]').val()];
	    klass = window[data.type] || NullAbility;
	    var ability = new klass(unit);
	    ability.name = data.name;
	    ability.parameters = JSON.parse(data.parameters);
	    unit.ability = ability;

	    unit.attackEnabled = unit.class.attackEnabled;
	    unit.healEnabled = unit.class.healEnabled;
	    // unit.skillEnabled = unit.class.skillEnabled;

	    unit.cost = unit.base.minCost;

	    objects.push(unit);
	  });

	  return objects;
	}

	function toDamageDataTable(result, attackers, condition) {
	  var table = new google.visualization.DataTable();

	  table.addColumn('number', '経過時間');
	  attackers.forEach(function (attacker) {
	    table.addColumn('number', attacker.name);
	  });
	  table.addColumn({type: 'string', role: 'anotation'});
	  table.addColumn({type: 'string', role: 'anotationText'});

	  var damages = attackers.map(function () { return 0; });
	  var cursor = 0;
	  var damageOffset = 1;
	  var anotationOffset = damageOffset + attackers.length;
	  for (var time = condition.startingTime; time <= condition.endingTime; time += 100) {
	    var row = [time].concat(damages, '', '');
	    for (var record = result[cursor]; record && record.time <= time; record = result[cursor]) {
	      switch (record.type) {
	        case 'anotation':
	          row[anotationOffset] = '!';
	          row[anotationOffset + 1] += record.message + "\n";
	          break;

	        case 'damage':
	          damages[record.object.id] += record.damage;
	          row[damageOffset + record.object.id] += record.damage;
	          break;
	      }
	      cursor++;
	    }
	    table.addRow(row);
	  }

	  return table;
	}

	function toRecoveryDataTable(result, healers, condition) {
	  var table = new google.visualization.DataTable();

	  table.addColumn('number', '経過時間');
	  healers.forEach(function (healer) {
	    table.addColumn('number', healer.name);
	  });
	  table.addColumn({type: 'string', role: 'anotation'});
	  table.addColumn({type: 'string', role: 'anotationText'});

	  var costs = healers.map(function () { return 0; });
	  var cursor = 0;
	  var recoveryOffset = 1;
	  var anotationOffset = recoveryOffset + healers.length;
	  for (var time = condition.startingTime; time <= condition.endingTime; time += 100) {
	    var row = [time].concat(costs, '', '');
	    for (var record = result[cursor]; record && record.time <= time; record = result[cursor]) {
	      switch (record.type) {
	        case 'anotation':
	          row[anotationOffset] = '!';
	          row[anotationOffset + 1] += record.message + "\n";
	          break;

	        case 'recovery':
	          costs[record.object.id] += record.recovery;
	          row[recoveryOffset + record.object.id] += record.recovery;
	          break;
	      }
	      cursor++;
	    }
	    table.addRow(row);
	  }

	  return table;
	}

	function toScoreDataTable(result, attackers, condition) {
	  var table = new google.visualization.DataTable();

	  table.addColumn('number', '経過時間');
	  attackers.forEach(function (attacker) {
	    table.addColumn('number', attacker.name);
	  });
	  table.addColumn({type: 'string', role: 'anotation'});
	  table.addColumn({type: 'string', role: 'anotationText'});

	  var scores = attackers.map(function () { return 0; });
	  var cursor = 0;
	  var scoreOffset = 1;
	  var anotationOffset = scoreOffset + attackers.length;
	  for (var time = condition.startingTime; time <= condition.endingTime; time += 100) {
	    var row = [time].concat(scores, '', '');
	    for (var record = result[cursor]; record && record.time <= time; record = result[cursor]) {
	      switch (record.type) {
	        case 'anotation':
	          row[anotationOffset] = '!';
	          row[anotationOffset + 1] += record.message + '\n';
	          break;

	        case 'destroy':
	          scores[record.object.id]++;
	          row[scoreOffset + record.object.id]++;
	          break;
	      }
	      cursor++;
	    }
	    table.addRow(row);
	  }

	  return table;
	}

	function toCostDataTable(result, healers, condition) {
	  var table = new google.visualization.DataTable();

	  table.addColumn('number', '経過時間');
	  healers.forEach(function (healer) {
	    table.addColumn('number', healer.name);
	  });
	  table.addColumn({type: 'string', role: 'anotation'});
	  table.addColumn({type: 'string', role: 'anotationText'});

	  var costs = healers.map(function () { return 0; });
	  var cursor = 0;
	  var costOffset = 1;
	  var anotationOffset = costOffset + healers.length;
	  for (var time = condition.startingTime; time <= condition.endingTime; time += 100) {
	    var row = [time].concat(costs, '', '');
	    for (var record = result[cursor]; record && record.time <= time; record = result[cursor]) {
	      switch (record.type) {
	        case 'anotation':
	          row[anotationOffset] = '!';
	          row[anotationOffset + 1] += record.message + "\n";
	          break;

	        case 'cost':
	          costs[record.object.id] += record.cost;
	          row[costOffset + record.object.id] += record.cost;
	          break;
	      }
	      cursor++;
	    }
	    table.addRow(row);
	  }

	  return table;
	}

	function updateLog(result) {
	  var tbody = $('#logGraph .table-log tbody');
	  tbody.empty();
	  result.forEach(function (record) {
	    switch (record.type) {
	      case 'anotation':
	        $('<tr />')
	          .append($('<td class="time" />').text(formatTime(record.time)))
	          .append($('<td />').text(record.object.name))
	          .append($('<td />').text(record.message))
	          .appendTo(tbody);
	        break;
	    }
	  });
	}

	function updateDamagePickup() {
	  var data = Aigis.damageChartData;
	  var units = Aigis.damageChartUnits;
	  var table = $('#damagePickup');

	  var rows = [];
	  for (var i = 0; i < 1 + units.length; i++) {
	    rows[i] = $('<tr />');
	  }

	  $('<th />').text('経過時間 / ダメージ').appendTo(rows[0]);
	  units.forEach(function (unit, index) {
	    $('<td />').text(unit.name).appendTo(rows[1 + index]);
	  });

	  var tbody = $('<tbody />');
	  var selection = Aigis.damageChart.getSelection();
	  var indexes = selection.map(function (s) { return {index: s.row, time: data.getValue(s.row, 0)}; });
	  indexes.sort(function (a, b) { return a.index - b.index; });
	  indexes.forEach(function (index) {
	    var i = index.index;
	    var time = data.getValue(i, 0);
	    $('<th />').text(formatTime(time, 1)).appendTo(rows[0]);
	    units.forEach(function (unit, j) {
	      $('<td />').text(data.getValue(i, 1 + j)).appendTo(rows[1 + j]);
	    });
	  });
	  tbody = table.children('tbody').empty();
	  rows.forEach(function (row) {
	    row.appendTo(tbody);
	  });
	}

	function updateRecoveryPickup() {
	  var data = Aigis.recoveryChartData;
	  var units = Aigis.recoveryChartUnits;
	  var table = $('#recoveryPickup');

	  var rows = [];
	  for (var i = 0; i < 1 + units.length; i++) {
	    rows[i] = $('<tr />');
	  }

	  $('<th />').text('経過時間 / 回復量').appendTo(rows[0]);
	  units.forEach(function (unit, index) {
	    $('<td />').text(unit.name).appendTo(rows[1 + index]);
	  });

	  var tbody = $('<tbody />');
	  var selection = Aigis.recoveryChart.getSelection();
	  var indexes = selection.map(function (s) { return {index: s.row, time: data.getValue(s.row, 0)}; });
	  indexes.sort(function (a, b) { return a.index - b.index; });
	  indexes.forEach(function (index) {
	    var i = index.index;
	    var time = data.getValue(i, 0);
	    $('<th />').text(formatTime(time, 1)).appendTo(rows[0]);
	    units.forEach(function (unit, j) {
	      $('<td />').text(data.getValue(i, 1 + j)).appendTo(rows[1 + j]);
	    });
	  });
	  tbody = table.children('tbody').empty();
	  rows.forEach(function (row) {
	    row.appendTo(tbody);
	  });
	}

	function updateScorePickup() {
	  var data = Aigis.scoreChartData;
	  var units = Aigis.scoreChartUnits;
	  var table = $('#scorePickup');

	  var rows = [];
	  for (var i = 0; i < 1 + units.length; i++) {
	    rows[i] = $('<tr />');
	  }

	  $('<th />').text('経過時間 / 撃破数').appendTo(rows[0]);
	  units.forEach(function (unit, index) {
	    $('<td />').text(unit.name).appendTo(rows[1 + index]);
	  });

	  var tbody = $('<tbody />');
	  var selection = Aigis.scoreChart.getSelection();
	  var indexes = selection.map(function (s) { return {index: s.row, time: data.getValue(s.row, 0)}; });
	  indexes.sort(function (a, b) { return a.index - b.index; });
	  indexes.forEach(function (index) {
	    var i = index.index;
	    var time = data.getValue(i, 0);
	    $('<th />').text(formatTime(time, 1)).appendTo(rows[0]);
	    units.forEach(function (unit, j) {
	      $('<td />').text(data.getValue(i, 1 + j)).appendTo(rows[1 + j]);
	    });
	  });
	  tbody = table.children('tbody').empty();
	  rows.forEach(function (row) {
	    row.appendTo(tbody);
	  });
	}

	function updateCostPickup() {
	  var data = Aigis.costChartData;
	  var units = Aigis.costChartUnits;
	  var table = $('#costPickup');

	  var rows = [];
	  for (var i = 0; i < 1 + units.length; i++) {
	    rows[i] = $('<tr />');
	  }

	  $('<th />').text('経過時間 / 回復量').appendTo(rows[0]);
	  units.forEach(function (unit, index) {
	    $('<td />').text(unit.name).appendTo(rows[1 + index]);
	  });

	  var tbody = $('<tbody />');
	  var selection = Aigis.costChart.getSelection();
	  var indexes = selection.map(function (s) { return {index: s.row, time: data.getValue(s.row, 0)}; });
	  indexes.sort(function (a, b) { return a.index - b.index; });
	  indexes.forEach(function (index) {
	    var i = index.index;
	    var time = data.getValue(i, 0);
	    $('<th />').text(formatTime(time, 1)).appendTo(rows[0]);
	    units.forEach(function (unit, j) {
	      $('<td />').text(data.getValue(i, 1 + j)).appendTo(rows[1 + j]);
	    });
	  });
	  tbody = table.children('tbody').empty();
	  rows.forEach(function (row) {
	    row.appendTo(tbody);
	  });
	}

	function clearUnitList() {
	  $('#unitList')
	    .data('sequence', 0)
	    .children('tbody')
	    .empty();
	}

	function addUnit(unit) {
	  var table = $('#unitList');
	  var sequence = table.data('sequence');
	  var id = sequence++;
	  var base = unit.base;
	  table.data('sequence', sequence);

	  var row = $('<tr />')
	    .attr('data-id', id)
	    .attr('data-unit-id', unit.id)
	    .attr('data-rarity', unit.rarity.id);

	  var nameControl = $('<input />')
	    .attr('type', 'text')
	    .attr('name', 'name')
	    .attr('value', unit.name)
	    .attr('class', 'form-control')
	    .attr('data-id', id);
	  $('<td class="unit-name" />')
	    .append(nameControl)
	    .appendTo(row);

	  $('<i class="small-icon" />')
	    .css({
	      backgroundImage: 'url(' + Aigis.settings.sprite + ')',
	      backgroundPosition: '-' + base.iconSX + 'px -' + base.iconSY + 'px'
	    })
	    .wrap('<td class="unit-icon" />')
	    .parent()
	    .appendTo(row);
	  var td = $('<td class="unit-info" />').appendTo(row);
	  var rarityControl, classControl;
	  if (unit.base.editable) {
	    rarityControl = $('<select />')
	      .attr('name', 'rarity')
	      .attr('class', 'form-control')
	      .attr('data-id', id);
	    $.map(Aigis.data.Rarity, function (rarity) {
	      $('<option />')
	        .val(rarity.id)
	        .text(rarity.name)
	        .appendTo(rarityControl);
	    });
	    rarityControl
	      .val(unit.rarity.id)
	      .appendTo(td);

	    classControl = $('<select />')
	      .attr('name', 'class')
	      .attr('class', 'form-control')
	      .attr('data-id', id);
	    $.map(Aigis.data.Class, function (klass) {
	      $('<option />')
	        .val(klass.id)
	        .text(klass.name)
	        .appendTo(classControl);
	    classControl
	      .val(unit.class.id)
	      .appendTo(td);
	    });
	  } else {
	    rarityControl = $('<input type="hidden" />')
	      .attr('name', 'rarity')
	      .attr('data-id', id)
	      .val(unit.rarity.id)
	      .appendTo(td);
	    classControl = $('<input type="hidden" />')
	      .attr('name', 'class')
	      .attr('data-id', id)
	      .val(unit.class.id)
	      .appendTo(td);
	    $('<span />')
	      .addClass('label label-rarity-' + unit.rarity.id)
	      .text(unit.rarity.name)
	      .appendTo(td);
	    $('<span />')
	      .addClass('label label-class')
	      .text(unit.class.name)
	      .appendTo(td);
	  }

	  var levelControl = $('<select />')
	    .attr('name', 'level')
	    .attr('class', 'form-control')
	    .attr('data-id', id);
	  for (var i = unit.base.minLevel; i <= unit.base.maxLevel; i++) {
	    $('<option />').val(i).text(i).appendTo(levelControl);
	  }
	  levelControl.val(unit.level);
	  $('<td class="unit-lv" />')
	    .append(levelControl)
	    .appendTo(row);

	  var intimacyControl = $('<select />')
	    .attr('name', 'intimacy')
	    .attr('class', 'form-control')
	    .attr('data-id', id);
	  for (i = 0; i <= unit.base.maxIntimacy; i++) {
	    $('<option />').val(i).text(i + '%').appendTo(intimacyControl);
	  }
	  intimacyControl
	    .val(unit.intimacy || 0)
	    .attr('readonly', unit.base.maxIntimacy === 0);
	  $('<td class="unit-imtimacy" />')
	    .append(intimacyControl)
	    .appendTo(row);

	  var strengthControl = $('<input />')
	    .attr('type', 'text')
	    .attr('name', 'strength')
	    .attr('value', unit.strength)
	    .attr('class', 'form-control')
	    .attr('data-id', id);
	  $('<td class="unit-strength" />')
	    .append(strengthControl)
	    .appendTo(row);

	  /*
	  var attackWarmupTimeControl = $('<input />')
	    .attr('type', 'text')
	    .attr('name', 'attack-warmup-time')
	    .attr('value', unit.attackWarmupTime / 1000)
	    .attr('class', 'form-control')
	    .attr('data-id', id);
	  $('<td class="unit-attack-warmup-time" />')
	    .append(attackWarmupTimeControl)
	    .appendTo(row);
	  */

	  var attackCooldownTimeControl = $('<input />')
	    .attr('type', 'text')
	    .attr('name', 'attack-cooldown-time')
	    .attr('value', unit.attackCooldownTime / 1000)
	    .attr('class', 'form-control text-sm')
	    .attr('data-id', id);
	  $('<td class="unit-attack-cooldown-time" />')
	    .append(attackCooldownTimeControl)
	    .appendTo(row);

	  td = $('<td class="unit-ability" />').appendTo(row);
	  var skill = unit.skill;
	  var skillControl, skillLevelControl;
	  if (unit.base.editable) {
	    skillControl = $('<select />')
	      .attr('name', 'skill')
	      .attr('class', 'form-control')
	      .attr('data-id', id)
	      .attr('readonly', !unit.base.editable);
	    $.map(Aigis.data.Skill, function (skill) {
	      $('<option />')
	        .val(skill.id)
	        .text(skill.name)
	        .appendTo(skillControl);
	    });
	    skillControl
	      .val(unit.skill.id)
	      .appendTo(td);

	    skillLevelControl = $('<select />')
	      .attr('name', 'skill_lv')
	      .attr('class', 'form-control')
	      .attr('data-id', id)
	      .appendTo(td);
	  } else {
	    $('<input type="hidden" />')
	      .attr('name', 'skill')
	      .attr('data-id', id)
	      .val(skill.id)
	      .appendTo(td);
	    $('<input type="hidden" />')
	      .attr('name', 'skill_lv')
	      .attr('data-id', id)
	      .val(unit.skillLevel)
	      .appendTo(td);
	    var levels = $('<ul class="dropdown-menu" role="menu"></ul>');
	    $('<a href="#" />')
	      .attr('data-level', 0)
	      .text('使用しない')
	      .wrap('<li>')
	      .parent()
	      .appendTo(levels);
	    for (i = skill.minLevel; i <= skill.maxLevel; i++) {
	      $('<a href="#" />')
	        .attr('data-level', i)
	        .text('Lv' + i)
	        .wrap('<li>')
	        .parent()
	        .appendTo(levels);
	    }
	    $('<div class="btn-group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"><span class="skill-label"></span> <span class="skill-level"></span> <span class="caret"></span></button></div>')
	      .append(levels)
	      .on('click', 'a', function (e) {
	        e.preventDefault();
	        var level = parseInt($(this).attr('data-level'));
	        $('input[name=skill_lv][data-id=' + id + ']').val(level);
	        var label = level ? 'Lv' + level : '<i class="glyphicon glyphicon-remove"></i>';
	        $('tr[data-id=' + id + '] .skill-level').html(label);
	      })
	      .appendTo(td)
	      .find('.skill-label')
	      .text(skill.name)
	      .parent()
	      .find('.skill-level')
	      .text('Lv' + unit.skillLevel);
	  }

	  td = $('<td class="unit-ability" />').appendTo(row);
	  var abilityControl;
	  if (true) {
	    abilityControl = $('<select />')
	      .attr('name', 'ability')
	      .attr('class', 'form-control')
	      .attr('data-id', id);
	    $.map(Aigis.data.Ability, function (ability) {
	      $('<option />')
	        .val(ability.id)
	        .text(ability.name)
	        .appendTo(abilityControl);
	    });
	    abilityControl.val(unit.ability.id)
	      .appendTo(td)
	      .select2();
	  } else {
	    abilityControl = $('<input type="hidden" />')
	      .attr('name', 'ability')
	      .attr('data-id', id)
	      .val(unit.ability.id)
	      .appendTo(td);
	    $('<span />')
	      .addClass('form-control-static')
	      .text(unit.ability.name)
	      .appendTo(td);
	  }

	  var healthControl = $('<input type="hidden" />')
	    .attr('name', 'health')
	    .val(unit.health);

	  var defenceControl = $('<input type="hidden" />')
	    .attr('name', 'defence')
	    .val(unit.defence);

	  var removeButton = $('<button />')
	    .attr('name', 'remove')
	    .attr('class', 'btn btn-warning btn-xs')
	    .attr('data-id', id)
	    .html('<span class="glyphicon glyphicon-remove"></span> 削除')
	    .click(function (event) {
	      event.preventDefault();
	      $(this).closest('tr').remove();
	  });
	  $('<td class="command" />')
	    .append(removeButton)
	    .append(healthControl)
	    .append(defenceControl)
	    .appendTo(row);

	  row.appendTo(table.children('tbody'));

	  strengthControl.TouchSpin({
	    min: 0,
	    max: 99999
	  });

	  attackCooldownTimeControl.TouchSpin({
	    min: 0.01,
	    max: 60,
	    decimals: 2,
	    step: 0.01
	  });

	  if (unit.base.editable) {
	    skillControl.select2()
	      .change(function () {
	        var skill = Aigis.data.Skill[$(this).val()];
	        skillLevelControl.empty().attr('readonly', skill.minLevel == skill.maxLevel);
	        for (var i = skill.minLevel; i <= skill.maxLevel; i++) {
	          $('<option />').val(i).text(i).appendTo(skillLevelControl);
	        }
	        skillLevelControl.val(skill.minLevel);
	      })
	      .trigger('change');

	    skillLevelControl.val(unit.skillLevel || 1);
	  }

	  $([levelControl.get(0), intimacyControl.get(0)]).change(function () {
	    var delta = parseInt(levelControl.val()) - base.minLevel;
	    var span = base.maxLevel - base.minLevel;
	    var itm = Math.min(parseInt(intimacyControl.val()) || 0, 100) / 100;
	    itm = itm == 1 ? 1.2 : itm;
	    var rank = parseInt($('input[name=rank]').val());
	    var rankRate = (base.id != Aigis.settings.princeId || rank <= 100) ? 0 : Math.floor((rank - 100) / 25);

	    var lvBonus = Math.round((base.potentialHealth - base.baseHealth) * delta / span);
	    var itmBonus = Math.round(base.bonusHealth * itm);
	    var rankBonus = 100 * rankRate;
	    var health = base.baseHealth + lvBonus + itmBonus + rankBonus;
	    healthControl.val(health);
	    lvBonus = Math.round((base.potentialStrength - base.baseStrength) * delta / span);
	    itmBonus = Math.round(base.bonusStrength * itm);
	    rankBonus = 10 * rankRate;
	    var strength = base.baseStrength + lvBonus + itmBonus + rankBonus;
	    strengthControl.val(strength);
	    lvBonus = Math.round((base.potentialDefence - base.baseDefence) * delta / span);
	    itmBonus = Math.round(base.bonusDefence * itm);
	    rankBonus = 10 * rankRate;
	    var defence = base.baseDefence + lvBonus + itmBonus + rankBonus;
	    defenceControl.val(defence);
	  }).trigger('change');
	}

	function getCondition() {
	  return {
	    startingTime: parseInt($('input[name=starting_time]').val()) * 1000,
	    endingTime: parseInt($('input[name=ending_time]').val()) * 1000,
	    resolution: 1, // parseInt($('input[name=resolution]').val()) * 1000,
	    targetDefence: parseInt($('input[name=target_defence]').val()),
	    targetHealth: parseInt($('input[name=target_health]').val()),
	    targetResistance: parseInt($('input[name=target_resistance]').val()),
	    rank: parseInt($('input[name=rank]').val()),
	    princeTitle: Aigis.data.PrinceTitle[$('select[name=prince_title]').val()],
	    princeOnField: !!($('input[name=prince_on_field]:checked').val()),
	    useSkill: !!($('input[name=use_skill]:checked').val()),
	    abilityToAll: !!($('input[name=ability_to_all]:checked').val()),
	    chartType: $('select[name=chart_type]').val(),
	    height: parseInt($('input[name=height]').val())
	  };
	}

	function setCondition(condition) {
	  if (condition.startingTime !== undefined) {
	    $('input[name=starting_time]').val(Math.floor(condition.startingTime / 1000));
	  }
	  if (condition.endingTime !== undefined) {
	    $('input[name=ending_time]').val(Math.floor(condition.endingTime / 1000));
	  }
	  if (condition.resolution !== undefined) {
	    $('input[name=resolution]').val(Math.floor(condition.resolution / 1000));
	  }
	  if (condition.target !== undefined) {
	     $('select[name=template_enemy]').val(condition.target);
	  }
	  if (condition.targetHealth !== undefined) {
	    $('input[name=target_health]').val(condition.targetHealth);
	  }
	  if (condition.targetDefence !== undefined) {
	    $('input[name=target_defence]').val(condition.targetDefence);
	  }
	  if (condition.targetResistance !== undefined) {
	    $('input[name=target_resistance]').val(condition.targetResistance);
	  }
	  if (condition.rank !== undefined) {
	    $('input[name=rank]').val(condition.rank);
	  }
	  if (condition.princeTitle !== undefined) {
	    $('select[name=prince_title]').val(condition.princeTitle.id);
	  }
	  if (condition.princeOnField !== undefined) {
	    $('input[name=prince_on_field]').prop('checked', condition.princeOnField);
	  }

	  if (condition.useSkill !== undefined) {
	    $('input[name=use_skill]').prop('checked', condition.useSkill);
	  }
	  if (condition.abilityToAll !== undefined) {
	    $('input[name=ability_to_all]').prop('checked', condition.abilityToAll);
	  }
	  if (condition.chartType !== undefined) {
	    $('select[name=chart_type]').val(condition.chartType);
	  }
	  if (condition.height !== undefined) {
	    $('input[name=height]').val(condition.height);
	  }
	}

	function notice(message, type) {
	  type = type || 'info';
	  $('<div class="alert alert-' + type + '" />')
	    .text(message)
	    .appendTo($('#notices'));
	}

	function updateTargetProperties(target) {
	  $('input[name=target_defence]').val(target.baseDefence);
	  $('input[name=target_health]').val(target.baseHealth);
	}

	function prepareUnit(id) {
	  var unit = new Unit();
	  var base = Aigis.data.Unit[id];
	  unit.id = base.id;
	  unit.base = base;
	  var prefixes = ['', '', 'CC', '覚醒'];
	  unit.name = prefixes[base.classChange] + base.name;
	  unit.level = base.maxLevel;
	  unit.health = base.baseHealth;
	  unit.strength = base.baseStrength;
	  unit.defende = base.baseDefence;
	  unit.attackTimes = base.attackTimes;
	  unit.attackWarmupTime = base.attackWarmupTime;
	  unit.attackCooldownTime = base.attackCooldownTime;
	  unit.intimacy = base.maxIntimacy;
	  unit.class = Aigis.data.Class[base.classId];
	  unit.skill = Aigis.data.Skill[base.skillId] || NullSkill;
	  unit.skillLevel = unit.skill.maxLevel;
	  unit.rarity = Aigis.data.Rarity[base.rarityId];
	  unit.ability = Aigis.data.Ability[base.abilityId] || NullAbility;
	  unit.cost = base.minCost || 0;

	  return unit;
	}

	function toQueryString() {
	  var query = [];

	  query.push(['ss', parseInt($('input[name=starting_time]').val()) * 1000]);
	  query.push(['se', parseInt($('input[name=ending_time]').val()) * 1000]);
	  query.push(['sr', 1 /* $('input[name=resolution]').val() */]);
	  query.push(['ti', $('select[name=template_enemy]').val()]);
	  query.push(['td', $('input[name=target_defence]').val()]);
	  query.push(['th', $('input[name=target_health]').val()]);
	  query.push(['tr', $('input[name=target_resistance]').val()]);
	  query.push(['ra', $('input[name=rank]').val()]);
	  query.push(['pt', $('select[name=prince_title]').val()]);
	  query.push(['po', $('input[name=prince_on_field]:checked').val() ? 1 : 0]);
	  query.push(['su', $('input[name=use_skill]:checked').val() ? 1 : 0]);
	  query.push(['aa', $('input[name=ability_to_all]:checked').val() ? 1 : 0]);
	  query.push(['dc', $('select[name=chart_type]').val()]);
	  query.push(['dh', $('input[name=height]').val()]);

	  var index = 0;
	  $('#unitList tr[data-id]').each(function () {
	    var unit = new Unit(index);
	    var row = $(this);
	    var prefix = 'u[' + index + ']';
	    query.push([prefix + '[i]', row.attr('data-unit-id')]);
	    query.push([prefix + '[n]', row.find('input[name=name]').val()]);
	    query.push([prefix + '[c]', row.find('*[name=class]').val()]);
	    query.push([prefix + '[r]', row.find('*[name=rarity]').val()]);
	    query.push([prefix + '[l]', row.find('select[name=level]').val()]);
	    query.push([prefix + '[m]', row.find('select[name=intimacy]').val()]);
	    // query.push([prefix + '[h]', row.find('input[name=health]').val()]);
	    query.push([prefix + '[s]', row.find('input[name=strength]').val()]);
	    // query.push([prefix + '[d]', row.find('input[name=defence]').val()]);
	    query.push([prefix + '[o]', parseInt(Math.floor(parseFloat(row.find('input[name=attack-cooldown-time]').val()) * 1000))]);
	    query.push([prefix + '[k]', row.find('*[name=skill]').val()]);
	    query.push([prefix + '[e]', row.find('*[name=skill_lv]').val()]);
	    query.push([prefix + '[a]', row.find('*[name=ability]').val()]);
	    index++;
	  });
	  query.push(['ul', index]);

	  return query.map(function (kv) { return kv[0] + '=' + encodeURIComponent(kv[1]); }).join('&');
	}

	function createConditionFromQs(qs) {
	  var query = qs
	    .split('&')
	    .map(function (kv) { return kv.split('=').map(decodeURIComponent);})
	    .reduce(function (query, kv) { query[kv[0]] = kv[1]; return query; }, {});

	  return {
	    startingTime: query.ss ? parseInt(query.ss) : 0,
	    endingTime: query.se ? parseInt(query.se) : 60000,
	    resolution: 0,
	    target: query.ti ? parseInt(query.ti) : 1000,
	    targetDefence: query.td ? parseInt(query.td) : undefined,
	    targetHealth: query.th ? parseInt(query.th) : undefined,
	    targetResistance: query.tr ? parseInt(query.tr) : undefined,
	    rank: query.ra ? parseInt(query.ra) : 100,
	    princeTitle: query.pt ? Aigis.data.PrinceTitle[query.pt] : undefined,
	    princeOnField: query.po ? !!parseInt(query.po) : false,
	    useSkill: query.su ? !!parseInt(query.su) : true,
	    abilityToAll: query.aa ? !!parseInt(query.aa) : false,
	    chartType: query.dc ? query.dc : 'area',
	    height: query.dh ? parseInt(query.dh) : 600
	  };
	}

	function createUnitsFromQs(qs) {
	  var units = [];
	  var query = qs
	    .split('&')
	    .map(function (kv) { return kv.split('=').map(decodeURIComponent);})
	    .reduce(function (query, kv) { query[kv[0]] = kv[1]; return query; }, {});

	  var l = parseInt(query.ul);
	  for (var i = 0; i < l; i++) {
	    var prefix = 'u[' + i + ']';
	    var id = query[prefix + '[i]'];
	    var unit = prepareUnit(id);
	    var name = query[prefix + '[n]'];
	    if (name) {
	      unit.name = name;
	    }
	    var rarity = query[prefix + '[r]'];
	    if (rarity) {
	      unit.rarityId = rarity;
	      unit.rarity = Aigis.data.Rarity[rarity];
	    }
	    var klass = query[prefix + '[c]'];
	    if (klass) {
	      unit.classId = klass;
	      unit.klass = Aigis.data.Class[klass];
	    }
	    var lv = query[prefix + '[l]'];
	    if (lv) {
	      unit.level = parseInt(lv);
	    }
	    var str = query[prefix + '[s]'];
	    if (str) {
	      unit.strength = parseInt(str);
	    }
	    var intimacy = query[prefix + '[m]'];
	    if (intimacy) {
	      unit.intimacy = parseFloat(intimacy);
	    }
	    var ct = query[prefix + '[o]'];
	    if (ct) {
	      unit.attackCooldownTime = parseInt(ct);
	    }
	    var skill = query[prefix + '[k]'];
	    if (skill) {
	      unit.skillId = skill;
	      unit.skill = Aigis.data.Skill[skill];
	    }
	    var slv = query[prefix + '[e]'];
	    if (slv) {
	      unit.skillLevel = parseInt(slv);
	    }
	    var ability = query[prefix + '[a]'];
	    if (ability) {
	      unit.abilityId = ability;
	      unit.ability = Aigis.data.Ability[ability];
	    }

	    units.push(unit);
	  }

	  return units;
	}

	function getSharingUrl() {
	  return location.protocol + '//' +
	    location.host +
	    location.pathname +
	    '?' + toQueryString() +
	    location.hash;
	}

	google.load('visualization', '1', {packages:['corechart', 'table']});
	google.setOnLoadCallback(bootstrap);
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6), __webpack_require__(16)))

/***/ },

/***/ 15:
/***/ function(module, exports, __webpack_require__) {

	/*** IMPORTS FROM imports-loader ***/
	(function() {

	// 'use strict';

	var formatTime = __webpack_require__(29);

	this.Aigis = {
	  settings: {
	    databaseUrl: 'https://docs.google.com/spreadsheets/d/1-zStm1B36Ckq1Tpxrz018h3YVAsZyd2vustqghPFie0/edit',
	    debug: false
	  },
	  tables: [
	    'Class',
	    'Rarity',
	    'Attack',
	    'Heal',
	    'Skill',
	    'Ability',
	    'Unit',
	    'PrinceTitle',
	    'Settings'
	  ],
	  data: {},
	  state: {
	    currentGraph: 'damage'
	  },
	  cache: {}
	};

	this.Stage = function Stage() {
	  this.name = 'ステージ';
	  this.condition = null;
	  this.units = [];
	  this.time = 0;
	  this.status = {};
	  this.cost = 0;
	  this.callbacks = {};
	};

	Stage.prototype = Object.create({});
	Stage.prototype.constructor = Object;

	Stage.prototype.dispatch = function () {
	  var args = Array.prototype.slice.call(arguments);
	  var handler = args.shift();
	  var callback = this.callbacks[handler];
	  if (callback) {
	    callback.apply(this, args);
	  }
	};

	Stage.prototype.addUnit = function (unit) {
	  unit.stage = this;
	  this.units.push(unit);
	};

	Stage.prototype.clearStatus = function () {
	  var status = this.status;
	  status.morale = 0;
	};

	Stage.prototype.start = function () {
	  this.clearStatus();
	  this.units.forEach(function (unit) {
	    unit.reset();
	  });
	};

	Stage.prototype.stop = function () {};

	Stage.prototype.update = function (time) {
	  this.clearStatus();
	  var units = this.units,
	    unit;
	  var len = units.length;
	  for (var i = 0; i < len; i++) {
	    unit = units[i];
	    unit.ability.update(time);
	    unit.actions.skill.update(time);
	  }
	  for (i = 0; i < len; i++) {
	    units[i].updateStatus(time);
	  }
	  for (i = 0; i < len; i++) {
	    unit = units[i];
	    unit.actions.attack.update(time);
	    unit.actions.heal.update(time);
	  }
	};

	Stage.prototype.addCost = function (cost, from, elapsedTime) {
	  var before = this.cost;
	  var after = before + cost;
	  this.cost = after;
	  this.dispatch('costChanged', elapsedTime, cost, from, before, after);
	  return cost;
	};

	/**
	 * Unit
	 */
	this.Unit = function Unit(id) {
	  this.id = id;
	  this.group = 0;
	  this.name = '';
	  this.level = 1;
	  this.health = 0;
	  this.strength = 0;
	  this.defence = 0;
	  this.resistance = 0;
	  this.cost = 0;
	  this.attackTimes = 1;
	  this.attackWarmupDelay = 1;
	  this.attackCooldownDelay = 1;
	  this.attackAttribution = 0;
	  this.healWarmupDelay = 1;
	  this.healCooldownDelay = 1;
	  this.skillWarmupDelay = 1;
	  this.skillCooldownDelay = 1;
	  this.attackEnabled = true;
	  this.healEnabled = true;
	  this.skillEnabled = true;

	  this.ability = null;
	  this.actions = {};
	  this.callbacks = {};

	  this.effects = null;
	  this.damage = null;
	  this.status = {};
	  this.reset();
	  this.clearStatus();
	};

	Unit.prototype = Object.create(Object.prototype);
	Unit.prototype.constructor = Object;

	Unit.prototype.dispatch = function () {
	  var args = Array.prototype.slice.call(arguments);
	  var handler = args.shift();
	  var callback = this.callbacks[handler];
	  if (callback) {
	    callback.apply(this, args);
	  }
	};

	Unit.prototype.reset = function () {
	  this.damage = 0;
	  this.effects = [];

	  for (var i in this.actions) {
	    var action = this.actions[i];
	    action.reset();
	  }

	  if (this.class && window[this.class.effect]) {
	    var effect = new window[this.class.effect](this, 0, Infinity, 1);
	    this.addEffect(effect, 0);
	  }
	};

	Unit.prototype.clearStatus = function () {
	  var status = this.status;
	  status.health = this.health;
	  status.strength = this.strength;
	  status.defence = this.defence;
	  status.resistance = this.resistance;
	  status.attackWarmupDelay = this.attackWarmupDelay;
	  status.attackCooldownDelay = this.attackCooldownDelay;
	  status.attackTimes = this.attackTimes;
	  status.healWarmupDelay = this.healWarmupDelay;
	  status.healCooldownDelay = this.healCooldownDelay;
	  status.skillWarmupDelay = this.skillWarmupDelay;
	  status.skillCooldownDelay = this.skillCooldownDelay;
	  status.attackEnabled = this.attackEnabled;
	  status.healEnabled = this.healEnabled;
	  status.skillEnabled = this.skillEnabled;
	  status.attackAttribution = this.attackAttribution;
	};

	Unit.prototype.updateStatus = function (elapsedTime) {
	  this.clearStatus();
	  for (var i = 0; i < this.effects.length; i++) {
	    var effect = this.effects[i];
	    effect.update(elapsedTime);
	    if (effect.expired) {
	      this.effects.splice(i--, 1);
	      this.dispatch('effectRemoved', elapsedTime, effect);
	    }
	  }
	  this.actions.attack.enabled = this.status.attackEnabled;
	  this.actions.heal.enabled = this.status.healEnabled;
	  this.actions.skill.enabled = this.status.skillEnabled;
	};

	Unit.prototype.updateActions = function (elapsedTime) {
	  for (var i in this.actions) {
	    var action = this.actions[i];
	    action.update(elapsedTime);
	  }
	};

	Unit.prototype.damaged = function (damage, from, elapsedTime) {
	  var before = this.damage;
	  var after = before + damage;
	  this.damage = after;
	  this.dispatch('damaged', elapsedTime, damage, from, before, after);
	  return damage;
	};

	Unit.prototype.calcDamage = function (attacker, defender) {
	  return Math.floor(attacker.actions.attack.calcDamage(attacker, defender));
	};

	Unit.prototype.recover = function (recover, from, elapsedTime) {
	  var before = this.damage;
	  var after = Math.max(before - recover, 0);
	  this.damage = after;
	  this.dispatch('recovered', elapsedTime, recover, from, before, after);
	  return recover;
	};

	Unit.prototype.calcRecovery = function (healer, target) {
	  return Math.floor(healer.actions.heal.calcDamage(healer, target));
	};

	Unit.prototype.addEffect = function (effect, elapsedTime) {
	  this.effects.push(effect);
	  this.dispatch('effectAdded', elapsedTime, effect);
	};

	/**
	 * Action
	 */
	this.Action = function Action(owner, warmupTime, cooldownTime) {
	  this.name = '?';
	  this.owner = owner;
	  this.warmupTime = warmupTime;
	  this.cooldownTime = cooldownTime;
	  this.warmupDelay = 1;
	  this.cooldownDelay = 1;
	  this.state = 0; // {0: warmup, 1: idle, 2: cooldown}
	  this.baseTime = 0;
	  this.callbacks = {};
	};

	Action.prototype = Object.create(Object.prototype, {
	  executable: {
	    configuable: false,
	    get: function () {
	      return this.state == 1;
	    }
	  }
	});
	Action.prototype.constructor = Object;

	Action.prototype.reset = function () {
	  this.state = 0;
	  this.baseTime = 0;
	  this.enabled = true;
	};

	Action.prototype.dispatch = function () {
	  var args = Array.prototype.slice.call(arguments);
	  var handler = args.shift();
	  var callback = this.callbacks[handler];
	  if (callback) {
	    callback.apply(this, args);
	  }
	};

	Action.prototype.update = function (elapsedTime) {
	  if (!this.enabled) {
	    return;
	  }

	  while (true) {
	    switch (this.state) {
	    case 0:
	      var warmupTime = this.getWarmupTime() * this.getWarmupDelay();
	      if (elapsedTime >= this.baseTime + warmupTime) {
	        this.state = 1;
	        this.baseTime = this.baseTime + this.warmupTime;
	        this.dispatch('warmup', elapsedTime);
	        continue;
	      }
	      break;

	    case 1:
	      break;

	    case 2:
	      this.state = 3;
	      this.baseTime = elapsedTime + this.getDuration();
	      this.dispatch('execute', elapsedTime);
	      continue;

	    case 3:
	      var cooldownTime = this.getCooldownTime() * this.getCooldownDelay();
	      if (elapsedTime >= this.baseTime + cooldownTime) {
	        this.state = 1;
	        this.baseTime = this.baseTime + cooldownTime;
	        this.dispatch('warmup', elapsedTime);
	      }
	      break;
	    }

	    break;
	  }
	};

	Action.prototype.execute = function (elapsedTime) {
	  if (!this.executable) {
	    throw new Error('Unable to execute action. current state is ' + this.state);
	  }

	  this.state = 2;
	  this.update(elapsedTime);
	};

	Action.prototype.getDuration = function () {
	  return 0;
	};

	Action.prototype.getWarmupTime = function () {
	  return this.warmupTime;
	};

	Action.prototype.getCooldownTime = function () {
	  return this.cooldownTime;
	};

	Action.prototype.getWarmupDelay = function () {
	  return this.warmupDelay;
	};

	Action.prototype.getCooldownDelay = function () {
	  return this.cooldownDelay;
	};

	/**
	 * Attack
	 */
	this.Attack = function Attack(owner, warmupTime, cooldownTime) {
	  Action.call(this, owner, warmupTime, cooldownTime);
	};

	Attack.prototype = Object.create(Action.prototype);
	Attack.prototype.constructor = Action;

	Attack.prototype.getWarmupDelay = function () {
	  return this.owner.status.attackWarmupDelay;
	};

	Attack.prototype.getCooldownDelay = function () {
	  return this.owner.status.attackCooldownDelay;
	};

	Attack.prototype.calcDamage = function (attacker, defender) {
	  throw new Error('Not implemented');
	};

	/**
	 * NullAttack
	 */
	this.NullAttack = function PhygicalAttack(owner, warmupTime, cooldownTime) {
	  Attack.call(this, owner, Infinity, Infinity);
	};

	NullAttack.prototype = Object.create(Attack.prototype);
	NullAttack.prototype.constructor = Attack;

	NullAttack.prototype.calcDamage = function (attacker, defender) {
	  return 0;
	};

	/**
	 * PhygicalAttack
	 */
	this.PhygicalAttack = function PhygicalAttack(owner, warmupTime, cooldownTime) {
	  Attack.call(this, owner, warmupTime, cooldownTime);

	  this.magical = false;
	};

	PhygicalAttack.prototype = Object.create(Attack.prototype);
	PhygicalAttack.prototype.constructor = Attack;

	PhygicalAttack.prototype.calcDamage = function (attacker, defender) {
	  var atkStatus = attacker.status;
	  var defStatus = defender.status;
	  var def = atkStatus.attackAttribution === 0 ? defStatus.defence : 0;
	  var guarantee = Math.floor(atkStatus.strength / 10);
	  return Math.max(atkStatus.strength - def, guarantee, 0) * atkStatus.attackTimes;
	};

	/**
	 * MagicalAttack
	 */
	this.MagicalAttack = function MagicalAttack(owner, warmupTime, cooldownTime) {
	  Attack.call(this, owner, warmupTime, cooldownTime);
	};

	MagicalAttack.prototype = Object.create(Attack.prototype);
	MagicalAttack.prototype.constructor = Attack;

	MagicalAttack.prototype.calcDamage = function (attacker, defender) {
	  var atkStatus = attacker.status;
	  var defStatus = defender.status;
	  var damage = Math.max(Math.floor(atkStatus.strength * (1 - defStatus.resistance / 100)), 0);
	  return damage * atkStatus.attackTimes;
	};

	/**
	 * MagicalSplashAttack
	 */
	this.MagicalSplashAttack = function MagicalSplashAttack(owner, warmupTime, cooldownTime) {
	  Attack.call(this, owner, warmupTime, cooldownTime);
	};

	MagicalSplashAttack.prototype = Object.create(Attack.prototype);
	MagicalSplashAttack.prototype.constructor = Attack;

	MagicalSplashAttack.prototype.calcDamage = function (attacker, defender) {
	  var atkStatus = attacker.status;
	  var defStatus = defender.status;
	  return Math.max(atkStatus.strength - defStatus.defence, 0) * atkStatus.attackTimes;
	};

	/**
	 * Heal
	 */
	this.Heal = function Heal(owner, warmupTime, cooldownTime) {
	  Action.call(this, owner, warmupTime, cooldownTime);
	};

	Heal.prototype = Object.create(Action.prototype);
	Heal.prototype.constructor = Action;

	Heal.prototype.getWarmupDelay = function () {
	  return this.owner.status.attackWarmupDelay;
	};

	Heal.prototype.getCooldownDelay = function () {
	  return this.owner.status.attackCooldownDelay;
	};

	Heal.prototype.calcRecovery = function (healer, defender) {
	  throw new Error('Not implemented');
	};

	/**
	 * NullHeal
	 */
	this.NullHeal = function NullHeal(owner, warmupTime, cooldownTime) {
	  Heal.call(this, owner, Infinity, Infinity);
	};

	NullHeal.prototype = Object.create(Heal.prototype);
	NullHeal.prototype.constructor = Heal;

	NullHeal.prototype.calcRecovery = function (healer, defender) {
	  return 0;
	};

	/**
	 * MagicalHeal
	 */
	this.MagicalHeal = function MagicalHeal(owner, warmupTime, cooldownTime) {
	  Heal.call(this, owner, warmupTime, cooldownTime);
	};

	MagicalHeal.prototype = Object.create(Heal.prototype);
	MagicalHeal.prototype.constructor = Heal;

	MagicalHeal.prototype.calcDamage = function (healer, defender) {
	  var helStatus = healer.status;
	  return helStatus.strength;
	};

	/**
	 * Skill
	 */
	this.Skill = function Skill(owner, level, parameters) {
	  Action.call(this, owner, Infinity, Infinity);

	  this.level = level;
	  this.parameters = parameters || this.getParamTable();
	  this.param = this.parameters[this.owner.rarity.id];
	};

	Skill.prototype = Object.create(Action.prototype);
	Skill.prototype.constructor = Action;

	Skill.prototype.getDuration = function () {
	  if (!this.param) {
	    return Infinity;
	  }
	  return this.param.durationBase + this.param.durationRate * this.level;
	};

	Skill.prototype.getWarmupTime = function () {
	  if (!this.param) {
	    return Infinity;
	  }
	  return this.param.warmupBase + this.param.warmupRate * this.level;
	};

	Skill.prototype.getCooldownTime = function () {
	  if (!this.param) {
	    return Infinity;
	  }
	  return this.param.cooldownBase + this.param.cooldownRate * this.level;
	};

	Skill.prototype.getMultiplier = function () {
	  if (!this.param) {
	    return Infinity;
	  }
	  return this.param.multiplierBase + this.param.multiplierRate * this.level;
	};

	Skill.prototype.getWarmupDelay = function () {
	  return this.owner.status.skillWarmupDelay;
	};

	Skill.prototype.getCooldownDelay = function () {
	  return this.owner.status.skillCooldownDelay;
	};

	Skill.prototype.getParamTable = function () {
	  return {};
	};

	/**
	 * NullSkill
	 */
	this.NullSkill = function NullSkill(owner, level) {
	  Skill.call(this, owner, level);

	  this.warmupTime = Infinity;
	  this.cooldownTime = Infinity;
	};

	NullSkill.prototype = Object.create(Skill.prototype);
	NullSkill.prototype.constructor = Skill;

	/**
	 * RaiseMoraleSkill
	 */
	this.RaiseMoraleSkill = function RaiseMoraleSkill(owner, level) {
	  Skill.call(this, owner, level);
	};

	RaiseMoraleSkill.prototype = Object.create(Skill.prototype);
	RaiseMoraleSkill.prototype.constructor = Skill;

	RaiseMoraleSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var stage = this.owner.stage;
	  var all = stage.condition.princeOnField;
	  stage.units.forEach(function (unit) {
	    if (unit.group == 1 && (all || unit.base.id == Aigis.settings.princeId)) {
	      var morale = stage.status.morale;
	      var effect = new MoraleEffect(unit, elapsedTime, duration, morale);
	      unit.addEffect(effect, elapsedTime);
	    }
	  });
	};

	RaiseMoraleSkill.prototype.getParamTable = function () {
	  return {
	    '1': {
	      durationBase: Infinity,
	      durationRate: Infinity,
	      warmupBase: 0,
	      warmupRate: 0,
	      cooldownBase: Infinity,
	      cooldownRate: Infinity
	    }
	  };
	};

	/**
	 * EnforceStrengthSkill
	 */
	this.EnforceStrengthSkill = function EnforceStrengthSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	EnforceStrengthSkill.prototype = Object.create(Skill.prototype);
	EnforceStrengthSkill.prototype.constructor = Skill;

	EnforceStrengthSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var multiplier = this.getMultiplier();
	  var effect = new EnforceStrengthEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * DesperationSkill
	 */
	this.DesperationSkill = function DesperationSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	DesperationSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	DesperationSkill.prototype.constructor = EnforceStrengthSkill;

	/**
	 * Desperation1Skill
	 */
	this.Desperation1Skill = function Desperation1Skill(owner, level) {
	  DesperationSkill.call(this, owner, level);
	};

	Desperation1Skill.prototype = Object.create(DesperationSkill.prototype);
	Desperation1Skill.prototype.constructor = DesperationSkill;

	Desperation1Skill.prototype.getParamTable = function () {
	  return {
	    '4': {
	      durationBase: 10000,
	      durationRate: 0,
	      warmupBase: 45000,
	      warmupRate: -1000,
	      cooldownBase: 45000,
	      cooldownRate: -1000,
	      multiplierBase: 1.375,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * Desperation2Skill
	 */
	this.Desperation2Skill = function Desperation2Skill(owner, level) {
	  DesperationSkill.call(this, owner, level);
	};

	Desperation2Skill.prototype = Object.create(DesperationSkill.prototype);
	Desperation2Skill.prototype.constructor = DesperationSkill;

	Desperation2Skill.prototype.getParamTable = function () {
	  return {
	    '5': {
	      durationBase: 10000,
	      durationRate: 0,
	      warmupBase: 27000,
	      warmupRate: -1000,
	      cooldownBase: 35000,
	      cooldownRate: -1000,
	      multiplierBase: 1.575,
	      multiplierRate: 0.125
	    },
	    '6': {
	      durationBase: 10000,
	      durationRate: 0,
	      warmupBase: 21000,
	      warmupRate: -1000,
	      cooldownBase: 35000,
	      cooldownRate: -1000,
	      multiplierBase: 1.575,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * Desperation3Skill
	 */
	this.Desperation3Skill = function Desperation3Skill(owner, level) {
	  DesperationSkill.call(this, owner, level);
	};

	Desperation3Skill.prototype = Object.create(DesperationSkill.prototype);
	Desperation3Skill.prototype.constructor = DesperationSkill;

	Desperation3Skill.prototype.getParamTable = function () {
	  return {
	    '5': {
	      durationBase: 10000,
	      durationRate: 0,
	      warmupBase: 27000,
	      warmupRate: -1000,
	      cooldownBase: 35000,
	      cooldownRate: -1000,
	      multiplierBase: 1.775,
	      multiplierRate: 0.125
	    },
	    '6': {
	      durationBase: 10000,
	      durationRate: 0,
	      warmupBase: 21000,
	      warmupRate: -1000,
	      cooldownBase: 35000,
	      cooldownRate: -1000,
	      multiplierBase: 1.775,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * AssassinationSkill
	 */
	this.AssassinationSkill = function AssassinationSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	AssassinationSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	AssassinationSkill.prototype.constructor = EnforceStrengthSkill;

	/**
	 * Assassination1Skill
	 */
	this.Assassination1Skill = function Assassination1Skill(owner, level) {
	  AssassinationSkill.call(this, owner, level);
	};

	Assassination1Skill.prototype = Object.create(AssassinationSkill.prototype);
	Assassination1Skill.prototype.constructor = AssassinationSkill;

	Assassination1Skill.prototype.getParamTable = function () {
	  return {
	    '4': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 60000,
	      warmupRate: -1000,
	      cooldownBase: 60000,
	      cooldownRate: -1000,
	      multiplierBase: 1,
	      multiplierRate: 0.1
	    },
	    '5': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 41000,
	      warmupRate: -1000,
	      cooldownBase: 60000,
	      cooldownRate: -1000,
	      multiplierBase: 1,
	      multiplierRate: 0.1
	    }
	  };
	};

	/**
	 * Assassination2Skill
	 */
	this.Assassination2Skill = function Assassination2Skill(owner, level) {
	  AssassinationSkill.call(this, owner, level);
	};

	Assassination2Skill.prototype = Object.create(AssassinationSkill.prototype);
	Assassination2Skill.prototype.constructor = AssassinationSkill;

	Assassination2Skill.prototype.getParamTable = function () {
	  return {
	    '5': {
	      durationBase: 20000,
	      durationRate: 0,
	      warmupBase: 23000,
	      warmupRate: -1000,
	      cooldownBase: 50000,
	      cooldownRate: -1000,
	      multiplierBase: 1.1,
	      multiplierRate: 0.125
	    },
	    '6': {
	      durationBase: 20000,
	      durationRate: 0,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 50000,
	      cooldownRate: -1000,
	      multiplierBase: 1.1,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * Assassination3Skill
	 */
	this.Assassination3Skill = function Assassination3Skill(owner, level) {
	  AssassinationSkill.call(this, owner, level);
	};

	Assassination3Skill.prototype = Object.create(AssassinationSkill.prototype);
	Assassination3Skill.prototype.constructor = AssassinationSkill;

	Assassination3Skill.prototype.getParamTable = function () {
	  return {
	    '7': {
	      durationBase: 25000,
	      durationRate: 0,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 45000,
	      cooldownRate: -1000,
	      multiplierBase: 1.15,
	      multiplierRate: 0.15
	    }
	  };
	};

	/**
	 * AroundightSkill
	 */
	this.AroundightSkill = function AroundightSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	AroundightSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	AroundightSkill.prototype.constructor = EnforceStrengthSkill;

	AroundightSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 28750,
	      durationRate: 1250,
	      warmupBase: 45000,
	      warmupRate: 1000,
	      cooldownBase: 90000,
	      cooldownRate: -1000,
	      multiplierBase: 1.5,
	      multiplierRate: 0
	    }
	  };
	};

	/**
	 * FragarachSkill
	 */
	this.FragarachSkill = function FragarachSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	FragarachSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	FragarachSkill.prototype.constructor = EnforceStrengthSkill;

	FragarachSkill.prototype.getParamTable = function () {
	  return {
	    '7': {
	      durationBase: 28000,
	      durationRate: 2000,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 90000,
	      cooldownRate: -1000,
	      multiplierBase: 1,
	      multiplierRate: 0.1
	    }
	  };
	};

	/**
	 * TyrfingSkill
	 */
	this.TyrfingSkill = function TyrfingSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	TyrfingSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	TyrfingSkill.prototype.constructor = EnforceStrengthSkill;

	TyrfingSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 8000,
	      durationRate: 1000,
	      warmupBase: 10000,
	      warmupRate: -1000,
	      cooldownBase: 24000,
	      cooldownRate: -1000,
	      multiplierBase: 1.05,
	      multiplierRate: 0.05
	    },
	    '7': {
	      durationBase: 8000,
	      durationRate: 1000,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 80000,
	      cooldownRate: -1000,
	      multiplierBase: 1.05,
	      multiplierRate: 0.05
	    }
	  };
	};

	/**
	 * ExorcismFireSkill
	 */
	this.ExorcismFireSkill = function ExorcismFireSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	ExorcismFireSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	ExorcismFireSkill.prototype.constructor = EnforceStrengthSkill;

	ExorcismFireSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 23000,
	      warmupRate: -1000,
	      cooldownBase: 45000,
	      cooldownRate: -1000,
	      multiplierBase: 1.175,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * HolySenseSkill
	 */
	this.HolySenseSkill = function HolySenseSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	HolySenseSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	HolySenseSkill.prototype.constructor = EnforceStrengthSkill;

	HolySenseSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 2500,
	      durationRate: 7500,
	      warmupBase: 16000,
	      warmupRate: -1000,
	      cooldownBase: 30000,
	      cooldownRate: -1000,
	      multiplierBase: 2,
	      multiplierRate: 0
	    }
	  };
	};

	/**
	 * MultipleShotSkill
	 */
	this.MultipleShotSkill = function MultipleShotSkill(owner, level) {
	  Skill.call(this, owner, level);

	  this.delta = 0;
	};

	MultipleShotSkill.prototype = Object.create(Skill.prototype);
	MultipleShotSkill.prototype.constructor = Skill;

	MultipleShotSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var effect = new MultipleAttackEffect(this.owner, elapsedTime, duration, this.delta);
	  this.owner.addEffect(effect, elapsedTime);
	};

	MultipleShotSkill.prototype.getParamTable = function () {
	  throw new Error('Not implemented');
	};

	/**
	 * DoubleShotSkill
	 */
	this.DoubleShotSkill = function DoubleShotSkill(owner, level) {
	  MultipleShotSkill.call(this, owner, level);

	  this.delta = 2;
	};

	DoubleShotSkill.prototype = Object.create(MultipleShotSkill.prototype);
	DoubleShotSkill.prototype.constructor = MultipleShotSkill;

	DoubleShotSkill.prototype.getParamTable = function () {
	  return {
	    '5': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 34000,
	      warmupRate: -1000,
	      cooldownBase: 50000,
	      cooldownRate: -1000
	    },
	    '6': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 26000,
	      warmupRate: -1000,
	      cooldownBase: 50000,
	      cooldownRate: -1000
	    }
	  };
	};

	/**
	 * TripleShotSkill
	 */
	this.TripleShotSkill = function TripleShotSkill(owner, level) {
	  MultipleShotSkill.call(this, owner, level);

	  this.delta = 2;
	};

	TripleShotSkill.prototype = Object.create(MultipleShotSkill.prototype);
	TripleShotSkill.prototype.constructor = MultipleShotSkill;

	TripleShotSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 22000,
	      warmupRate: -1000,
	      cooldownBase: 43000,
	      cooldownRate: -1000
	    },
	    '7': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 43000,
	      cooldownRate: -1000
	    }
	  };
	};

	/**
	 * QuadroShotSkill
	 */
	this.QuadroShotSkill = function QuadroShotSkill(owner, level) {
	  MultipleShotSkill.call(this, owner, level);

	  this.delta = 3;
	};

	QuadroShotSkill.prototype = Object.create(MultipleShotSkill.prototype);
	QuadroShotSkill.prototype.constructor = MultipleShotSkill;

	QuadroShotSkill.prototype.getParamTable = function () {
	  return {
	    '7': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 40000,
	      cooldownRate: -1000
	    }
	  };
	};

	/**
	 * QuickShotSkill
	 */
	this.QuickShotSkill = function QuickShotSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	QuickShotSkill.prototype = Object.create(Skill.prototype);
	QuickShotSkill.prototype.constructor = Skill;

	QuickShotSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var multiplier = this.getMultiplier();
	  var effect = new EnforceStrengthEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);

	  var delay = this.getDelay();
	  effect = new AttackDelayEffect(this.owner, elapsedTime, duration, 0, 1 - delay);
	  this.owner.addEffect(effect, elapsedTime);
	};

	QuickShotSkill.prototype.getDelay = function () {
	  if (!this.param) {
	    return Infinity;
	  }
	  return this.param.delayBase + this.param.delayRate * this.level;
	};

	/**
	 * BarrageShotSkill
	 */
	this.BarrageShotSkill = function BarrageShotSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	BarrageShotSkill.prototype = Object.create(Skill.prototype);
	BarrageShotSkill.prototype.constructor = Skill;

	BarrageShotSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var multiplier = this.getMultiplier();
	  var effect = new EnforceStrengthEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);

	  var delay = this.getDelay();
	  effect = new AttackDelayEffect(this.owner, elapsedTime, duration, 0, 1 - delay);
	  this.owner.addEffect(effect, elapsedTime);
	};

	BarrageShotSkill.prototype.getDelay = function () {
	  if (!this.param) {
	    return Infinity;
	  }
	  return this.param.delayBase + this.param.delayRate * this.level;
	};

	/**
	 * ModeChangeSkill
	 */
	this.ModeChangeSkill = function ModeChangeSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	ModeChangeSkill.prototype = Object.create(Skill.prototype);
	ModeChangeSkill.prototype.constructor = Skill;

	ModeChangeSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var delay = this.getDelay();
	  effect = new AttackDelayEffect(this.owner, elapsedTime, duration, 0, delay);
	  this.owner.addEffect(effect, elapsedTime);
	};

	ModeChangeSkill.prototype.getDelay = function () {
	  if (!this.param) {
	    return Infinity;
	  }
	  return this.param.delayBase + this.param.delayRate * this.level;
	};

	/**
	 * MagicBulletSkill
	 */
	this.MagicBulletSkill = function MagicBulletSkill(owner, level) {
	  QuickShotSkill.call(this, owner, level);
	};

	MagicBulletSkill.prototype = Object.create(QuickShotSkill.prototype);
	MagicBulletSkill.prototype.constructor = QuickShotSkill;

	/**
	 * MagicBullet1Skill
	 */
	this.MagicBullet1Skill = function MagicBullet1Skill(owner, level) {
	  MagicBulletSkill.call(this, owner, level);
	};

	MagicBullet1Skill.prototype = Object.create(MagicBulletSkill.prototype);
	MagicBullet1Skill.prototype.constructor = MagicBulletSkill;

	MagicBullet1Skill.prototype.getParamTable = function () {
	  return {
	    '7': {
	      durationBase: 23750,
	      durationRate: 1250,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 60000,
	      cooldownRate: -1,
	      multiplierBase: 1,
	      multiplierRate: 0.1,
	      delayBase: 0.50,
	      delayRate: 0
	    }
	  };
	};

	/**
	 * MagicBullet2Skill
	 */
	this.MagicBullet2Skill = function MagicBullet2Skill(owner, level) {
	  MagicBulletSkill.call(this, owner, level);
	};

	MagicBullet2Skill.prototype = Object.create(MagicBulletSkill.prototype);
	MagicBullet2Skill.prototype.constructor = MagicBulletSkill;

	MagicBullet2Skill.prototype.getParamTable = function () {
	  return {
	    '7': {
	      durationBase: 23750,
	      durationRate: 1250,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 60000,
	      cooldownRate: -1000,
	      multiplierBase: 1.075,
	      multiplierRate: 0.125,
	      delayBase: 0.50,
	      delayRate: 0
	    }
	  };
	};

	/**
	 * ExcellentAllowSkill
	 */
	this.ExcellentAllowSkill = function ExcellentAllowSkill(owner, level, parameters) {
	  EnforceStrengthSkill.call(this, owner, level, parameters);
	};

	ExcellentAllowSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	ExcellentAllowSkill.prototype.constructor = EnforceStrengthSkill;

	/**
	 * EnforceHealingSkill
	 */
	this.EnforceHealingSkill = function EnforceHealingSkill(owner, level, parameters) {
	  EnforceStrengthSkill.call(this, owner, level, parameters);
	};

	EnforceHealingSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	EnforceHealingSkill.prototype.constructor = EnforceStrengthSkill;


	/**
	 * EnforceHealing1Skill
	 */
	this.EnforceHealing1Skill = function EnforceHealing1Skill(owner, level) {
	  EnforceHealingSkill.call(this, owner, level);
	};

	EnforceHealing1Skill.prototype = Object.create(EnforceHealingSkill.prototype);
	EnforceHealing1Skill.prototype.constructor = EnforceHealingSkill;

	EnforceHealing1Skill.prototype.getParamTable = function () {
	  return {
	    '4': {
	      durationBase: 18750,
	      durationRate: 1250,
	      warmupBase: 50000,
	      warmupRate: -1000,
	      cooldownBase: 50000,
	      cooldownRate: -1000,
	      multiplierBase: 1,
	      multiplierRate: 0.1
	    },
	    '5': {
	      durationBase: 18750,
	      durationRate: 1250,
	      warmupBase: 34000,
	      warmupRate: -1000,
	      cooldownBase: 50000,
	      cooldownRate: -1000,
	      multiplierBase: 1,
	      multiplierRate: 0.1
	    }
	  };
	};

	/**
	 * EnforceHealing2Skill
	 */
	this.EnforceHealing2Skill = function EnforceHealing2Skill(owner, level) {
	  EnforceHealingSkill.call(this, owner, level);
	};

	EnforceHealing2Skill.prototype = Object.create(EnforceHealingSkill.prototype);
	EnforceHealing2Skill.prototype.constructor = EnforceHealingSkill;

	EnforceHealing2Skill.prototype.getParamTable = function () {
	  return {
	    '5': {
	      durationBase: 24000,
	      durationRate: 1000,
	      warmupBase: 30000,
	      warmupRate: -1000,
	      cooldownBase: 45000,
	      cooldownRate: -1000,
	      multiplierBase: 1.075,
	      multiplierRate: 0.125
	    },
	    '6': {
	      durationBase: 24000,
	      durationRate: 1000,
	      warmupBase: 24000,
	      warmupRate: -1000,
	      cooldownBase: 45000,
	      cooldownRate: -1000,
	      multiplierBase: 1.075,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * EnforceHealing3Skill
	 */
	this.EnforceHealing3Skill = function EnforceHealing3Skill(owner, level) {
	  EnforceHealingSkill.call(this, owner, level);
	};

	EnforceHealing3Skill.prototype = Object.create(EnforceHealingSkill.prototype);
	EnforceHealing3Skill.prototype.constructor = EnforceHealingSkill;

	EnforceHealing3Skill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 29000,
	      durationRate: 1000,
	      warmupBase: 21000,
	      warmupRate: -1000,
	      cooldownBase: 40000,
	      cooldownRate: -1000,
	      multiplierBase: 1.15,
	      multiplierRate: 0.15
	    }
	  };
	};

	/**
	 * HealingPrayerSkill
	 */
	this.HealingPrayerSkill = function HealingPrayerSkill(owner, level) {
	  EnforceHealingSkill.call(this, owner, level);
	};

	HealingPrayerSkill.prototype = Object.create(EnforceHealingSkill.prototype);
	HealingPrayerSkill.prototype.constructor = EnforceHealingSkill;

	HealingPrayerSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 13000,
	      warmupRate: -500,
	      cooldownBase: 25000,
	      cooldownRate: -1000,
	      multiplierBase: 1.175,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * StarWandSkill
	 */
	this.StarWandSkill = function StarWandSkill(owner, level) {
	  EnforceHealingSkill.call(this, owner, level);
	};

	StarWandSkill.prototype = Object.create(EnforceHealingSkill.prototype);
	StarWandSkill.prototype.constructor = EnforceHealingSkill;

	StarWandSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 29000,
	      durationRate: 1000,
	      warmupBase: 21000,
	      warmupRate: -1000,
	      cooldownBase: 40000,
	      cooldownRate: -1000,
	      multiplierBase: 1.15,
	      multiplierRate: 0.05
	    }
	  };
	};

	/**
	 * HealingMagicSkill
	 */
	this.HealingMagicSkill = function HealingMagicSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	HealingMagicSkill.prototype = Object.create(Skill.prototype);
	HealingMagicSkill.prototype.constructor = Skill;

	HealingMagicSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var effect = new SwitchHealerEffect(this.owner, elapsedTime, duration);
	  this.owner.addEffect(effect, elapsedTime);

	  var multiplier = this.getMultiplier();
	  effect = new EnforceStrengthEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * Effect
	 */
	this.Effect = function Effect(owner, startTime, duration) {
	  this.name = '?';
	  this.owner = owner;
	  this.startTime = startTime;
	  this.duration = duration;
	  this.priority = 0;
	  this.expired = false;
	  this.callbacks = {};
	};

	Effect.prototype = Object.create(Object.prototype, {});
	Effect.prototype.constructor = Object;

	Effect.prototype.dispatch = function () {
	  var args = Array.prototype.slice.call(arguments);
	  var handler = args.shift();
	  var callback = this.callbacks[handler];
	  if (callback) {
	    callback.apply(this, args);
	  }
	};

	Effect.prototype.update = function (elapsedTime) {
	  if (this.expired || elapsedTime - this.startTime > this.duration) {
	    this.expire(elapsedTime);
	  }
	};

	Effect.prototype.expire = function (elapsedTime) {
	  this.expired = true;
	  this.dispatch('expire');
	};

	Effect.prototype.dump = function () {
	  return '?';
	};

	/**
	 * MoraleEffect
	 */
	this.MoraleEffect = function MoraleEffect(owner, startTime, duration, rate) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '士気高揚';
	  this.rate = rate;
	};

	MoraleEffect.prototype = Object.create(Effect.prototype, {});
	MoraleEffect.prototype.constructor = Effect;

	MoraleEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.strength *= this.rate;
	  this.owner.status.defence *= this.rate;
	};

	MoraleEffect.prototype.dump = function () {
	  var rate = (Math.floor(this.rate * 100)) + '%';
	  return ' 攻撃力補正:' + rate +
	    ' 防御力補正:' + rate +
	    ' 効果時間:' + formatTime(this.duration);
	};

	/**
	 * EnforceStrengthEffect
	 */
	this.EnforceStrengthEffect = function EnforceStrengthEffect(owner, startTime, duration, multiplier) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '攻撃力強化';
	  this.multiplier = multiplier;
	};

	EnforceStrengthEffect.prototype = Object.create(Effect.prototype, {});
	EnforceStrengthEffect.prototype.constructor = Effect;

	EnforceStrengthEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.strength *= this.multiplier;
	};

	EnforceStrengthEffect.prototype.dump = function () {
	  return '攻撃力補正:' + (this.multiplier * 100).toFixed(1) + '%' +
	    ' 効果時間:' + formatTime(this.duration);
	};

	/**
	 * EnforceHealthEffect
	 */
	this.EnforceHealthEffect = function EnforceHealthEffect(owner, startTime, duration, multiplier) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '最大HP強化';
	  this.multiplier = multiplier;
	};

	EnforceHealthEffect.prototype = Object.create(Effect.prototype, {});
	EnforceHealthEffect.prototype.constructor = Effect;

	EnforceHealthEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.health *= this.multiplier;
	};

	EnforceHealthEffect.prototype.dump = function () {
	  return '最大HP補正:' + (this.multiplier * 100).toFixed(1) + '%' +
	    ' 効果時間:' + formatTime(this.duration);
	};

	/**
	 * EnforceDefenceEffect
	 */
	this.EnforceDefenceEffect = function EnforceDefenceEffect(owner, startTime, duration, multiplier) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '防御力強化';
	  this.multiplier = multiplier;
	};

	EnforceDefenceEffect.prototype = Object.create(Effect.prototype, {});
	EnforceDefenceEffect.prototype.constructor = Effect;

	EnforceDefenceEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.defence *= this.multiplier;
	};

	EnforceDefenceEffect.prototype.dump = function () {
	  return '防御力補正:' + (this.multiplier * 100).toFixed(1) + '%' +
	    ' 効果時間:' + formatTime(this.duration);
	};


	/**
	 * AttackDelayEffect
	 */
	this.AttackDelayEffect = function AttackDelayEffect(owner, startTime, duration, warmupDelay, cooldownDelay) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '攻撃速度変化';
	  this.warmupDelay = warmupDelay || 1;
	  this.cooldownDelay = cooldownDelay || 1;
	};

	AttackDelayEffect.prototype = Object.create(Effect.prototype, {});
	AttackDelayEffect.prototype.constructor = Effect;

	AttackDelayEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.attackWarmupDelay *= this.warmupDelay;
	  this.owner.status.attackCooldownDelay *= this.cooldownDelay;
	};

	AttackDelayEffect.prototype.dump = function () {
	  return '攻撃ディレイ補正:' + (this.cooldownDelay * 100) + '%' +
	    ' 効果時間:' + formatTime(this.duration);
	};

	/**
	 * MultipleAttackEffect
	 */
	this.MultipleAttackEffect = function MultipleAttackEffect(owner, startTime, duration, delta) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '攻撃回数変化';
	  this.delta = delta;
	};

	MultipleAttackEffect.prototype = Object.create(Effect.prototype, {});
	MultipleAttackEffect.prototype.constructor = Effect;

	MultipleAttackEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.attackTimes += this.delta;
	};

	MultipleAttackEffect.prototype.dump = function () {
	  return '攻撃回数:' + (this.delta > 0 ? '+' : '') + this.delta + '回' +
	    ' 効果時間:' + formatTime(this.duration);
	};

	/**
	 * SelfHealingSkill
	 */
	this.SelfHealingSkill = function SelfHealingSkill(owner, level) {
	  Skill.call(this, owner, level);
	};

	SelfHealingSkill.prototype = Object.create(Skill.prototype);
	SelfHealingSkill.prototype.constructor = Skill;

	SelfHealingSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var multiplier = this.getMultiplier();
	  var effect = new SelfHealingEffect(this.owner, elapsedTime, Infinity, multiplier);
	  this.owner.addEffect(effect, elapsedTime);
	};

	SelfHealingSkill.prototype.getParamTable = function () {
	  throw new Error('Not implemented');
	};

	/**
	 * SelfHealing1Skill
	 */
	this.SelfHealing1Skill = function SelfHealing1Skill(owner, level) {
	  SelfHealingSkill.call(this, owner, level);
	};

	SelfHealing1Skill.prototype = Object.create(SelfHealingSkill.prototype);
	SelfHealing1Skill.prototype.constructor = SelfHealingSkill;

	SelfHealing1Skill.prototype.getParamTable = function () {
	  return {
	    '4': {
	      durationBase: 0,
	      durationRate: 0,
	      warmupBase: 40000,
	      warmupRate: -1000,
	      cooldownBase: 40000,
	      cooldownRate: -1000,
	      multiplierBase: 0.2,
	      multiplierRate: 0.01
	    }
	  };
	};

	/**
	 * SelfHealing2Skill
	 */
	this.SelfHealing2Skill = function SelfHealing2Skill(owner, level) {
	  SelfHealingSkill.call(this, owner, level);
	};

	SelfHealing2Skill.prototype = Object.create(SelfHealingSkill.prototype);
	SelfHealing2Skill.prototype.constructor = SelfHealingSkill;

	SelfHealing2Skill.prototype.getParamTable = function () {
	  return {
	    '5': {
	      durationBase: 0,
	      durationRate: 0,
	      warmupBase: 31000,
	      warmupRate: -1000,
	      cooldownBase: 40000,
	      cooldownRate: -1000,
	      multiplierBase: 0.3,
	      multiplierRate: 0.01
	    }
	  };
	};

	/**
	 * SelfHealing3Skill
	 */
	this.SelfHealing3Skill = function SelfHealing3Skill(owner, level) {
	  SelfHealingSkill.call(this, owner, level);
	};

	SelfHealing3Skill.prototype = Object.create(SelfHealingSkill.prototype);
	SelfHealing3Skill.prototype.constructor = SelfHealingSkill;

	SelfHealing3Skill.prototype.getParamTable = function () {
	  return {
	    '5': {
	      durationBase: 0,
	      durationRate: 0,
	      warmupBase: 30000,
	      warmupRate: -1000,
	      cooldownBase: 50000,
	      cooldownRate: -1000,
	      multiplierBase: 0.4,
	      multiplierRate: 0.01
	    },
	    '6': {
	      durationBase: 0,
	      durationRate: 0,
	      warmupBase: 30000,
	      warmupRate: 0,
	      cooldownBase: 50000,
	      cooldownRate: -1000,
	      multiplierBase: 0.4,
	      multiplierRate: 0.01
	    }
	  };
	};

	/**
	 * SelfHealing4Skill
	 */
	this.SelfHealing4Skill = function SelfHealing4Skill(owner, level) {
	  SelfHealingSkill.call(this, owner, level);
	};

	SelfHealing4Skill.prototype = Object.create(SelfHealingSkill.prototype);
	SelfHealing4Skill.prototype.constructor = SelfHealingSkill;

	SelfHealing4Skill.prototype.getParamTable = function () {
	  return {
	    '7': {
	      durationBase: 0,
	      durationRate: 0,
	      warmupBase: 2000,
	      warmupRate: 0,
	      cooldownBase: 55000,
	      cooldownRate: -1000,
	      multiplierBase: 0.5,
	      multiplierRate: 0.01
	    }
	  };
	};

	/**
	 * SelfHealingEffect
	 */
	this.SelfHealingEffect = function SelfHealingEffect(owner, startTime, duration, multiplier) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '自己回復';
	  this.multiplier = multiplier;
	};

	SelfHealingEffect.prototype = Object.create(Effect.prototype, {});
	SelfHealingEffect.prototype.constructor = Effect;

	SelfHealingEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.recover(this.calcRecovery(), this, elapsedTime);
	  this.expired = true;
	};

	SelfHealingEffect.prototype.dump = function () {
	  return '回復量:' + this.calcRecovery() +
	    ' 対象最大HP:' + this.owner.status.health +
	    ' 回復率:' + (this.multiplier * 100).toFixed(1) + '%';
	};

	SelfHealingEffect.prototype.calcRecovery = function () {
	  return Math.floor(this.owner.status.health * this.multiplier);
	};

	/**
	 * HealingPrayerSkill
	 */
	this.HealingPrayerSkill = function HealingPrayerSkill(owner, level) {
	  Skill.call(this, owner, level);
	};

	HealingPrayerSkill.prototype = Object.create(Skill.prototype);
	HealingPrayerSkill.prototype.constructor = Skill;

	HealingPrayerSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var effect = new SwitchHealerEffect(this.owner, elapsedTime, duration);
	  this.owner.addEffect(effect, elapsedTime);

	  var multiplier = this.getMultiplier();
	  effect = new EnforceStrengthEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);
	};

	HealingPrayerSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 13000,
	      warmupRate: -500,
	      cooldownBase: 25000,
	      cooldownRate: -1000,
	      multiplierBase: 1.175,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * SwitchAttackerEffect
	 */
	this.SwitchAttackerEffect = function SwitchAttackerEffect(owner, startTime, duration) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '攻撃モード';

	  var attack = this.owner.actions.attack;
	  var heal = this.owner.actions.heal;
	  attack.baseTime = heal.baseTime;
	  attack.state = heal.state;
	};

	SwitchAttackerEffect.prototype = Object.create(Effect.prototype, {});
	SwitchAttackerEffect.prototype.constructor = Effect;

	SwitchAttackerEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    var attack = this.owner.actions.attack;
	    var heal = this.owner.actions.heal;
	    heal.baseTime = attack.baseTime;
	    heal.state = attack.state;
	    return;
	  }

	  this.owner.status.attackEnabled = true;
	  this.owner.status.healEnabled = false;
	};

	SwitchAttackerEffect.prototype.dump = function () {
	  return '効果時間:' + formatTime(this.duration);
	};

	/**
	 * SwitchHealerEffect
	 */
	this.SwitchHealerEffect = function SwitchHealerEffect(owner, startTime, duration) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '回復モード';

	  var attack = this.owner.actions.attack;
	  var heal = this.owner.actions.heal;
	  heal.baseTime = attack.baseTime;
	  heal.state = attack.state;
	};

	SwitchHealerEffect.prototype = Object.create(Effect.prototype, {});
	SwitchHealerEffect.prototype.constructor = Effect;

	SwitchHealerEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    var attack = this.owner.actions.attack;
	    var heal = this.owner.actions.heal;
	    attack.baseTime = heal.baseTime;
	    attack.state = heal.state;
	    return;
	  }

	  this.owner.status.attackEnabled = false;
	  this.owner.status.healEnabled = true;
	};

	SwitchHealerEffect.prototype.dump = function () {
	  return '効果時間:' + formatTime(this.duration);
	};

	/**
	 * MagicalSwordSkill
	 */
	this.MagicalSwordSkill = function MagicalSwordSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	MagicalSwordSkill.prototype = Object.create(Skill.prototype);
	MagicalSwordSkill.prototype.constructor = Skill;

	MagicalSwordSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var multiplier = this.getMultiplier();
	  var effect = new EnforceStrengthEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);

	  effect = new EnchantAttributionEffect(this.owner, elapsedTime, duration, 1);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * SwordEnhanceSkill
	 */
	this.SwordEnhanceSkill = function SwordEnhanceSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	SwordEnhanceSkill.prototype = Object.create(Skill.prototype);
	SwordEnhanceSkill.prototype.constructor = Skill;

	SwordEnhanceSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var multiplier = this.getMultiplier();
	  var effect = new EnforceStrengthEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);

	  effect = new EnchantAttributionEffect(this.owner, elapsedTime, duration, 1);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * EnchantAttributionEffect
	 */
	this.EnchantAttributionEffect = function EnchantAttributionEffect(owner, startTime, duration, attribution) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '属性付与';
	  this.attribution = attribution;
	};

	EnchantAttributionEffect.prototype = Object.create(Effect.prototype, {});
	EnchantAttributionEffect.prototype.constructor = Effect;

	EnchantAttributionEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.attackAttribution = this.attribution;
	};

	EnchantAttributionEffect.prototype.dump = function () {
	  var attribution = '準魔法';
	  return '効果時間:' + formatTime(this.duration) +
	    ' 属性:' + attribution;
	};

	/**
	 * ExorcismFireSkill
	 */
	this.ExorcismFireSkill = function ExorcismFireSkill(owner, level) {
	  Skill.call(this, owner, level);
	};

	ExorcismFireSkill.prototype = Object.create(Skill.prototype);
	ExorcismFireSkill.prototype.constructor = Skill;

	ExorcismFireSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var effect = new SwitchAttackerEffect(this.owner, elapsedTime, duration);
	  this.owner.addEffect(effect, elapsedTime);

	  var multiplier = this.getMultiplier();
	  effect = new EnforceStrengthEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);
	};

	ExorcismFireSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 15000,
	      durationRate: 0,
	      warmupBase: 23000,
	      warmupRate: -500,
	      cooldownBase: 45000,
	      cooldownRate: -1000,
	      multiplierBase: 1.175,
	      multiplierRate: 0.125
	    }
	  };
	};

	/**
	 * MuramasaSkill
	 */
	this.MuramasaSkill = function MuramasaSkill(owner, level) {
	  Skill.call(this, owner, level);
	};

	MuramasaSkill.prototype = Object.create(Skill.prototype);
	MuramasaSkill.prototype.constructor = Skill;

	MuramasaSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var multiplier = this.getMultiplier();
	  var effect = new DrainEffect(this.owner, elapsedTime, duration, multiplier);
	  this.owner.addEffect(effect, elapsedTime);
	};

	MuramasaSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 10000,
	      durationRate: 0,
	      warmupBase: 16000,
	      warmupRate: -500,
	      cooldownBase: 25000,
	      cooldownRate: -1000,
	      multiplierBase: 0,
	      multiplierRate: 0.03
	    }
	  };
	};

	/**
	 * DrainEffect
	 */
	this.DrainEffect = function DrainEffect(owner, startTime, duration, multiplier) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '攻撃時回復';
	  this.multiplier = multiplier;
	  var self = this;
	  this.owner.actions.attack.callbacks.execute = function (elapsedTime) {
	    self.owner.recover(self.calcRecovery(), self.owner, elapsedTime);
	  };
	};

	DrainEffect.prototype = Object.create(Effect.prototype, {});
	DrainEffect.prototype.constructor = Effect;

	DrainEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    delete this.owner.actions.attack.callbacks.execute;
	  }
	};

	DrainEffect.prototype.dump = function () {
	  return '回復量:' + this.calcRecovery() +
	    ' 対象最大HP:' + this.owner.status.health +
	    ' 回復率:' + (this.multiplier * 100).toFixed(1) + '%';
	};

	DrainEffect.prototype.calcRecovery = function () {
	  return Math.floor(this.owner.status.health * this.multiplier);
	};

	/**
	 * FlameFormationSkill
	 */
	this.FlameFormationSkill = function FlameFormationSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	FlameFormationSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	FlameFormationSkill.prototype.constructor = EnforceStrengthSkill;

	FlameFormationSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 8750,
	      durationRate: 1250,
	      warmupBase: 45000,
	      warmupRate: 0,
	      cooldownBase: 90000,
	      cooldownRate: 0,
	      multiplierBase: 1.075,
	      multiplierRate: 0.025
	    }
	  };
	};

	/**
	 * RushSkill
	 */
	this.RushSkill = function RushSkill(owner, level) {
	  Skill.call(this, owner, level);
	};

	RushSkill.prototype = Object.create(Skill.prototype);
	RushSkill.prototype.constructor = Skill;

	RushSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var delay = this.getDelay();
	  var effect = new AttackDelayEffect(this.owner, elapsedTime, duration, 0, 1 - delay);
	  this.owner.addEffect(effect, elapsedTime);
	};

	RushSkill.prototype.getDelay = function () {
	  if (!this.param) {
	    return Infinity;
	  }
	  return this.param.delayBase + this.param.delayRate * this.level;
	};

	RushSkill.prototype.getParamTable = function () {
	  return {
	    '5': {
	      durationBase: 7500,
	      durationRate: 2500,
	      warmupBase: 24000,
	      warmupRate: -1000,
	      cooldownBase: 35000,
	      cooldownRate: -1000,
	      delayBase: 0.50,
	      delayRate: 0
	    }
	  };
	};

	/**
	 * IfritSkill
	 */
	this.IfritSkill = function IfritSkill(owner, level) {
	  Skill.call(this, owner, level);
	};

	IfritSkill.prototype = Object.create(Skill.prototype);
	IfritSkill.prototype.constructor = Skill;

	IfritSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var effect = new EnableAttackEffect(this.owner, elapsedTime, duration);
	  this.owner.addEffect(effect, elapsedTime);
	};

	IfritSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 5000,
	      durationRate: 5000,
	      warmupBase: 12400,
	      warmupRate: -400,
	      cooldownBase: 26000,
	      cooldownRate: -1000
	    }
	  };
	};

	/**
	 * BreakSealSkill
	 */
	this.BreakSealSkill = function BreakSealSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	BreakSealSkill.prototype = Object.create(Skill.prototype);
	BreakSealSkill.prototype.constructor = Skill;

	BreakSealSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var effect = new EnableAttackEffect(this.owner, elapsedTime, duration);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * EnableAttackEffect
	 */
	this.EnableAttackEffect = function EnableAttackEffect(owner, startTime, duration) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '攻撃有効化';
	};

	EnableAttackEffect.prototype = Object.create(Effect.prototype, {});
	EnableAttackEffect.prototype.constructor = Effect;

	EnableAttackEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.attackEnabled = true;
	};

	EnableAttackEffect.prototype.dump = function () {
	  return '効果時間:' + formatTime(this.duration);
	};

	/**
	 * MagicEnhanceSkill
	 */
	this.MagicEnhanceSkill = function MagicEnhanceSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	MagicEnhanceSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	MagicEnhanceSkill.prototype.constructor = EnforceStrengthSkill;

	MagicEnhanceSkill.prototype.getParamTable = function () {
	  return {
	    '4': {
	      durationBase: 35000,
	      durationRate: 5000,
	      warmupBase: 65000,
	      warmupRate: -1000,
	      cooldownBase: 65000,
	      cooldownRate: -1000,
	      multiplierBase: 1.04,
	      multiplierRate: 0.06
	    }
	  };
	};

	/**
	 * CursedBloodSkill
	 */
	this.CursedBloodSkill = function CursedBloodSkill(owner, level) {
	  EnforceStrengthSkill.call(this, owner, level);
	};

	CursedBloodSkill.prototype = Object.create(EnforceStrengthSkill.prototype);
	CursedBloodSkill.prototype.constructor = EnforceStrengthSkill;

	CursedBloodSkill.prototype.getParamTable = function () {
	  return {
	    '6': {
	      durationBase: 13340,
	      durationRate: 1660,
	      warmupBase: 40500,
	      warmupRate: -500,
	      cooldownBase: 80000,
	      cooldownRate: -1000,
	      multiplierBase: 1.165,
	      multiplierRate: 0.035
	    }
	  };
	};

	/**
	 * Ability
	 */
	this.Ability = function Ability(owner) {
	  this.name = '?';
	  this.owner = owner;
	  this.callbacks = {};
	};

	Ability.prototype = Object.create(Object.prototype);
	Ability.prototype.constructor = Object;

	Ability.prototype.dispatch = function () {
	  var args = Array.prototype.slice.call(arguments);
	  var type = args.shift();
	  var callback = this.callbacks[type];
	  if (callback) {
	    callback.apply(this, args);
	  }
	};

	Ability.prototype.update = function () {};

	Ability.prototype.start = function (elapsedTime) {
	  this.dispatch('started', this, elapsedTime);
	};

	/**
	 * NullAbility
	 */
	this.NullAbility = function NullAbility(owner) {
	  Ability.call(this, owner);
	};

	NullAbility.prototype = Object.create(Ability.prototype);
	NullAbility.prototype.constructor = Ability;

	NullAbility.prototype.start = function (elapsedTime) {};

	/**
	 * PrinceAbility
	 */
	this.PrinceAbility = function PrinceAbility(owner) {
	  Ability.call(this, owner);
	};

	PrinceAbility.prototype = Object.create(Ability.prototype);
	PrinceAbility.prototype.constructor = Ability;

	PrinceAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var stage = this.owner.stage;
	  var title = stage.condition.princeTitle;
	  var effect = new TitleEffect(this.owner, elapsedTime, Infinity, title);
	  this.owner.addEffect(effect, elapsedTime);
	};

	PrinceAbility.prototype.update = function (elapsedTime) {
	  this.__proto__.__proto__.update.call(this, elapsedTime);

	  var stage = this.owner.stage;
	  var morale = this.calcMorale();
	  stage.status.morale += morale;
	};

	PrinceAbility.prototype.calcMorale = function () {
	  var condition = this.owner.stage.condition;
	  var base = condition.princeTitle.morale;
	  var rank = condition.rank;
	  return base + Math.ceil(rank / 10 + Math.floor(rank / 100) + 1) / 100 + 1;
	};

	/**
	 * TitleEffect
	 */
	this.TitleEffect = function TitleEffect(owner, startTime, duration, title) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '称号効果';
	  this.title = title;
	};

	TitleEffect.prototype = Object.create(Effect.prototype, {});
	TitleEffect.prototype.constructor = Effect;

	TitleEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.status.health *= 1 + this.title.health;
	  this.owner.status.strength *= 1 + this.title.strength;
	  this.owner.status.defence *= 1 + this.title.defence;
	};

	TitleEffect.prototype.dump = function () {
	  return ' HP補正:' + (Math.floor(this.title.health * 100) + 100) + '%' +
	    ' 攻撃力補正:' + (Math.floor(this.title.strength * 100) + 100) + '%' +
	    ' 防御力補正:' + (Math.floor(this.title.defence * 100) + 100) + '%' +
	    ' 士気値補正:' + (Math.floor(this.title.morale * 100) + 100) + '%' +
	    ' 効果時間:' + formatTime(this.duration);
	};

	/**
	 * PowerAttackAbility
	 */
	this.PowerAttackAbility = function PowerAttackAbility(owner) {
	  Ability.call(this, owner);
	};

	PowerAttackAbility.prototype = Object.create(Ability.prototype);
	PowerAttackAbility.prototype.constructor = Ability;

	PowerAttackAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var multiplier = this.parameters.strength;
	  var effect = new EnforceStrengthEffect(this.owner, elapsedTime, Infinity, multiplier);
	  this.owner.addEffect(effect, elapsedTime);

	  var ct = this.parameters.cooldownTime;
	  effect = new AttackDelayEffect(this.owner, elapsedTime, Infinity, 1, ct);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * HealthBoostAbility
	 */
	this.HealthBoostAbility = function HealthBoostAbility(owner) {
	  Ability.call(this, owner);
	};

	HealthBoostAbility.prototype = Object.create(Ability.prototype);
	HealthBoostAbility.prototype.constructor = Ability;

	HealthBoostAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var multiplier = this.parameters.health;
	  var effect = new EnforceHealthEffect(this.owner, elapsedTime, Infinity, multiplier);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * TeamHealthBoostAbility
	 */
	this.TeamHealthBoostAbility = function TeamHealthBoostAbility(owner) {
	  Ability.call(this, owner);
	};

	TeamHealthBoostAbility.prototype = Object.create(Ability.prototype);
	TeamHealthBoostAbility.prototype.constructor = Ability;

	TeamHealthBoostAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var multiplier = this.parameters.health;
	  var self = this.owner;
	  var stage = this.owner.stage;
	  var toall = stage.condition.abilityToAll;
	  stage.units.forEach(function (unit) {
	    if (unit.group == 1 && (toall || unit == self)) {
	      var effect = new EnforceHealthEffect(unit, elapsedTime, Infinity, multiplier);
	      unit.addEffect(effect, elapsedTime);
	    }
	  });
	};

	/**
	 * QuickAttackAbility
	 */
	this.QuickAttackAbility = function QuickAttackAbility(owner) {
	  Ability.call(this, owner);
	};

	QuickAttackAbility.prototype = Object.create(Ability.prototype);
	QuickAttackAbility.prototype.constructor = Ability;

	QuickAttackAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var wt = 0;
	  var ct = this.parameters.cooldownTime;
	  var effect = new AttackDelayEffect(this.owner, elapsedTime, Infinity, wt, ct);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * IaiAbility
	 */
	this.IaiAbility = function IaiAbility(owner) {
	  Ability.call(this, owner);
	};

	IaiAbility.prototype = Object.create(Ability.prototype);
	IaiAbility.prototype.constructor = Ability;

	IaiAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var wt = 0;
	  var ct = this.parameters.cooldownTime;
	  var effect = new AttackDelayEffect(this.owner, elapsedTime, Infinity, wt, ct);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * QuickChantAbility
	 */
	this.QuickChantAbility = function QuickChantAbility(owner) {
	  Ability.call(this, owner);
	};

	QuickChantAbility.prototype = Object.create(Ability.prototype);
	QuickChantAbility.prototype.constructor = Ability;

	QuickChantAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var wt = 0;
	  var ct = this.parameters.cooldownTime;
	  var effect = new AttackDelayEffect(this.owner, elapsedTime, Infinity, wt, ct);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * QuickDrawAbility
	 */
	this.QuickDrawAbility = function QuickDrawAbility(owner) {
	  Ability.call(this, owner);
	};

	QuickDrawAbility.prototype = Object.create(Ability.prototype);
	QuickDrawAbility.prototype.constructor = Ability;

	QuickDrawAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var wt = 0;
	  var ct = this.parameters.cooldownTime;
	  var effect = new AttackDelayEffect(this.owner, elapsedTime, Infinity, wt, ct);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * TeamStrengthBoostAbility
	 */
	this.TeamStrengthBoostAbility = function TeamStrengthBoostAbility(owner) {
	  Ability.call(this, owner);
	};

	TeamStrengthBoostAbility.prototype = Object.create(Ability.prototype);
	TeamStrengthBoostAbility.prototype.constructor = Ability;

	TeamStrengthBoostAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var multiplier = this.parameters.strength;
	  var self = this.owner;
	  var stage = this.owner.stage;
	  var toall = stage.condition.abilityToAll;
	  stage.units.forEach(function (unit) {
	    if (unit.group == 1 && (toall || unit == self)) {
	      var effect = new EnforceStrengthEffect(unit, elapsedTime, Infinity, multiplier);
	      unit.addEffect(effect, elapsedTime);
	    }
	  });
	};

	/**
	 * TeamDefenceBoostAbility
	 */
	this.TeamDefenceBoostAbility = function TeamDefenceBoostAbility(owner) {
	  Ability.call(this, owner);
	};

	TeamDefenceBoostAbility.prototype = Object.create(Ability.prototype);
	TeamDefenceBoostAbility.prototype.constructor = Ability;

	TeamDefenceBoostAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var multiplier = this.parameters.defence;
	  var self = this.owner;
	  var stage = this.owner.stage;
	  var toall = stage.condition.abilityToAll;
	  stage.units.forEach(function (unit) {
	    if (unit.group == 1 && (toall || unit == self)) {
	      var effect = new EnforceDefenceEffect(unit, elapsedTime, Infinity, multiplier);
	      unit.addEffect(effect, elapsedTime);
	    }
	  });
	};

	/**
	 * ClassifiedStrengthBoostAbility
	 */
	this.ClassifiedStrengthBoostAbility = function ClassifiedStrengthBoostAbility(owner) {
	  Ability.call(this, owner);
	};

	ClassifiedStrengthBoostAbility.prototype = Object.create(Ability.prototype);
	ClassifiedStrengthBoostAbility.prototype.constructor = Ability;

	ClassifiedStrengthBoostAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var multiplier = this.parameters.strength;
	  var classes = this.parameters.classes;
	  var self = this.owner;
	  var stage = this.owner.stage;
	  var toall = stage.condition.abilityToAll;
	  stage.units.forEach(function (unit) {
	    var intarget = unit.group && (toall || unit == self);
	    var matched = classes.some(function (id) {
	      return unit.class && id == unit.class.id;
	    });
	    if (intarget && matched) {
	      var effect = new EnforceStrengthEffect(unit, elapsedTime, Infinity, multiplier);
	      unit.addEffect(effect, elapsedTime);
	    }
	  });
	};

	/**
	 * ClassifiedDefenceBoostAbility
	 */
	this.ClassifiedDefenceBoostAbility = function ClassifiedDefenceBoostAbility(owner) {
	  Ability.call(this, owner);
	};

	ClassifiedDefenceBoostAbility.prototype = Object.create(Ability.prototype);
	ClassifiedDefenceBoostAbility.prototype.constructor = Ability;

	ClassifiedDefenceBoostAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var multiplier = this.parameters.defence;
	  var classes = this.parameters.classes;
	  var self = this.owner;
	  var stage = this.owner.stage;
	  var toall = stage.condition.abilityToAll;
	  stage.units.forEach(function (unit) {
	    var intarget = unit.group && (toall || unit == self);
	    var matched = classes.some(function (id) {
	      return unit.class && id == unit.class.id;
	    });
	    if (intarget && matched) {
	      var effect = new EnforceDefenceEffect(unit, elapsedTime, Infinity, multiplier);
	      unit.addEffect(effect, elapsedTime);
	    }
	  });
	};

	/**
	 * SnipeAbility
	 */
	this.SnipeAbility = function SnipeAbility(owner) {
	  Ability.call(this, owner);
	};

	SnipeAbility.prototype = Object.create(Ability.prototype);
	SnipeAbility.prototype.constructor = Ability;

	SnipeAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var wt = 0;
	  var ct = this.parameters.cooldownTime;
	  var effect = new AttackDelayEffect(this.owner, elapsedTime, Infinity, wt, ct);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * WhiteMagicAbility
	 */
	this.WhiteMagicAbility = function WhiteMagicAbility(owner) {
	  Ability.call(this, owner);
	};

	WhiteMagicAbility.prototype = Object.create(Ability.prototype);
	WhiteMagicAbility.prototype.constructor = Ability;

	WhiteMagicAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var wt = 0;
	  var ct = this.parameters.cooldownTime;
	  var effect = new AttackDelayEffect(this.owner, elapsedTime, Infinity, wt, ct);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * BlackMagicAbility
	 */
	this.BlackMagicAbility = function BlackMagicAbility(owner) {
	  Ability.call(this, owner);
	};

	BlackMagicAbility.prototype = Object.create(Ability.prototype);
	BlackMagicAbility.prototype.constructor = Ability;

	BlackMagicAbility.prototype.start = function (elapsedTime) {
	  this.__proto__.__proto__.start.call(this, elapsedTime);

	  var wt = 0;
	  var ct = this.parameters.cooldownTime;
	  var effect = new AttackDelayEffect(this.owner, elapsedTime, Infinity, wt, ct);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * QuickHealingPrayerSkill
	 */
	this.QuickHealingPrayerSkill = function QuickHealingPrayerSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	QuickHealingPrayerSkill.prototype = Object.create(Skill.prototype);
	QuickHealingPrayerSkill.prototype.constructor = Skill;

	QuickHealingPrayerSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var duration = this.getDuration();
	  var effect = new SwitchHealerEffect(this.owner, elapsedTime, duration);
	  this.owner.addEffect(effect, elapsedTime);

	  var cc = this.getAttackCooldownCorrection();
	  effect = new AttackDelayEffect(this.owner, elapsedTime, duration, 1, cc);
	  this.owner.addEffect(effect, elapsedTime);
	};

	QuickHealingPrayerSkill.prototype.getAttackCooldownCorrection = function () {
	  return this.param.attackCooldownBase + this.param.attackCooldownRate * (this.level - 1);
	};

	/**
	 * RecoveryCostSkill
	 */
	this.RecoveryCostSkill = function RecoveryCostSkill(owner, level, parameters) {
	  Skill.call(this, owner, level, parameters);
	};

	RecoveryCostSkill.prototype = Object.create(Skill.prototype);
	RecoveryCostSkill.prototype.constructor = Skill;

	RecoveryCostSkill.prototype.execute = function (elapsedTime) {
	  Skill.prototype.execute.call(this, elapsedTime);

	  var effect = new RecoveryCostEffect(this.owner, elapsedTime, 0, this.param.point);
	  this.owner.addEffect(effect, elapsedTime);
	};

	/**
	 * RecoveryCostEffect
	 */
	this.RecoveryCostEffect = function RecoveryCostEffect(owner, startTime, duration, point) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '出撃コスト回復';
	  this.point = point;
	};

	RecoveryCostEffect.prototype = Object.create(Effect.prototype, {});
	RecoveryCostEffect.prototype.constructor = Effect;

	RecoveryCostEffect.prototype.update = function (elapsedTime) {
	  Effect.prototype.update.call(this, elapsedTime);
	  if (this.expired) {
	    return;
	  }

	  this.owner.stage.addCost(this.point, this.owner, elapsedTime);
	  this.expired = true;
	};

	RecoveryCostEffect.prototype.dump = function () {
	  return 'コスト回復量:' + this.point;
	};

	/**
	 * DestroyedCostBonusEffect
	 */
	this.DestroyedCostBonusEffect = function DestroyedCostBonusEffect(owner, startTime, duration, point) {
	  Effect.call(this, owner, startTime, duration);

	  this.name = '撃破時コスト回復';
	  this.point = point;

	  owner.callbacks.destroyed = function (target, elapsedTime) {
	    this.stage.addCost(point, owner, elapsedTime);
	  };
	};

	DestroyedCostBonusEffect.prototype = Object.create(Effect.prototype, {});
	DestroyedCostBonusEffect.prototype.constructor = Effect;

	DestroyedCostBonusEffect.prototype.dump = function () {
	  return 'コスト回復量:' + this.point;
	};

	/**
	 * Database
	 */
	this.Database = function Database(url) {
	  this.url = url;
	}

	Database.prototype = Object.create(Object.prototype);
	Database.prototype.constructor = Object;

	Database.prototype.buildQueryUrl = function (table) {
	  return this.url + '?sheet=' + encodeURIComponent(table);
	};

	Database.prototype.query = function (table, onSuccess, onError) {
	  var url = this.buildQueryUrl(table);
	  var query = new google.visualization.Query(url);
	  query.send(function (response) {
	    var result;
	    try {
	      result = Database.handleQueryResponse(response);
	    } catch (e) {
	      onError(e);
	    }
	    onSuccess(result);
	  });
	};

	Database.handleQueryResponse = function (response) {
	  if (response.isError()) {
	    throw new Error(response.getMessage() + ' ' + response.getDetailedMessage());
	  }

	  var table = response.getDataTable();

	  var columns = [];
	  for (var i = 0; i < table.getNumberOfColumns(); i++) {
	    columns[i] = table.getColumnLabel(i);
	  }
	  var idcolumn = columns[0];

	  var rows = {};
	  for (i = 0; i < table.getNumberOfRows(); i++) {
	    var row = {};
	    for (var j = 0; j < columns.length; j++) {
	      row[columns[j]] = table.getValue(i, j);
	    }
	    var id = row[idcolumn];
	    if (id) {
	      rows[id] = row;
	    }
	  }

	  return rows;
	};
	}.call(window));

/***/ },

/***/ 16:
/***/ function(module, exports, __webpack_require__) {

	// shim for using process in browser

	var process = module.exports = {};

	process.nextTick = (function () {
	    var canSetImmediate = typeof window !== 'undefined'
	    && window.setImmediate;
	    var canMutationObserver = typeof window !== 'undefined'
	    && window.MutationObserver;
	    var canPost = typeof window !== 'undefined'
	    && window.postMessage && window.addEventListener
	    ;

	    if (canSetImmediate) {
	        return function (f) { return window.setImmediate(f) };
	    }

	    var queue = [];

	    if (canMutationObserver) {
	        var hiddenDiv = document.createElement("div");
	        var observer = new MutationObserver(function () {
	            var queueList = queue.slice();
	            queue.length = 0;
	            queueList.forEach(function (fn) {
	                fn();
	            });
	        });

	        observer.observe(hiddenDiv, { attributes: true });

	        return function nextTick(fn) {
	            if (!queue.length) {
	                hiddenDiv.setAttribute('yes', 'no');
	            }
	            queue.push(fn);
	        };
	    }

	    if (canPost) {
	        window.addEventListener('message', function (ev) {
	            var source = ev.source;
	            if ((source === window || source === null) && ev.data === 'process-tick') {
	                ev.stopPropagation();
	                if (queue.length > 0) {
	                    var fn = queue.shift();
	                    fn();
	                }
	            }
	        }, true);

	        return function nextTick(fn) {
	            queue.push(fn);
	            window.postMessage('process-tick', '*');
	        };
	    }

	    return function nextTick(fn) {
	        setTimeout(fn, 0);
	    };
	})();

	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	// TODO(shtylman)
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};


/***/ },

/***/ 29:
/***/ function(module, exports, __webpack_require__) {

	function formatTime(time, scale) {
	  scale = scale === undefined ? 2 : scale;
	  time = (time === Infinity || time === -Infinity) ? '∞' : (time / 1000).toFixed(scale);
	  return time + '秒';
	}

	module.exports = formatTime;


/***/ }

});