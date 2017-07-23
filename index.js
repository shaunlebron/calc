var state = {
  // Pressing a number or decimal will append the entry
  entry: '',

  // Entry is not displayed until number is entered or cleared.
  displayEntry: true,

  // Stack of values (top-most is shown if displayEntry is false)
  values: [],

  // Stack operation characters `+` `*` `-` `/`
  ops: [],

  // Allows us to press `=` to repeat the last operation
  lastArg: null,
  lastOp: null,
};

//----------------------------------------------------------------------
// Display
//----------------------------------------------------------------------

// Entry has no display string until it is explicitly shown.
function getEntryDisplay() {
  if (state.displayEntry) {
    return state.entry === '' ? '0' : state.entry;
  }
  return null;
}

// Entry's value is either float or null if not shown.
function getEntryValue() {
  var s = getEntryDisplay();
  return s !== null ? parseFloat(s) : null;
}

// Render the simple display
function getDisplay() {
  return getEntryDisplay() || peekValue(0);
}

// Render the full display of the current expression
function getFullDisplay() {
  var vals = state.values.slice();
  var ops = state.ops.slice();
  var result = '';
  var i,v,o;
  for (i=0; i<Math.max(vals.length, ops.length); i++) {
    if (i < vals.length) { result += vals[i]; }
    if (i < ops.length) { result += ops[i]; }
  }
  v = getEntryDisplay();
  if (v !== null) {
    result += v;
  }
  return result;
}

// Render the last op (e.g. "+3") if it can be repeated by pressing "=".
function getRepeatDisplay() {
  if (state.values.length <= 1 && state.ops.length === 0 &&
      state.lastOp !== null && state.lastArg !== null) {
    return state.lastOp + state.lastArg;
  }
  return '';
}

function refreshDisplays() {
  document.getElementById('display').innerHTML = getDisplay();
  document.getElementById('full-display').innerHTML = getFullDisplay();
  document.getElementById('repeat-display').innerHTML = getRepeatDisplay();
}

//----------------------------------------------------------------------
// Helpers
//----------------------------------------------------------------------

// Operator precedence
var opPrecedence = {
  '+': 0,
  '-': 0,
  '*': 1,
  '/': 1,
};

// Operator functions
var opFuncs = {
  '+': (x,y) => x+y,
  '-': (x,y) => x-y,
  '*': (x,y) => x*y,
  '/': (x,y) => x/y,
};


function pushArg(value) {
  state.values.push(value);
  state.lastArg = value;
  state.displayEntry = false;
  state.entry = '';
}

function peekValue(i) {
  return state.values[state.values.length-1-i];
}

function peekOp(i) {
  return state.ops[state.ops.length-1-i];
}

// Evaluate as much of the expression as allowed by the given precedence value.
// '0' = all
// '1' = multiply or divide only
function compute(precedence) {
  var i = 0;
  while (state.ops.length > 0) {
    var op = peekOp(0);
    if (opPrecedence[op] < precedence) {
      break;
    }
    state.ops.pop();
    var b = state.values.pop();
    var a = state.values.pop();
    var result = opFuncs[op](a,b);
    state.values.push(result);
    if (i === 0) {
      state.lastArg = b;
      state.lastOp = op;
    }
    i++;
  }
}

//----------------------------------------------------------------------
// Button functions
//----------------------------------------------------------------------

// CE was pressed
function clearEntry() {
  state.entry = '';
  state.displayEntry = true;
}

// C was pressed
function clear() {
  clearEntry();
  state.values = [];
  state.ops = [];
  state.lastArg = null;
  state.lastOp = null;
}

// A number was pressed
function onNumber(d) {
  if (state.entry === '' && state.ops.length === 0) {
    state.values = [];
  }
  state.displayEntry = true;
  state.entry += d;
}

// Decimal point was pressed
function onDecimal() {
  state.displayEntry = true;
  if (state.entry === '') {
    state.entry = '0';
  }
  if (!state.entry.includes('.')) {
    state.entry += '.';
  }
}

// '%' was pressed
function onPercent() {
  var value = getEntryValue();
  if (value === null) {
    // If there is no entry, the top value is used as the percent
  } else {
    pushArg(value);
  }
  if (state.values.length > 0) {
    var percent = state.values.pop();
    var value = peekValue(0);
    if (value === undefined) {
      // if there is no second value on the stack, we assume we are taking a percentage from 1.
      value = 1;
    }
    var result = percent / 100 * value;
    pushArg(result);
  }
}

// Either of '+', '-', '*', or '/' were pressed
function onOperation(op) {
  var value = getEntryValue();
  if (value === null) {
    // Replace current op
    state.ops.pop();
  } else {
    pushArg(value);
  }
  compute(opPrecedence[op]);
  state.ops.push(op);
}

// '=' was pressed
function onEqual() {
  // Ensure one op is available.
  if (state.ops.length === 0 && state.lastOp) {
    state.ops.push(state.lastOp);
  }
  if (state.ops.length === 0) {
    return;
  }

  // Ensure two args are available.
  var value = getEntryValue();
  if (value !== null) {
    // If there are no values on the stack, we want to push our entry value
    // then the lastArg value, while not overwriting the lastArg value.
    // Allows us to type `4+3=` then type `123=` to see 126 (mac calc behavior)
    if (state.values.length === 0 && state.lastArg !== null) {
      state.values.push(value);
    } else {
      pushArg(value);
    }
  }
  if (state.values.length === 1 && state.lastArg !== null) {
    pushArg(state.lastArg);
  }
  if (state.values.length < 2) {
    return;
  }

  compute(0);
}

// Functions for each button id
var buttonFunctions = {
  num0: () => onNumber(0),
  num1: () => onNumber(1),
  num2: () => onNumber(2),
  num3: () => onNumber(3),
  num4: () => onNumber(4),
  num5: () => onNumber(5),
  num6: () => onNumber(6),
  num7: () => onNumber(7),
  num8: () => onNumber(8),
  num9: () => onNumber(9),
  decimal: () => onDecimal(),
  add: () => onOperation('+'),
  subtract: () => onOperation('-'),
  multiply: () => onOperation('*'),
  divide: () => onOperation('/'),
  percent: () => onPercent(),
  equal: () => onEqual(),
  clear: () => clear(),
  'clear-entry': () => clearEntry(),
};

function onClick() {
  buttonFunctions[this.id]();
  refreshDisplays();
  console.log(JSON.stringify(state, null, 2));
}

//----------------------------------------------------------------------
// Main
//----------------------------------------------------------------------

function init() {
  var buttons = document.querySelectorAll("#calc button");
  var i, name;
  for (i=0; i<buttons.length; i++) {
    buttons[i].addEventListener('click', onClick);
  }
  refreshDisplays();
}

window.addEventListener('load', function() {
  init();
});
