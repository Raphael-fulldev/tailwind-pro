const isMedia = (val) => /^@/.test(val);
const isPseudo = (val) => /&/.test(val);

function sortRule(a, b) {
  if (isMedia(a) && isPseudo(b)) return 1;
  if (isPseudo(a) && isMedia(b)) return -1;
  if (isMedia(a) && isMedia(b)) return 0;
  if (isPseudo(a) && isPseudo(b)) return 0;

  if (isMedia(a) && !isPseudo(b)) return -1;
  if (isPseudo(a) && !isMedia(b)) return 1;
  if (!isPseudo(a) && isMedia(b)) return -1;
  if (!isMedia(a) && !isPseudo(b)) return 1;

  if (!isMedia(a) && !isPseudo(b)) return 0;
  if (!isPseudo(a) && !isMedia(b)) return 0;
  return 0;
}

const pseudo = [
  "link",
  "visited",
  "empty",
  "first-child",
  "last-child",
  "odd-child",
  "even-child",
  "hover",
  "focus-within",
  "focus",
  "focus-visible",
  "active",
  "disabled",
];

const sortPseudo = (a, b) => {
  const idxA = pseudo.findIndex((p) => a.includes(p));
  const idxB = pseudo.findIndex((p) => b.includes(p));
  return idxA - idxB;
};

// adapted from styletron - https://raw.githubusercontent.com/styletron/styletron/c157e2a3a2592d639ae665342b2c0be8774e916b/packages/styletron-engine-atomic/src/sort-css-media-queries.js

const minMaxWidth = /(!?\(\s*min(-device-)?-width).+\(\s*max(-device)?-width/i;
const minWidth = /\(\s*min(-device)?-width/i;
const maxMinWidth = /(!?\(\s*max(-device)?-width).+\(\s*min(-device)?-width/i;
const maxWidth = /\(\s*max(-device)?-width/i;

const isMinWidth = _testQuery(minMaxWidth, maxMinWidth, minWidth);
const isMaxWidth = _testQuery(maxMinWidth, minMaxWidth, maxWidth);

const minMaxHeight = /(!?\(\s*min(-device)?-height).+\(\s*max(-device)?-height/i;
const minHeight = /\(\s*min(-device)?-height/i;
const maxMinHeight = /(!?\(\s*max(-device)?-height).+\(\s*min(-device)?-height/i;
const maxHeight = /\(\s*max(-device)?-height/i;

const isMinHeight = _testQuery(minMaxHeight, maxMinHeight, minHeight);
const isMaxHeight = _testQuery(maxMinHeight, minMaxHeight, maxHeight);

const isPrint = /print/i;
const isPrintOnly = /^print$/i;
const maxValue = Number.MAX_VALUE;

function _getQueryLength(length) {
  const matches = /(-?\d*\.?\d+)(ch|em|ex|px|rem)/.exec(length);
  if (matches === null) {
    return maxValue;
  }
  let number = matches[1];
  const unit = matches[2];
  switch (unit) {
    case "ch":
      number = parseFloat(number) * 8.8984375;
      break;
    case "em":
    case "rem":
      number = parseFloat(number) * 16;
      break;
    case "ex":
      number = parseFloat(number) * 8.296875;
      break;
    case "px":
      number = parseFloat(number);
      break;
  }
  return +number;
}

function _testQuery(doubleTestTrue, doubleTestFalse, singleTest) {
  return function (query) {
    if (doubleTestTrue.test(query)) {
      return true;
    } else if (doubleTestFalse.test(query)) {
      return false;
    }
    return singleTest.test(query);
  };
}

function _testIsPrint(a, b) {
  const isPrintA = isPrint.test(a);
  const isPrintOnlyA = isPrintOnly.test(a);
  const isPrintB = isPrint.test(b);
  const isPrintOnlyB = isPrintOnly.test(b);

  if (isPrintA && isPrintB) {
    if (!isPrintOnlyA && isPrintOnlyB) {
      return 1;
    }
    if (isPrintOnlyA && !isPrintOnlyB) {
      return -1;
    }
    return a.localeCompare(b);
  }
  if (isPrintA) {
    return 1;
  }
  if (isPrintB) {
    return -1;
  }
  return null;
}

function sortCSSmq(a, b) {
  if (a === "") {
    return -1;
  }
  if (b === "") {
    return 1;
  }
  const testIsPrint = _testIsPrint(a, b);
  if (testIsPrint !== null) {
    return testIsPrint;
  }

  const minA = isMinWidth(a) || isMinHeight(a);
  const maxA = isMaxWidth(a) || isMaxHeight(a);
  const minB = isMinWidth(b) || isMinHeight(b);
  const maxB = isMaxWidth(b) || isMaxHeight(b);

  if (minA && maxB) {
    return -1;
  }
  if (maxA && minB) {
    return 1;
  }

  const lengthA = _getQueryLength(a);
  const lengthB = _getQueryLength(b);

  if (lengthA === maxValue && lengthB === maxValue) {
    return a.localeCompare(b);
  } else if (lengthA === maxValue) {
    return 1;
  } else if (lengthB === maxValue) {
    return -1;
  }

  if (lengthA > lengthB) {
    if (maxA) {
      return -1;
    }
    return 1;
  }

  if (lengthA < lengthB) {
    if (maxA) {
      return 1;
    }
    return -1;
  }

  return a.localeCompare(b);
}

// TODO: memorize sort function
export default function (styles) {
  return styles.sort(sortCSSmq).sort(sortPseudo).sort(sortRule);
}
