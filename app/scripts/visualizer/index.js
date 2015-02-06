/* globals google */

// 'use strict';

require('jquery');
require('jquery-ui');
require('bootstrap-touchspin');
require('select2');

require('imports?this=>window!./lib/klasses');

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
        .sortable({
        })
        .disableSelection();
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
    if (true || unit.base.editable) {
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
