const all = (arr, fn = Boolean) => arr.every(fn);

all([4, 2, 3], (x) => x > 1); // true
all([1, 2, 3]); // true

const allEqual = (arr) => arr.every((val) => val === arr[0]);

allEqual([1, 2, 3, 4, 5, 6]); // false
allEqual([1, 1, 1, 1]); // true

const approximatelyEqual = (v1, v2, epsilon = 0.001) =>
  Math.abs(v1 - v2) < epsilon;

approximatelyEqual(Math.PI / 2.0, 1.5708); // true

const arrayToCSV = (arr, delimiter = ",") =>
  arr.map((v) => v.map((x) => `"${x}"`).join(delimiter)).join("\n");

arrayToCSV([
  ["a", "b"],
  ["c", "d"],
]); // '"a","b"\n"c","d"'
arrayToCSV(
  [
    ["a", "b"],
    ["c", "d"],
  ],
  ";"
); // '"a";"b"\n"c";"d"'

// const arrayToHtmlList = (arr, listID) =>
//   ((el) => (
//     (el = document.querySelector("#" + listID)),
//     (el.innerHTML += arr.map((item) => `<li>${item}</li>`).join(""))
//   ))();

// arrayToHtmlList(["item 1", "item 2"], "myListID");

const average = (...nums) =>
  nums.reduce((acc, val) => acc + val, 0) / nums.length;
average(...[1, 2, 3]); // 2
average(1, 2, 3); // 2

const averageBy = (arr, fn) =>
  arr
    .map(typeof fn === "function" ? fn : (val) => val[fn])
    .reduce((acc, val) => acc + val, 0) / arr.length;

averageBy([{ n: 4 }, { n: 2 }, { n: 8 }, { n: 6 }], (o) => o.n); // 5
averageBy([{ n: 4 }, { n: 2 }, { n: 8 }, { n: 6 }], "n"); // 5

const bifurcate = (arr, filter) =>
  arr.reduce((acc, val, i) => (acc[filter[i] ? 0 : 1].push(val), acc), [
    [],
    [],
  ]);
bifurcate(["beep", "boop", "foo", "bar"], [true, true, false, true]);
// [ ['beep', 'boop', 'bar'], ['foo'] ]

const castArray = (val) => (Array.isArray(val) ? val : [val]);

castArray("foo"); // ['foo']
castArray([1]); // [1]
castArray(1); // [1]

const compact = (arr) => arr.filter(Boolean);

compact([0, 1, false, 2, "", 3, "a", "e" * 23, NaN, "s", 34]);
// [ 1, 2, 3, 'a', 's', 34 ]

const countOccurrences = (arr, val) =>
  arr.reduce((a, v) => (v === val ? a + 1 : a), 0);
countOccurrences([1, 1, 2, 1, 2, 3], 1); // 3

const deepFlatten = (arr) =>
  [].concat(...arr.map((v) => (Array.isArray(v) ? deepFlatten(v) : v)));

deepFlatten([1, [2], [[3], 4], 5]); // [1,2,3,4,5]

const difference = (a, b) => {
  const s = new Set(b);
  return a.filter((x) => !s.has(x));
};

difference([1, 2, 3], [1, 2, 4]); // [3]

const differenceBy = (a, b, fn) => {
  const s = new Set(b.map(fn));
  return a.filter((x) => !s.has(fn(x)));
};

differenceBy([2.1, 1.2], [2.3, 3.4], Math.floor); // [1.2]
differenceBy([{ x: 2 }, { x: 1 }], [{ x: 1 }], (v) => v.x); // [ { x: 2 } ]

const dropWhile = (arr, func) => {
  while (arr.length > 0 && !func(arr[0])) arr = arr.slice(1);
  return arr;
};

dropWhile([1, 2, 3, 4], (n) => n >= 3); // [3,4]

const flatten = (arr, depth = 1) =>
  arr.reduce(
    (a, v) =>
      a.concat(depth > 1 && Array.isArray(v) ? flatten(v, depth - 1) : v),
    []
  );

flatten([1, [2], 3, 4]); // [1, 2, 3, 4]
flatten([1, [2, [3, [4, 5], 6], 7], 8], 2); // [1, 2, 3, [4, 5], 6, 7, 8]

