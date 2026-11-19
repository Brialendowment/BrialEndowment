// Pillar icons: one library of line icons (64 x 64 grid, thin stroke, no fill) in the same
// hand as the original pillar drawings. The founder picks one per pillar in the Founder
// Portal (pillar → pencil → Icon); the choice is kept in PILLAR-STATUS (data.icons) and
// shown on the homepage card, the pillar chooser and the portal sidebar.
// Each icon is a list of SVG path strings; a filled dot is written as "dot:cx,cy,r".
(function () {
  "use strict";
  var c = function (cx, cy, r) { return "M" + (cx - r) + " " + cy + " a" + r + " " + r + " 0 1 0 " + 2 * r + " 0 a" + r + " " + r + " 0 1 0 " + -2 * r + " 0"; };
  var GROUPS = [
    ["faith", "Faith"], ["learning", "Learning"], ["nature", "Nature & land"], ["water", "Water"], ["food", "Food"],
    ["care", "Care & health"], ["people", "People"], ["build", "Building"], ["travel", "Travel"], ["trade", "Trade & money"], ["symbol", "Symbols"]
  ];
  var L = [
    // Faith
    ["mosque", "faith", "Mosque", ["M14 54 H50", "M18 54 V34 H46 V54", "M22 34 Q22 22 32 18 Q42 22 42 34", "M32 18 V12", "M30 12 Q32 9 34 12", "M28 54 V44 Q32 40 36 44 V54", "M10 54 V26 M8 26 H12 M10 26 V20", "M54 54 V26 M52 26 H56 M54 26 V20"]],
    ["dome", "faith", "Dome and arch", ["M12 54 H52", "M16 54 V30 H48 V54", "M18 30 Q18 14 32 10 Q46 14 46 30", "M32 10 V5", "M26 54 V42 Q32 34 38 42 V54"]],
    ["minaret", "faith", "Minaret", ["M26 56 H38", "M28 56 V24 H36 V56", "M26 24 H38", "M27 24 Q27 16 32 13 Q37 16 37 24", "M32 13 V8", "M30 34 H34 M30 42 H34"]],
    ["crescent", "faith", "Crescent and star", ["M40 12 A20 20 0 1 0 50 44 A16 16 0 1 1 40 12 Z", "M48 18 L49.5 22 L53.5 22 L50.3 24.4 L51.5 28.4 L48 26 L44.5 28.4 L45.7 24.4 L42.5 22 L46.5 22 Z"]],
    ["lantern", "faith", "Lantern", ["M32 6 V12", "M26 12 H38", "M24 18 L26 12 H38 L40 18", "M22 18 H42 L40 46 H24 Z", "M32 22 V42", "M26 30 Q32 26 38 30", "M24 46 L26 52 H38 L40 46", "M30 56 H34"]],
    ["prayer", "faith", "Open hands", ["M20 50 Q14 40 16 28 Q17 24 20 25 L22 38", "M44 50 Q50 40 48 28 Q47 24 44 25 L42 38", "M22 38 Q26 30 30 32 L30 46", "M42 38 Q38 30 34 32 L34 46", "M18 50 H46"]],
    ["candle", "faith", "Candle", ["M26 56 H38", "M27 56 V26 H37 V56", "M32 26 V21", "M32 21 Q27 15 32 8 Q37 15 32 21 Z"]],
    // Learning
    ["cap", "learning", "Graduation cap", ["M8 26 L32 16 L56 26 L32 36 Z", "M18 30 V42 Q32 50 46 42 V30", "M56 26 V40", "dot:56,42,1.6"]],
    ["book", "learning", "Open book", ["M32 18 V52", "M32 18 Q22 12 10 14 V48 Q22 46 32 52", "M32 18 Q42 12 54 14 V48 Q42 46 32 52"]],
    ["books", "learning", "Stack of books", ["M12 50 H52 V56 H12 Z", "M15 42 H49 V50 H15 Z", "M18 34 H46 V42 H18 Z", "M22 42 V50 M42 34 V42"]],
    ["quill", "learning", "Quill", ["M48 8 Q30 14 22 40 L18 52", "M48 8 Q50 26 30 40", "M24 36 L34 30", "M14 56 H30"]],
    ["pencil", "learning", "Pencil", ["M14 50 L18 38 L44 12 L52 20 L26 46 Z", "M40 16 L48 24", "M14 50 L26 46", "M18 38 L26 46"]],
    ["school", "learning", "School", ["M10 54 H54", "M14 54 V30 L32 18 L50 30 V54", "M28 54 V42 H36 V54", "M32 18 V8 L40 11 L32 14", "dot:32,30,3"]],
    ["lamp", "learning", "Lamp of knowledge", ["M10 40 Q12 32 24 32 H44 L54 26 L50 36 Q44 42 30 42 Q16 42 10 40 Z", "M24 32 Q24 26 30 26", "M30 18 Q26 12 30 6 Q34 12 30 18 Z", "M26 48 H38"]],
    ["globe", "learning", "Globe", [c(32, 32, 20), "M12 32 H52", "M32 12 Q22 32 32 52", "M32 12 Q42 32 32 52", "M16 22 H48 M16 42 H48"]],
    // Nature & land
    ["sprout", "nature", "Sprout", ["M32 52 L32 24", "M32 30 Q20 26 16 16 Q28 16 32 28", "M32 34 Q44 30 48 20 Q36 20 32 32", "M14 52 Q32 44 50 52"]],
    ["tree", "nature", "Tree", ["M32 56 V36", "M32 44 L24 38 M32 40 L40 34", c(32, 24, 14), "M22 56 H42"]],
    ["olive", "nature", "Olive branch", ["M14 52 Q30 38 50 12", "M22 44 Q16 38 20 32 Q26 38 22 44 Z", "M30 36 Q24 28 30 22 Q34 30 30 36 Z", "M38 26 Q36 18 42 14 Q44 22 38 26 Z", "M28 42 Q36 42 38 48 Q30 48 28 42 Z", "M36 32 Q44 30 48 36 Q40 38 36 32 Z"]],
    ["leaf", "nature", "Leaf", ["M14 50 Q14 18 50 14 Q50 48 14 50 Z", "M14 50 L40 24", "M24 40 H34 M30 34 V44"]],
    ["mountain", "nature", "Mountains", ["M6 52 L24 22 L36 40 L44 30 L58 52 Z", "M20 29 L24 22 L29 30", "M48 18 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0"]],
    ["sun", "nature", "Sun", [c(32, 32, 10), "M32 8 V14 M32 50 V56 M8 32 H14 M50 32 H56 M15 15 L19 19 M45 45 L49 49 M49 15 L45 19 M19 45 L15 49"]],
    ["field", "nature", "Field and rows", ["M6 50 H58", "M10 50 L22 30 M22 50 L28 30 M34 50 L34 30 M46 50 L40 30 M58 50 L46 30", "M18 22 Q32 14 46 22", "dot:32,12,3"]],
    ["seed", "nature", "Seed in soil", ["M8 40 H56", "M12 48 H52", "M32 40 Q24 32 32 22 Q40 32 32 40 Z", "M32 22 Q34 14 42 12"]],
    // Water
    ["drop", "water", "Water drop", ["M32 8 Q14 32 16 40 A16 16 0 0 0 48 40 Q50 32 32 8 Z", "M24 40 Q24 46 30 48"]],
    ["well", "water", "Well", ["M14 54 H50", "M16 54 V38 H48 V54", "M14 38 H50", "M20 38 V16 M44 38 V16", "M16 16 H48 L32 8 Z", "M32 16 V26", "M28 26 H36 V32 H28 Z"]],
    ["waves", "water", "Waves", ["M8 24 Q14 18 20 24 T32 24 T44 24 T56 24", "M8 34 Q14 28 20 34 T32 34 T44 34 T56 34", "M8 44 Q14 38 20 44 T32 44 T44 44 T56 44"]],
    ["tap", "water", "Tap", ["M10 22 H34 Q44 22 44 32 V36", "M10 16 V28", "M22 22 V16 M18 16 H26", "M44 42 Q40 48 44 52 Q48 48 44 42 Z"]],
    ["river", "water", "River", ["M24 6 Q14 20 26 30 Q38 40 26 58", "M40 6 Q30 20 42 30 Q54 40 42 58"]],
    // Food
    ["bowl", "food", "Bowl of food", ["M10 34 H54 Q52 50 32 52 Q12 50 10 34 Z", "M24 58 H40", "M24 26 Q22 20 26 16 M32 26 Q30 18 34 12 M40 26 Q38 20 42 16"]],
    ["wheat", "food", "Wheat", ["M32 56 V14", "M32 20 Q24 18 24 10 Q32 12 32 20", "M32 20 Q40 18 40 10 Q32 12 32 20", "M32 30 Q24 28 24 20 Q32 22 32 30", "M32 30 Q40 28 40 20 Q32 22 32 30", "M32 40 Q24 38 24 30 Q32 32 32 40", "M32 40 Q40 38 40 30 Q32 32 32 40"]],
    ["sack", "food", "Rice sack", ["M22 12 H42 L38 20 Q50 30 48 46 Q46 56 32 56 Q18 56 16 46 Q14 30 26 20 Z", "M26 20 H38", "M26 40 Q32 36 38 40 M26 46 H38"]],
    ["bread", "food", "Bread", ["M10 30 Q10 18 32 18 Q54 18 54 30 Q54 36 48 36 V50 H16 V36 Q10 36 10 30 Z", "M24 26 L28 30 M32 24 L36 28 M40 26 L44 30"]],
    ["dates", "food", "Dates", ["M20 22 Q12 30 18 42 Q24 48 28 40 Q32 30 20 22 Z", "M36 18 Q28 26 34 38 Q40 44 44 36 Q48 26 36 18 Z", "M20 22 Q22 14 30 10 M36 18 Q36 12 30 10"]],
    ["fruit", "food", "Fruit", ["M32 22 Q16 14 12 32 Q12 52 32 54 Q52 52 52 32 Q48 14 32 22 Z", "M32 22 Q30 14 34 8", "M34 14 Q42 8 46 14 Q40 18 34 14 Z"]],
    ["table", "food", "Shared table", ["M8 30 H56", "M14 30 V52 M50 30 V52", c(22, 22, 5), c(42, 22, 5), "M28 24 H36"]],
    ["pot", "food", "Cooking pot", ["M12 28 H52", "M14 28 V44 Q14 52 22 52 H42 Q50 52 50 44 V28", "M8 32 H14 M50 32 H56", "M26 20 Q24 14 28 10 M36 20 Q34 14 38 10"]],
    // Care & health
    ["heart", "care", "Heart", ["M32 52 Q8 36 10 22 Q12 12 22 12 Q28 12 32 18 Q36 12 42 12 Q52 12 54 22 Q56 36 32 52 Z"]],
    ["handheart", "care", "Hand and heart", ["M8 46 H18 L30 52 H44 Q50 52 54 46 L56 42 Q52 40 46 44 L40 46 H30", "M30 46 H40 Q42 40 36 40 H26 L18 46", "M36 32 Q24 24 26 16 Q28 10 36 16 Q44 10 46 16 Q48 24 36 32 Z"]],
    ["cross", "care", "Medical cross", ["M26 10 H38 V26 H54 V38 H38 V54 H26 V38 H10 V26 H26 Z"]],
    ["hospital", "care", "Clinic", ["M10 54 H54", "M14 54 V20 H50 V54", "M28 30 H36 M32 26 V34", "M26 54 V44 H38 V54", "M20 20 V14 H44 V20"]],
    ["stetho", "care", "Stethoscope", ["M18 8 V22 Q18 34 28 34 Q38 34 38 22 V8", "M28 34 V42 Q28 52 38 52 Q48 52 48 44 V38", c(48, 34, 4), "M14 8 H22 M34 8 H42"]],
    ["shield", "care", "Shield", ["M32 8 L52 14 V30 Q52 46 32 56 Q12 46 12 30 V14 Z", "M24 32 L30 38 L42 26"]],
    // People
    ["family", "people", "Family", [c(22, 18, 6), c(42, 18, 6), "M10 50 Q10 30 22 30 Q34 30 34 50", "M30 50 Q30 30 42 30 Q54 30 54 50", c(32, 38, 4), "M26 56 Q26 46 32 46 Q38 46 38 56"]],
    ["child", "people", "Child", [c(32, 16, 7), "M22 56 L26 36 L18 32 M42 32 L38 36 L42 56", "M26 30 H38 L38 44 H26 Z"]],
    ["hands", "people", "Helping hands", ["M8 34 L20 22 L30 28 L24 34 Q28 40 34 34 L44 24 L56 36", "M8 34 L22 48 Q26 52 30 48 L34 44 Q38 48 42 44 L48 38", "M30 48 L26 44 M38 46 L34 42"]],
    ["handshake", "people", "Handshake", ["M6 30 L18 18 L28 22 L36 18 L46 24 L58 30", "M18 18 L10 40 M46 24 L54 44", "M22 38 L30 46 Q34 50 38 46 L48 36", "M22 38 L28 32 Q32 30 34 34 L40 40"]],
    ["community", "people", "Community", [c(32, 16, 6), c(14, 26, 5), c(50, 26, 5), "M22 50 Q22 30 32 30 Q42 30 42 50", "M6 50 Q6 36 14 36 Q20 36 22 42", "M58 50 Q58 36 50 36 Q44 36 42 42"]],
    // Building
    ["house", "build", "House", ["M10 30 L32 12 L54 30", "M16 26 V54 H48 V26", "M28 54 V40 H36 V54"]],
    ["bridge", "build", "Bridge", ["M6 34 H58", "M10 34 Q32 6 54 34", "M18 34 V22 M26 34 V16 M32 34 V14 M38 34 V16 M46 34 V22", "M10 34 V46 M54 34 V46", "M6 52 Q14 48 22 52 T38 52 T54 52"]],
    ["tower", "build", "Tower and lines", ["M32 6 L20 58 M32 6 L44 58", "M24 42 H40 M26 30 H38 M28 18 H36", "M24 42 L38 30 M40 42 L26 30", "M12 58 H52"]],
    ["hammer", "build", "Tools", ["M14 50 L36 28", "M30 22 L42 10 L54 22 L42 26 Z", "M10 54 L14 50 L18 54 L14 58 Z", "M44 44 L52 52"]],
    ["brick", "build", "Bricks", ["M10 18 H54 V50 H10 Z", "M10 26 H54 M10 34 H54 M10 42 H54", "M22 18 V26 M42 18 V26 M32 26 V34 M22 34 V42 M42 34 V42 M32 42 V50"]],
    ["gear", "build", "Gear", [c(32, 32, 8), "M32 8 V16 M32 48 V56 M8 32 H16 M48 32 H56 M15 15 L21 21 M43 43 L49 49 M49 15 L43 21 M21 43 L15 49", c(32, 32, 17)]],
    ["bolt", "build", "Energy", ["M36 6 L16 36 H30 L26 58 L48 26 H34 Z"]],
    // Travel
    ["car", "travel", "Car", ["M10 42 L14 30 Q16 24 22 24 H42 Q48 24 50 30 L54 42 Z", "M8 42 H56 V48 H8 Z", c(20, 50, 4), c(44, 50, 4), "M20 30 H44"]],
    ["bus", "travel", "Bus", ["M12 14 H52 V50 H12 Z", "M12 32 H52", "M18 20 H46 V28 H18 Z", c(20, 54, 3), c(44, 54, 3), "M18 42 H22 M42 42 H46"]],
    ["bicycle", "travel", "Bicycle", [c(16, 42, 10), c(48, 42, 10), "M16 42 L26 24 H40 L48 42", "M26 24 L32 42 L40 24", "M24 18 H30 M40 24 L38 16 H44"]],
    ["ship", "travel", "Ship", ["M8 40 H56 L50 52 H14 Z", "M16 40 V30 H48 V40", "M26 30 V20 H38 V30", "M6 58 Q14 54 22 58 T38 58 T54 58"]],
    ["plane", "travel", "Plane", ["M8 36 L56 20 Q60 22 56 26 L30 38 L22 54 L18 52 L22 40 L12 42 L8 36 Z"]],
    ["compass", "travel", "Compass", [c(32, 32, 22), "M38 26 L34 34 L26 38 L30 30 Z", "M32 10 V14 M32 50 V54 M10 32 H14 M50 32 H54"]],
    ["road", "travel", "Road", ["M22 6 L8 58", "M42 6 L56 58", "M32 10 V18 M32 26 V34 M32 42 V52"]],
    // Trade & money
    ["bag", "trade", "Shopping bag", ["M14 22 H50 L47 52 Q46.6 55 43.6 55 H20.4 Q17.4 55 17 52 Z", "M24 22 V17 Q24 9 32 9 Q40 9 40 17 V22", "M25 37 L30 42 L39 32"]],
    ["cart", "trade", "Cart", ["M6 12 H14 L20 42 H48 L54 20 H16", c(24, 50, 4), c(44, 50, 4)]],
    ["store", "trade", "Shop front", ["M8 22 L14 10 H50 L56 22", "M8 22 H56 Q56 28 50 28 Q44 28 44 22 Q44 28 38 28 Q32 28 32 22 Q32 28 26 28 Q20 28 20 22 Q20 28 14 28 Q8 28 8 22 Z", "M12 28 V54 H52 V28", "M26 54 V40 H38 V54"]],
    ["coin", "trade", "Coins", [c(26, 26, 14), "M40 22 A14 14 0 1 1 30 46", "M26 18 V34 M22 22 H28 Q31 22 31 25 Q31 28 28 28 H24 Q21 28 21 31 Q21 34 24 34 H30"]],
    ["chart", "trade", "Growth", ["M10 54 H56", "M10 54 V10", "M16 44 L28 32 L36 38 L52 18", "M44 18 H52 V26"]],
    ["briefcase", "trade", "Briefcase", ["M8 22 H56 V52 H8 Z", "M24 22 V14 H40 V22", "M8 34 H56", "M28 34 V40 H36 V34"]],
    ["gem", "trade", "Gem", ["M18 12 H46 L56 26 L32 54 L8 26 Z", "M8 26 H56", "M24 12 L20 26 L32 54 L44 26 L40 12"]],
    ["box", "trade", "Parcel", ["M8 20 L32 8 L56 20 V46 L32 58 L8 46 Z", "M8 20 L32 32 L56 20", "M32 32 V58", "M20 14 L44 26"]],
    ["scale", "trade", "Scales", ["M32 8 V54", "M20 54 H44", "M12 18 H52", "M12 18 L6 34 Q12 40 18 34 Z", "M52 18 L46 34 Q52 40 58 34 Z"]],
    // Symbols
    ["star8", "symbol", "Eight-pointed star", ["M32 6 L35.5 20 L50.4 13.6 L44 28.5 L58 32 L44 35.5 L50.4 50.4 L35.5 44 L32 58 L28.5 44 L13.6 50.4 L20 35.5 L6 32 L20 28.5 L13.6 13.6 L28.5 20 Z", "dot:32,32,5"]],
    ["star", "symbol", "Star", ["M32 8 L38.5 24 L56 25 L42.5 36 L47 53 L32 44 L17 53 L21.5 36 L8 25 L25.5 24 Z"]],
    ["moon", "symbol", "Moon", ["M42 10 A22 22 0 1 0 54 42 A18 18 0 1 1 42 10 Z"]],
    ["light", "symbol", "Light bulb", ["M24 40 Q14 32 16 22 Q18 10 32 10 Q46 10 48 22 Q50 32 40 40 V46 H24 Z", "M26 52 H38 M28 58 H36", "M32 46 V32 L28 28 M32 32 L36 28"]],
    ["key", "symbol", "Key", [c(20, 32, 10), "M30 32 H56 M48 32 V40 M54 32 V38"]],
    ["infinity", "symbol", "Infinity", ["M32 32 Q24 20 16 22 Q8 24 8 32 Q8 40 16 42 Q24 44 32 32 Q40 20 48 22 Q56 24 56 32 Q56 40 48 42 Q40 44 32 32 Z"]],
    ["hourglass", "symbol", "Hourglass", ["M16 8 H48 M16 56 H48", "M20 8 Q20 26 32 32 Q20 38 20 56", "M44 8 Q44 26 32 32 Q44 38 44 56", "M26 50 Q32 44 38 50"]],
    ["anchor", "symbol", "Anchor", [c(32, 12, 5), "M32 17 V56", "M22 26 H42", "M12 40 Q14 54 32 56 Q50 54 52 40", "M8 44 L12 40 L16 44 M48 44 L52 40 L56 44"]],
    ["mail", "symbol", "Letter", ["M8 16 H56 V48 H8 Z", "M8 16 L32 36 L56 16"]],
    ["flag", "symbol", "Flag", ["M14 58 V8", "M14 10 Q24 4 34 10 Q44 16 52 10 V34 Q44 40 34 34 Q24 28 14 34"]]
  ];
  var BY = {};
  L.forEach(function (x) { BY[x[0]] = { id: x[0], group: x[1], label: x[2], paths: x[3] }; });
  // The icon each pillar is drawn with until the founder chooses another
  var DEFAULTS = { scholarships: "cap", worship: "mosque", library: "book", foodland: "sprout", foodclothing: "bowl", water: "drop", transport: "car", venture: "bag", hospitals: "cross", schools: "school", livestock: "field", infra: "bridge" };
  function render(id, opt) {
    var R = window.React, ic = BY[id];
    if (!R || !ic) return null;
    opt = opt || {};
    var size = opt.size || 56, sw = opt.strokeWidth || 1.1;
    var kids = ic.paths.map(function (d, i) {
      if (d.indexOf("dot:") === 0) { var p = d.slice(4).split(","); return R.createElement("circle", { key: i, cx: p[0], cy: p[1], r: p[2], fill: "currentColor", stroke: "none" }); }
      return R.createElement("path", { key: i, d: d });
    });
    return R.createElement("svg", { viewBox: "0 0 64 64", width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", focusable: "false" }, kids);
  }
  window.BrialPillarIcons = { list: L.map(function (x) { return BY[x[0]]; }), groups: GROUPS, get: function (id) { return BY[id] || null; }, defaults: DEFAULTS, render: render };
})();
