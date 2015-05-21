(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x2,
    property = _x3,
    receiver = _x4; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _tapeJs = require('./tape.js');

var _tapeJs2 = _interopRequireDefault(_tapeJs);

var _transitionFunctionJs = require('./transition-function.js');

var _transitionFunctionJs2 = _interopRequireDefault(_transitionFunctionJs);

var _events = require('events');

Object.defineProperty(exports, 'LEFT', {
	enumerable: true,
	get: function get() {
		return _transitionFunctionJs.LEFT;
	}
});
Object.defineProperty(exports, 'RIGHT', {
	enumerable: true,
	get: function get() {
		return _transitionFunctionJs.RIGHT;
	}
});

var TuringMachine = (function (_EventEmitter) {
	function TuringMachine(initState, haltState) {
		_classCallCheck(this, TuringMachine);

		_get(Object.getPrototypeOf(TuringMachine.prototype), 'constructor', this).call(this);

		this.initState = initState;
		this.haltState = haltState;

		this.init();
	}

	_inherits(TuringMachine, _EventEmitter);

	_createClass(TuringMachine, [{
		key: 'init',
		value: function init() {
			// machine components getting ready
			this.tape = new _tapeJs2['default']();
			this.transitionFunction = new _transitionFunctionJs2['default']();

			// machine getting initialized
			this.headPosition = 0;
			this.currentState = this.initState;
			this.running = false;
		}
	}, {
		key: 'addRule',
		value: function addRule(state, readSymbol, newState, writtenSymbol, direction) {
			this.transitionFunction.addRule(state, readSymbol, newState, writtenSymbol, direction);
			this.emit('ruleAdded', [state, readSymbol, newState, writtenSymbol, direction]);
		}
	}, {
		key: 'step',
		value: function step() {
			if (this.running) {
				if (!this.computationEnded()) {
					var readSymbol = this.tape.read(this.headPosition);
					try {
						var _transition = this.transition(readSymbol);

						var state = _transition.state;
						var symbol = _transition.symbol;
						var direction = _transition.direction;

						this.currentState = state;
						this.write(symbol);
						this.emit('step', { writtenSymbol: symbol, headPosition: this.headPosition, state: state });

						this.moveHead(direction);
					} catch (e) {
						this.stop();
						this.emit('error', e);
					}
				} else {
					this.stop();
					this.emit('halt', this.tape);
				}
			}
		}
	}, {
		key: 'run',
		value: function run() {
			var _this2 = this;

			var transitionTime = arguments[0] === undefined ? 100 : arguments[0];

			this.running = true;
			this.interval_id = setInterval(function () {
				if (_this2.running) {
					_this2.step();
				} else {
					clearInterval(_this2.interval_id);
				}
			}, transitionTime);
		}
	}, {
		key: 'stop',
		value: function stop() {
			this.running = false;
		}
	}, {
		key: 'transition',
		value: function transition(readSymbol) {
			return this.transitionFunction.transition(this.currentState, readSymbol);
		}
	}, {
		key: 'moveHead',
		value: function moveHead(direction) {
			if (direction == _transitionFunctionJs.LEFT) {
				this.headPosition -= 1;
			} else {
				this.headPosition += 1;
			}
		}
	}, {
		key: 'reset',
		value: function reset() {
			this.init();
		}
	}, {
		key: 'write',
		value: function write(symbol) {
			this.tape.write(this.headPosition, symbol);
		}
	}, {
		key: 'computationEnded',
		value: function computationEnded() {
			return this.currentState == this.haltState;
		}
	}, {
		key: 'surroundingData',
		value: function surroundingData(size) {
			return this.tape.readBulk(this.headPosition - size, this.headPosition + size);
		}
	}]);

	return TuringMachine;
})(_events.EventEmitter);

exports['default'] = TuringMachine;

},{"./tape.js":3,"./transition-function.js":4,"events":1}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Tape = (function () {
	function Tape() {
		_classCallCheck(this, Tape);

		this.initTape();
	}

	_createClass(Tape, [{
		key: "initTape",
		value: function initTape() {
			this.minimumIndexWritten = 0;
			this.maximumIndexWritten = 0;
			this.data = {};
		}
	}, {
		key: "read",
		value: function read(i) {
			if (this.data[i]) {
				return this.data[i];
			} else {
				return 0; // the default symbol
			}
		}
	}, {
		key: "readBulk",
		value: function readBulk(i, j) {
			var _this = this;

			var result = {}; // This will allow negative indexes
			range(i, j).forEach(function (k) {
				result[k] = _this.read(k);
			});

			return result;
		}
	}, {
		key: "write",
		value: function write(i, symbol) {
			this.minimumIndexWritten = Math.min(this.minimumIndexWritten, i);
			this.maximumIndexWritten = Math.max(this.maximumIndexWritten, i);

			this.data[i] = symbol;
		}
	}, {
		key: "reset",
		value: function reset() {
			this.initTape();
		}
	}, {
		key: "accesedTape",
		value: function accesedTape() {
			return this.readBulk(this.minimumIndexWritten, this.maximumIndexWritten);
		}
	}]);

	return Tape;
})();

exports["default"] = Tape;

function range(i, j) {
	var result = [];

	for (var k = i; k < j; k++) {
		result.push(k);
	}

	return result;
}
module.exports = exports["default"];

},{}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x,
    property = _x2,
    receiver = _x3; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var LEFT = -1,
    RIGHT = 1;

