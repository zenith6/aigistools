/* global Promise:on */

'use strict';

var followRedirects = require('follow-redirects');
var fs              = require('fs');
var url             = require('url');
var path            = require('path');
var cheerio         = require('cheerio-httpcli');

function getBonusPropertyName(text) {
  return {
    'HP': 'bonusHealth',
    '攻撃力': 'bonusStrength',
    '防御力': 'bonusDefence',
  }[text];
}

function parseUnitWiki($) {
  var isForwardUnit = $('h2').text() !== '遠距離型';

  var units = $('tbody').has('tr > td > a > img').map(function () {
    var unit = {
      name: null,
      icon: null,
      specs: [],
    };

    var $tbody = $(this);
    var $rows = $tbody.find('tr');
    var isPrince = $rows.length === 3;
    var canAwakening = $rows.length === 6;
    var canClassChange = $rows.length === 4 || canAwakening;

    /*
     *  ユニット名とアイコンの URL
     */
    var $row0 = $rows.eq(0);
    var $icon = $row0.find('td').eq(0).find('a > img');
    unit.name = $icon.attr('title');
    unit.icon = $icon.attr('src');

    /*
     * 未CC
     */
    var $row1 = $rows.eq(1);

    var block;
    var minRange;
    var maxRange;
    var values = $row0.find('td').eq(8).contents().filter(function () {
        return this.nodeType === 3;
      })
      .map(function () {
        return parseInt(this.nodeValue);
      })
      .get();

    if (isForwardUnit) {
      block = values[0];
      minRange = 30;
      maxRange = 30;

      if (values.length == 2) {
        maxRange = values[1];
      }
    } else {
      block = 0;
      minRange = values[0];
      maxRange = values[0];
    }

    var cc0spec = {
      class: $row0.find('td').eq(2).text(),
      minLevel: parseInt($row0.find('td').eq(3).text().replace(/^Lv/, '')),
      minHealth: parseInt($row0.find('td').eq(4).text()),
      minStrength: parseInt($row0.find('td').eq(5).text()),
      minDeffence: parseInt($row0.find('td').eq(6).text()),
      resistance: parseInt($row0.find('td').eq(7).text()),
      block: block,
      minRange: minRange,
      maxRange: maxRange,
      maxCost: parseInt($row0.find('td').eq(9).text()),
      minCost: parseInt($row0.find('td').eq(10).text()),
      maxLevel: parseInt($row1.find('td').eq(0).text().replace(/^Lv/, '')),
      maxHealth: parseInt($row1.find('td').eq(1).text()),
      maxStrength: parseInt($row1.find('td').eq(2).text()),
      maxDeffence: parseInt($row1.find('td').eq(3).text()),
      bonusHealth: 0,
      bonusStrength: 0,
      bonusDefence: 0,
      skill: null,
      ability: null,
    };

    if (isPrince) {
      cc0spec.ability = '士気高揚';
    }

    /*
     * 最少好感度ボーナス
     */
    $row0.find('td').eq(11)
      .contents()
      .filter(function () {
        return this.nodeType === 3;
      })
      .map(function () {
        var tokens = this.nodeValue.split('+');

        if (tokens.length === 2) {
          cc0spec[getBonusPropertyName(tokens[0])] = parseInt(tokens[1]);
        }
      });

    unit.specs.push(cc0spec);

    /*
     * 未CCスキル
     */
    var $skills = $row0.find('td').eq(12).find('a');
    if ($skills.length == 1) {
      cc0spec.skill = $skills.eq(0).text();
    } else if ($skills.length == 2) {
      cc0spec.skill = $skills.eq(0).text();
      cc0spec.ability = $skills.eq(1).text();
    }

    /*
     * CC
     */
    if (canClassChange) {
      var $row2 = $rows.eq(2);
      var $row3 = $rows.eq(3);

      values = $row2.find('td').eq(6).contents().filter(function () {
          return this.nodeType === 3;
        })
        .map(function () {
          return parseInt(this.nodeValue);
        })
        .get();

      if (isForwardUnit) {
        block = values[0];
        minRange = 30;
        maxRange = 30;

        if (values.length == 2) {
          maxRange = values[1];
        }
      } else {
        block = 0;
        minRange = values[0];
        maxRange = values[0];
      }

      var cc1spec = {
        class: $row2.find('td').eq(0).text(),
        minLevel: parseInt($row2.find('td').eq(1).text().replace(/^Lv/, '')),
        minHealth: parseInt($row2.find('td').eq(2).text()),
        minStrength: parseInt($row2.find('td').eq(3).text()),
        minDeffence: parseInt($row2.find('td').eq(4).text()),
        resistance: parseInt($row2.find('td').eq(5).text()),
        block: block,
        minRange: minRange,
        maxRange: maxRange,
        maxCost: parseInt($row2.find('td').eq(7).text()),
        minCost: parseInt($row2.find('td').eq(8).text()),
        maxLevel: parseInt($row3.find('td').eq(0).text().replace(/^Lv/, '')),
        maxHealth: parseInt($row3.find('td').eq(1).text()),
        maxStrength: parseInt($row3.find('td').eq(2).text()),
        maxDeffence: parseInt($row3.find('td').eq(3).text()),
        bonusHealth: 0,
        bonusStrength: 0,
        bonusDefence: 0,
        skill: cc0spec.skill,
        ability: cc0spec.ability,
      };

      // 最大好感度ボーナス
      $row2.find('td').eq(9)
        .contents()
        .filter(function () {
          return this.nodeType === 3;
        })
        .each(function () {
          var tokens = this.nodeValue.split('+');

          if (tokens.length === 2) {
            cc1spec[getBonusPropertyName(tokens[0])] = parseInt(tokens[1]);
          }
        });

      // 覚醒スキル & アビリティ
      $skills = $row2.find('td').eq(10).find('a');
      if ($skills.length == 1) {
        cc1spec.skill = $skills.eq(0).text();
      } else if ($skills.length == 2) {
        cc1spec.skill = $skills.eq(0).text();
        cc1spec.ability = $skills.eq(1).text();
      }

      unit.specs.push(cc1spec);

      /*
       * 覚醒
       */
      if (canAwakening) {
        var $row4 = $rows.eq(4);
        var $row5 = $rows.eq(5);

        values = $row4.find('td').eq(6).contents().filter(function () {
            return this.nodeType === 3;
          })
          .map(function () {
            return parseInt(this.nodeValue);
          })
          .get();

        if (isForwardUnit) {
          block = values[0];
          minRange = 30;
          maxRange = 30;

          if (values.length == 2) {
            maxRange = values[1];
          }
        } else {
          block = 0;
          minRange = values[0];
          maxRange = values[0];
        }

        var cc2spec = {
          class: $row4.find('td').eq(0).text(),
          minLevel: parseInt($row4.find('td').eq(1).text().replace(/^Lv/, '')),
          minHealth: parseInt($row4.find('td').eq(2).text()),
          minStrength: parseInt($row4.find('td').eq(3).text()),
          minDeffence: parseInt($row4.find('td').eq(4).text()),
          resistance: parseInt($row4.find('td').eq(5).text()),
          block: block,
          minRange: minRange,
          maxRange: maxRange,
          maxCost: parseInt($row4.find('td').eq(7).text()),
          minCost: parseInt($row4.find('td').eq(8).text()),
          maxLevel: parseInt($row5.find('td').eq(0).text().replace(/^Lv/, '')),
          maxHealth: parseInt($row5.find('td').eq(1).text()),
          maxStrength: parseInt($row5.find('td').eq(2).text()),
          maxDeffence: parseInt($row5.find('td').eq(3).text()),
          bonusHealth: cc1spec.bonusHealth,
          bonusStrength: cc1spec.bonusStrength,
          bonusDefence: cc1spec.bonusDefence,
          skill: cc1spec.skill,
          ability: cc1spec.ability,
        };

        // 覚醒スキル & アビリティ
        $skills = $row4.find('td').eq(10).find('a');
        if ($skills.length == 1) {
          cc2spec.ability = $skills.eq(0).text();
        } else if ($skills.length == 2) {
          cc2spec.skill = $skills.eq(0).text();
          cc2spec.ability = $skills.eq(1).text();
        }

        unit.specs.push(cc2spec);
      }
    }

    return unit;
  }).get();

  return units;
}

