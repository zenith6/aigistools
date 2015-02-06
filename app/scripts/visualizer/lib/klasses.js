// 'use strict';

var formatTime = require('./formatTime');

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