const indexOfAll = (arr, val) =>
  arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);

indexOfAll([1, 2, 3, 1, 2, 3], 1); // [0,3]
indexOfAll([1, 2, 3], 4); // []

const intersection = (a, b) => {
  const s = new Set(b);
  return a.filter((x) => s.has(x));
};

intersection([1, 2, 3], [4, 3, 2]); // [2, 3]

const intersectionBy = (a, b, fn) => {
  const s = new Set(b.map(fn));
  return a.filter((x) => s.has(fn(x)));
};

intersectionBy([2.1, 1.2], [2.3, 3.4], Math.floor); // [2.1]

const intersectionWith = (a, b, comp) =>
  a.filter((x) => b.findIndex((y) => comp(x, y)) !== -1);

intersectionWith(
  [1, 1.2, 1.5, 3, 0],
  [1.9, 3, 0, 3.9],
  (a, b) => Math.round(a) === Math.round(b)
); // [1.5, 3, 0]

const minN = (arr, n = 1) => [...arr].sort((a, b) => a - b).slice(0, n);

minN([1, 2, 3]); // [1]
minN([1, 2, 3], 2); // [1,2]

const negate = (func) => (...args) => !func(...args);

[1, 2, 3, 4, 5, 6].filter(negate((n) => n % 2 === 0)); // [ 1, 3, 5 ]

const randomIntArrayInRange = (min, max, n = 1) =>
  Array.from(
    { length: n },
    () => Math.floor(Math.random() * (max - min + 1)) + min
  );

randomIntArrayInRange(12, 35, 10); // [ 34, 14, 27, 17, 30, 27, 20, 26, 21, 14 ]

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

sample([3, 7, 9, 11]); // 9

const sampleSize = ([...arr], n = 1) => {
  let m = arr.length;
  while (m) {
    const i = Math.floor(Math.random() * m--);
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr.slice(0, n);
};

sampleSize([1, 2, 3], 2); // [3,1]
sampleSize([1, 2, 3], 4); // [2,3,1]

const shuffle = ([...arr]) => {
  let m = arr.length;
  while (m) {
    const i = Math.floor(Math.random() * m--);
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr;
};

const foo = [1, 2, 3];
shuffle(foo); // [2, 3, 1], foo = [1, 2, 3]

const nest = (items, id = null, link = "parent_id") =>
  items
    .filter((item) => item[link] === id)
    .map((item) => ({ ...item, children: nest(items, item.id) }));

const comments = [
  { id: 1, parent_id: null },
  { id: 2, parent_id: 1 },
  { id: 3, parent_id: 1 },
  { id: 4, parent_id: 2 },
  { id: 5, parent_id: 4 },
];
const nestedComments = nest(comments); // [{ id: 1, parent_id: null, children: [...] }]
console.log(JSON.stringify(nestedComments));

const attempt = (fn, ...args) => {
  try {
    return fn(...args);
  } catch (e) {
    return e instanceof Error ? e : new Error(e);
  }
};
var elements = attempt(function (selector) {
  return document.querySelectorAll(selector);
}, ">_>");
if (elements instanceof Error) elements = []; // elements = []

const defer = (fn, ...args) => setTimeout(fn, 1, ...args);

defer(console.log, "a"), console.log("b"); // logs 'b' then 'a'

const runPromisesInSeries = (ps) =>
  ps.reduce((p, next) => p.then(next), Promise.resolve());
const delay = (d) => new Promise((r) => setTimeout(r, d));

runPromisesInSeries([() => delay(1000), () => delay(2000)]);

const timeTaken = (callback) => {
  console.time("timeTaken");
  const r = callback();
  console.timeEnd("timeTaken");
  return r;
};

timeTaken(() => Math.pow(2, 10)); // 1024, (logged): timeTaken: 0.02099609375ms

const createEventHub = () => ({
  hub: Object.create(null),
  emit(event, data) {
    (this.hub[event] || []).forEach((handler) => handler(data));
  },
  on(event, handler) {
    if (!this.hub[event]) this.hub[event] = [];
    this.hub[event].push(handler);
  },
  off(event, handler) {
    const i = (this.hub[event] || []).findIndex((h) => h === handler);
    if (i > -1) this.hub[event].splice(i, 1);
    if (this.hub[event].length === 0) delete this.hub[event];
  },
});

const handler = (data) => console.log(data);
const hub = createEventHub();
let increment = 0;

hub.on("message", handler);
hub.on("message", () => console.log("Message event fired"));
hub.on("increment", () => increment++);

hub.emit("message", "hello world"); // 打印 'hello world' 和 'Message event fired'
hub.emit("message", { hello: "world" }); // 打印 对象 和 'Message event fired'
hub.emit("increment"); // increment = 1

hub.off("message", handler);

const memoize = (fn) => {
  const cache = new Map();
  const cached = function (val) {
    return cache.has(val)
      ? cache.get(val)
      : cache.set(val, fn.call(this, val)) && cache.get(val);
  };
  cached.cache = cache;
  return cached;
};

// export function cached<F: Function>(fn: F): F {
//   const cache = Object.create(null);
//   return (function cachedFn(str: string) {
//     const hit = cache[str];
//     return hit || (cache[str] = fn(str));
//   }: any);
// }

const once = (fn) => {
  let called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  };
};

// const startApp = function (event) {
//   console.log(this, event); // document.body, MouseEvent
// };
// document.body.addEventListener("click", once(startApp)); // 只执行一次startApp

const flattenObject = (obj, prefix = "") =>
  Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + "." : "";
    if (typeof obj[k] === "object")
      Object.assign(acc, flattenObject(obj[k], pre + k));
    else acc[pre + k] = obj[k];
    return acc;
  }, {});