function downloadIcons(units, callback) {
  var download = function (callback) {
    if (units.length === 0) {
      if (callback) {
        callback();
      }
      return;
    }

    var unit = units.pop();
    var options = url.parse(unit.url);
    var content = '';
    var dest = path.join('./units', unit.name + (path.extname(options.pathname.toLowerCase()) || '.png'));
    var protocol = options.protocol == 'https:' ? followRedirects.https : followRedirects.http;

    if (fs.existsSync(dest)) {
      console.log('Skip: ' + unit.name);
      download();
      return;
    }

    console.log('Download: ' + unit.name, dest, options);

    var req = protocol.get(options, function(res) {
      if (res.statusCode !== 200) {
        throw new Error('' + unit.url + ' return ' + res.statusCode);
      }

      res.setEncoding('binary');

      res.on('data', function (chunk) {
        content += chunk;
      });

      res.on('end', function () {
        fs.writeFile(dest, content, 'binary', function (err) {
          if (err) {
            throw err;
          }
        });

        download();
      });
    });

    req.on('error', function(err) {
      if (err.code == 'HPE_INVALID_CONSTANT') {
        return;
      }

      throw err;
    });
  };

  download(callback);
}

function parseSkillWiki($) {
  var skills = [];

  $('table').each(function () {
    var $table = $(this);
    var label = $table.find('thead th:nth-child(1)').text();

    if (label === 'スキル') {
      var $rows = $table.find('tbody tr');
      var $cols = $rows.eq(0).find('td');
      var xOffset = $cols.length >= 5 ? 1 : null;
      var yOffset = $cols.length >= 6 ? 2 : null;
      var zOffset = $cols.length >= 7 ? 3 : null;
      var cOffset = $cols.length - 3;
      var text, actual;

      var skill = {
        name: $cols.eq(0).text(),
        description: $cols.eq(1).text(),
        levels: [],
      };

      for (var i = 0; i < $rows.length; i++) {
        var baseOffset = i === 0 ? 2 : 0;
        $cols = $rows.eq(i).find('td');

        var level = {
          level: parseInt($cols.eq(baseOffset).text()),
          cooldown: parseFloat($cols.eq(baseOffset + cOffset).text()),
        };

        if (xOffset !== null) {
          text = $cols.eq(baseOffset + xOffset).text();
          actual = (text.match(/[\d\.]+/g) || []).pop();
          level.x = parseFloat(actual);
        }

        if (yOffset !== null) {
          text = $cols.eq(baseOffset + yOffset).text();
          actual = (text.match(/[\d\.]+/g) || []).pop();
          level.y = parseFloat(actual);
        }

        if (zOffset !== null) {
          text = $cols.eq(baseOffset + zOffset).text();
          actual = (text.match(/[\d\.]+/g) || []).pop();
          level.z = parseFloat(actual);
        }

        skill.levels.push(level);
      }

      skills.push(skill);
    }
  });

  return skills;
}

