const NUMBERS = require("./js-numbers.js");
const EQUALITY = require("./equality.js");

module.exports = {
  'raw-array': {
    'make': function(arr) {
      return arr;
    }
  },
  'raw-array-length': function(arr) {
    return arr.length;
  },
  'raw-array-set': function( arr, index, value ) {
    arr[index] = value;
    return arr;
  },
  'raw-array-get': function( arr, index ) {
    return arr[index];
  },
  'raw-array-push': function( arr, elm ) {
    arr.push( elm );
    return arr;
  },
  'raw-array-map': function(fun, arr) {
    return arr.map(fun);
  },
  'raw-array-for-each': function(fun, arr) {
    return arr.forEach(fun);
  },
  'raw-array-fold': function( fun, val, arr ) {
    return arr.reduce( fun, val );
  },
  'raw-array-foldr': function( fun, val, arr ) {
    return arr.reduceRight( fun, val );
  },
  'raw-array-sum': function( arr ) {
    return arr.reduce(function( x, y) {
      return NUMBERS["add"](x, y);
    }, 0);
  },
  'raw-array-min': function( arr ) {
    if (arr.length == 0) {
      throw new Error("Invalid array length: 0");
    }

    return arr.reduce(function(x, y) {
      if (EQUALITY["_lessthan"](x, y)) {
        return x;
      } else {
        return y;
      }
    }, arr[0]);
  },
  'raw-array-max': function( arr ) {
    if (arr.length == 0) {
      throw new Error("Invalid array length: 0");
    }

    return arr.reduce(function(x, y) {
      if (EQUALITY["_greaterthan"](x, y)) {
        return x;
      } else {
        return y;
      }
    }, arr[0]);
  },
  'raw-array-of': function(elem, n) {
    if (EQUALITY["_lessthan"](n, 0)) {
      throw "raw-array-of: <0 repititions";
    }

    const jsN = NUMBERS["toFixnum"](n);

    return new Array(jsN).fill(elem);
  },
  'raw-array-build': function(f, n) {

    if (EQUALITY["_lessthan"](n, 0)) {
      throw "raw-array-build: <0";
    }

    const jsN = NUMBERS["toFixnum"](n);
    let array = new Array(jsN);
    for (let i = 0; i < jsN; i++) {
      array[i] = f(i);
    }

    return array;
  },
  'is-raw-array': function(v) {
    // TODO(alex): may need to move this to primitives.ts
    return Array.isArray(v);
  }
}