flattenObject({ a: { b: { c: 1 } }, d: 1 }); // { 'a.b.c': 1, d: 1 }

const unflattenObject = (obj) =>
  Object.keys(obj).reduce((acc, k) => {
    if (k.indexOf(".") !== -1) {
      const keys = k.split(".");
      Object.assign(
        acc,
        JSON.parse(
          "{" +
            keys
              .map((v, i) => (i !== keys.length - 1 ? `"${v}":{` : `"${v}":`))
              .join("") +
            obj[k] +
            "}".repeat(keys.length)
        )
      );
    } else acc[k] = obj[k];
    return acc;
  }, {});

unflattenObject({ "a.b.c": 1, d: 1 }); // { a: { b: { c: 1 } }, d: 1 }

const capitalize = ([first, ...rest]) => first.toUpperCase() + rest.join("");

capitalize("fooBar"); // 'FooBar'
capitalize("fooBar", true); // 'Foobar'

const capitalizeEveryWord = (str) =>
  str.replace(/\b[a-z]/g, (char) => char.toUpperCase());

capitalizeEveryWord("hello world!"); // 'Hello World!'

const decapitalize = ([first, ...rest]) => first.toLowerCase() + rest.join("");

decapitalize("FooBar"); // 'fooBar'
decapitalize("FooBar"); // 'fooBar'

const luhnCheck = (num) => {
  let arr = (num + "")
    .split("")
    .reverse()
    .map((x) => parseInt(x));
  let lastDigit = arr.splice(0, 1)[0];
  let sum = arr.reduce(
    (acc, val, i) => (i % 2 !== 0 ? acc + val : acc + ((val * 2) % 9) || 9),
    0
  );
  sum += lastDigit;
  return sum % 10 === 0;
};

luhnCheck("4485275742308327"); // true
luhnCheck(6011329933655299); //  false
luhnCheck(123456789); // false

const splitLines = (str) => str.split(/\r?\n/);

splitLines("This\nis a\nmultiline\nstring.\n"); // ['This', 'is a', 'multiline', 'string.' , '']

const stripHTMLTags = (str) => str.replace(/<[^>]*>/g, "");

stripHTMLTags("<p><em>lorem</em> <strong>ipsum</strong></p>"); // 'lorem ipsum'

const dayOfYear = (date) =>
  Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

dayOfYear(new Date()); // 285

const forOwn = (obj, fn) =>
  Object.keys(obj).forEach((key) => fn(obj[key], key, obj));
forOwn({ foo: "bar", a: 1 }, (v) => console.log(v)); // 'bar', 1

const getColonTimeFromDate = (date) => date.toTimeString().slice(0, 8);

getColonTimeFromDate(new Date()); // "08:38:00"