exports.LEFT = LEFT;
exports.RIGHT = RIGHT;

var RuleNotFoundException = (function (_Error) {
	function RuleNotFoundException(condition) {
		_classCallCheck(this, RuleNotFoundException);

		_get(Object.getPrototypeOf(RuleNotFoundException.prototype), "constructor", this).call(this);
		this.error = "Rule was not found";
		this.condition = condition;
	}

	_inherits(RuleNotFoundException, _Error);

	return RuleNotFoundException;
})(Error);

exports.RuleNotFoundException = RuleNotFoundException;

var TransitionFunction = (function () {
	function TransitionFunction() {
		_classCallCheck(this, TransitionFunction);

		this.init();
	}

	_createClass(TransitionFunction, [{
		key: "init",
		value: function init() {
			this.transitionTable = {};
		}
	}, {
		key: "addRule",
		value: function addRule(state, read_symbol, new_state, written_symbol, direction) {
			if (!(state in this.transitionTable)) {
				this.transitionTable[state] = {};
			}

			this.transitionTable[state][read_symbol] = {
				state: new_state,
				symbol: written_symbol,
				direction: direction
			};
		}
	}, {
		key: "transition",
		value: function transition(state, readSymbol) {
			var transitionTable = this.transitionTable;
			if (state in transitionTable && transitionTable[state]) {
				var stateRules = this.transitionTable[state];
				if (readSymbol in stateRules) {
					return this.transitionTable[state][readSymbol];
				}
			}

			throw new RuleNotFoundException([state, readSymbol]);
		}
	}, {
		key: "reset",
		value: function reset() {
			this.init();
		}
	}]);

	return TransitionFunction;
})();

exports["default"] = TransitionFunction;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x,
    property = _x2,
    receiver = _x3; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

exports.parseRule = parseRule;
exports["default"] = parse;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _machine = require("../machine");

var _machine2 = _interopRequireDefault(_machine);

var SyntaxError = (function (_Error) {
	function SyntaxError(message, line) {
		_classCallCheck(this, SyntaxError);

		_get(Object.getPrototypeOf(SyntaxError.prototype), "constructor", this).call(this);
		this.message = message;
		this.line = line;
	}

	_inherits(SyntaxError, _Error);

	return SyntaxError;
})(Error);

exports.SyntaxError = SyntaxError;

function parseRule(line) {
	var _extractRuleParts = extractRuleParts(line);

	var _extractRuleParts2 = _slicedToArray(_extractRuleParts, 2);

	var condition = _extractRuleParts2[0];
	var transition = _extractRuleParts2[1];

	var _extractCondition = extractCondition(condition);

	var _extractCondition2 = _slicedToArray(_extractCondition, 2);

	var originState = _extractCondition2[0];
	var readSymbol = _extractCondition2[1];

	var _extractTransition = extractTransition(transition);

	var _extractTransition2 = _slicedToArray(_extractTransition, 3);

	var nextState = _extractTransition2[0];
	var symbolToWrite = _extractTransition2[1];
	var direction = _extractTransition2[2];

	return [originState, readSymbol, nextState, symbolToWrite, direction];
}

function parse(code) {
	var machine = new _machine2["default"]("Q0", "HALT");
	var rules = getRulesFromCode(code);

	rules.forEach(function (rule) {
		var machine_rule = parseRule(rule);
		machine.addRule.apply(machine, _toConsumableArray(machine_rule));
	});

	return machine;
}

function getRulesFromCode(code) {
	code = code.split("\t").join(" "); // Replace tabs with spaces
	code = stripComments(code);

	var lines = code.split("\n");
	return lines.filter(notEmpty);
}

function stripComments(code) {
	var lines = code.split("\n");
	var result_lines = [];

	lines.forEach(function (line) {
		result_lines.push(line.split("#")[0]);
	});

	return result_lines.join("\n");
}

function notEmpty(line) {
	var parts = line.split(" ");
	var notEmptyParts = parts.filter(function (part) {
		return part.length !== 0;
	});
	return notEmptyParts.length > 0;
}

function extractRuleParts(rule) {
	var ruleParts = rule.split("=>");

	if (ruleParts.length !== 2) {
		throw new SyntaxError("Instruction error: " + rule, rule);
	}

	return ruleParts;
}

function extractCondition(conditionPart) {
	var conditionParts = conditionPart.split(" ").filter(notEmpty);

	if (conditionParts.length !== 2) {
		throw new SyntaxError("Rule Condition Error", line);
	}

	return conditionParts;
}

function extractTransition(transitionPart) {
	var transitionParts = transitionPart.split(" ").filter(notEmpty);

	if (transitionParts.length !== 3) {
		throw new SyntaxError("Rule transition Error", transitionPart);
	}

	transitionParts[2] = extractDirection(transitionParts[2]);

	return transitionParts;
}

function extractDirection(direction) {
	if (direction === "LEFT") {
		return _machine.LEFT;
	} else if (direction === "RIGHT") {
		return _machine.RIGHT;
	}

	throw new SyntaxError("Rule direction error", direction);
}

},{"../machine":2}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _machine = require('./machine');

var _machine2 = _interopRequireDefault(_machine);

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

exports.Machine = _machine2['default'];
exports.RIGHT = _machine.RIGHT;
exports.LEFT = _machine.LEFT;
exports.parse = _parser2['default'];

},{"./machine":2,"./parser":5}]},{},[6]);