function parseAbilityWiki($) {
  var others = [
    {
      name: '士気高揚',
      description: null,
      note: null,
    },
  ];

  var abilities = $('#wrapMain table')
      .filter(function () {
        return $(this).find('thead th:nth-child(1)').text() === '覚醒アビリティー';
      })
      .map(function () {
        var $table = $(this);
        return $table.find('tbody tr')
          .filter(function () {
            return $(this).find('td').length === 4;
          })
          .map(function () {
            var $cols = $(this).find('td');

            return {
              name: $cols.eq(0).text(),
              description: $cols.eq(1).text(),
              note: $cols.eq(3).text(),
            };
          })
          .toArray();
      })
      .toArray()
      .reduce(function (all, part) {
        return all.concat(part);
      }, [])
      .concat(others);

  return abilities;
}

function scrape(source) {
  return new Promise(function (resolve, reject) {
      cheerio.fetch(source.url, function (err, $) {
        if (err) {
          reject(err);
          return;
        }

        source.content = $;

        resolve(source);
      });
    });
}

function parse(source) {
  return new Promise(function (resolve) {
      source.data = source.parser(source.content);

      resolve(source);
    });
}

function unionTable(sources) {
  return sources.reduce(function (db, source) {
      db[source.table] = (db[source.table] || []).concat(source.data);

      return db;
    }, {});
}

function normalize(sources) {
  var tables = unionTable(sources);

  if (tables.skills) {
    var skillMap = {};
    tables.skills.forEach(function (skill, i) {
      skill.id = i + 1;
      skillMap[skill.name] = skill.id;
    });
  }

  if (tables.abilities) {
    var abilityMap = {};
    tables.abilities.forEach(function (ability, i) {
      ability.id = i + 1;
      abilityMap[ability.name] = ability.id;
    });
  }

  if (tables.units) {
    tables.units.forEach(function (unit) {
      unit.specs.forEach(function (spec) {
        spec.skill = spec.skill in skillMap ? skillMap[spec.skill] : null;
        spec.ability = spec.ability in abilityMap ? abilityMap[spec.ability] : null;
      });
    });
  }

  return tables;
}

function save(name, table) {
  return new Promise(function (reject, resolve) {
      var filename = path.join(__dirname, '../app/resources/db', name + '.json');
      var content = JSON.stringify(table, null, 2);
      fs.writeFile(filename, content, function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
}

var sources = [
  {
    table: 'units',
    url: 'http://aigis.gcwiki.info/?%B6%E1%C0%DC%B7%BF',
    parser: parseUnitWiki,
  },
  {
    table: 'units',
    url: 'http://aigis.gcwiki.info/?%B1%F3%B5%F7%CE%A5%B7%BF',
    parser: parseUnitWiki,
  },
  {
    table: 'units',
    url: 'http://aigis.gcwiki.info/?%A4%BD%A4%CE%C2%BE',
    parser: parseUnitWiki,
  },
  {
    table: 'skills',
    url: 'http://aigis.gcwiki.info/?%A5%B9%A5%AD%A5%EB',
    parser: parseSkillWiki,
  },
  {
    table: 'abilities',
    url: 'http://aigis.gcwiki.info/?%B3%D0%C0%C3%A5%A2%A5%D3%A5%EA%A5%C6%A5%A3%A1%BC',
    parser: parseAbilityWiki,
  },
];

Promise.all(sources.map(function (source) {
    return scrape(source);
  }))
  .then(function (sources) {
    return Promise.all(sources.map(function (source) {
      return parse(source);
    }));
  })
  .then(function (sources) {
    return normalize(sources);
  })
  .then(function (tables) {
    return Promise.all(Object.keys(tables).map(function (name) {
      return save(name, tables[name]);
    }));
  })
  .catch(function (err) {
    console.error(err.stack);
  });