const getDaysDiffBetweenDates = (dateInitial, dateFinal) =>
  (dateFinal - dateInitial) / (1000 * 3600 * 24);

getDaysDiffBetweenDates(new Date("2019-01-01"), new Date("2019-10-14")); // 286

const is = (type, val) => ![, null].includes(val) && val.constructor === type;

is(Array, [1]); // true
is(ArrayBuffer, new ArrayBuffer()); // true
is(Map, new Map()); // true
is(RegExp, /./g); // true
is(Set, new Set()); // true
is(WeakMap, new WeakMap()); // true
is(WeakSet, new WeakSet()); // true
is(String, ""); // true
is(String, new String("")); // true
is(Number, 1); // true
is(Number, new Number(1)); // true
is(Boolean, true); // true
is(Boolean, new Boolean(true)); // true

const isAfterDate = (dateA, dateB) => dateA > dateB;

isAfterDate(new Date(2010, 10, 21), new Date(2010, 10, 20)); // true

const isBeforeDate = (dateA, dateB) => dateA < dateB;

isBeforeDate(new Date(2010, 10, 20), new Date(2010, 10, 21)); // true

const tomorrow = () => {
  let t = new Date();
  t.setDate(t.getDate() + 1);
  return t.toISOString().split("T")[0];
};

tomorrow(); // 2019-10-15 (如果明天是2019-10-15)

const equals = (a, b) => {
  if (a === b) return true;
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (!a || !b || (typeof a !== "object" && typeof b !== "object"))
    return a === b;
  if (a.prototype !== b.prototype) return false;
  let keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => equals(a[k], b[k]));
};

equals(
  { a: [2, { e: 3 }], b: [4], c: "foo" },
  { a: [2, { e: 3 }], b: [4], c: "foo" }
); // true

const randomIntegerInRange = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

randomIntegerInRange(0, 5); // 3

const randomNumberInRange = (min, max) => Math.random() * (max - min) + min;

randomNumberInRange(2, 10); // 6.0211363285087005

const round = (n, decimals = 0) =>
  Number(`${Math.round(`${n}e${decimals}`)}e-${decimals}`);

round(1.005, 2); // 1.01

const sum = (...arr) => [...arr].reduce((acc, val) => acc + val, 0);

sum(1, 2, 3, 4); // 10
sum(...[1, 2, 3, 4]); // 10

const toCurrency = (n, curr, LanguageFormat = undefined) =>
  Intl.NumberFormat(LanguageFormat, {
    style: "currency",
    currency: curr,
  }).format(n);

toCurrency(123456.789, "EUR"); // €123,456.79
toCurrency(123456.789, "USD", "en-us"); // $123,456.79
toCurrency(123456.789, "USD", "fa"); // ۱۲۳٬۴۵۶٫۷۹
toCurrency(322342436423.2435, "JPY"); // ¥322,342,436,423

// const bottomVisible = () =>
//   document.documentElement.clientHeight + window.scrollY >=
//   (document.documentElement.scrollHeight ||
//     document.documentElement.clientHeight);

// bottomVisible(); // true

const fs = require("fs");
const createDirIfNotExists = (dir) =>
  !fs.existsSync(dir) ? fs.mkdirSync(dir) : undefined;
createDirIfNotExists("test");

const distance = (x0, y0, x1, y1) => Math.hypot(x1 - x0, y1 - y0);

distance(1, 1, 2, 3); // 2.23606797749979

const getType = (v) =>
  v === undefined
    ? "undefined"
    : v === null
    ? "null"
    : v.constructor.name.toLowerCase();

getType(new Set([1, 2, 3])); // 'set'
getType([1, 2, 3]); // 'array'

const isBrowser = () => ![typeof window, typeof document].includes("undefined");

isBrowser(); // true (browser)
isBrowser(); // false (Node)

const randomHexColorCode = () => {
  let n = (Math.random() * 0xfffff * 1000000).toString(16);
  return "#" + n.slice(0, 6);
};

randomHexColorCode(); // "#e34155"

const escapeHTML = (str) =>
  str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      }[tag] || tag)
  );

escapeHTML('<a href="#">Me & you</a>'); // '&lt;a href=&quot;#&quot;&gt;Me &amp; you&lt;/a&gt;'
