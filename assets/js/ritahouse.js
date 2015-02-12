webpackJsonp([0],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {'use strict';

	function Node() {
	}

	Node.prototype = Object.create(Object.prototype);
	Node.prototype.constructor = Object;

	Node.prototype.createDom = function createDom(container) {
	};

	function House() {
	  this.field = [];
	  this.nodes = [];
	}

	House.prototype = Object.create(Node.prototype);
	House.prototype.constructor = Node;

	House.prototype.createDom = function createDom(document) {
	  var div = document.createElement('div');
	  return div;
	};

	function Player() {

	}

	Player.prototype = Object.create(Node.prototype);
	Player.ptototype.constructor = Node;

	function Cell(id) {
	  this.id = id;
	}

	Cell.prototype = Object.create(Node.prototype);
	Cell.prototype.constructor = Node;

	var house = new House();

	var field = [
	  [1, 1, 1, 1, 1],
	  [1, 0, 0, 0, 1],
	  [1, 0, 0, 0, 1],
	  [1, 0, 0, 0, 1],
	  [1, 1, 1, 1, 1],
	];

	house.field = field.map(function (row) {
	  return row.map(function (col) {
	    return new Cell(col);
	  });
	});

	function render() {

	}

	console.log(house);

	render();

	$(function () {
	  render();
	});
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(6)))

/***/ }
]);