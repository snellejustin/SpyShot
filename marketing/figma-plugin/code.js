// SpyShot Figma Slide Generator v3
// Clean, no emojis, breathing room, real party photos

var W = 1080;
var H = 1920;

var C = {
  bg: { r: 0.122, g: 0.161, b: 0.216 },
  dark: { r: 0.067, g: 0.094, b: 0.153 },
  surface: { r: 0.216, g: 0.255, b: 0.318 },
  primary: { r: 0.984, g: 0.745, b: 0.141 },
  orange: { r: 0.976, g: 0.451, b: 0.086 },
  pink: { r: 0.925, g: 0.282, b: 0.600 },
  blue: { r: 0.231, g: 0.510, b: 0.965 },
  green: { r: 0.063, g: 0.725, b: 0.506 },
  purple: { r: 0.659, g: 0.333, b: 0.969 },
  error: { r: 0.937, g: 0.267, b: 0.267 },
  white: { r: 1, g: 1, b: 1 },
  muted: { r: 0.75, g: 0.76, b: 0.8 },
  deepPurple: { r: 0.18, g: 0.05, b: 0.35 },
  deepBlue: { r: 0.05, g: 0.1, b: 0.35 },
  deepPink: { r: 0.35, g: 0.05, b: 0.2 },
  deepOrange: { r: 0.35, g: 0.15, b: 0.05 },
  deepGreen: { r: 0.05, g: 0.25, b: 0.18 },
  midPurple: { r: 0.3, g: 0.1, b: 0.5 },
  midPink: { r: 0.5, g: 0.1, b: 0.35 },
};

// Party photos — groups cheersing, diverse, 18-35, drinks
var PHOTOS = {
  cheers1: 'https://images.unsplash.com/photo-1624634564754-e45be6d06159?w=1080&q=75',
  cheers2: 'https://images.unsplash.com/photo-1700615753059-0780f634a434?w=1080&q=75',
  cheers3: 'https://images.unsplash.com/photo-1515135385067-5516a1e38bbe?w=1080&q=75',
  cheers4: 'https://images.unsplash.com/photo-1533242553289-5ed0b2bc5a74?w=1080&q=75',
  toast1: 'https://images.unsplash.com/photo-1758272133395-b0f83eb6f554?w=1080&q=75',
  toast2: 'https://images.unsplash.com/photo-1758275557233-773c6c03614e?w=1080&q=75',
  party1: 'https://images.unsplash.com/photo-1549476465-898c14bf528d?w=1080&q=75',
  party2: 'https://images.unsplash.com/photo-1511548774318-563182fe8d03?w=1080&q=75',
  group1: 'https://images.unsplash.com/photo-1528218635780-5952720c9729?w=1080&q=75',
  group2: 'https://images.unsplash.com/photo-1568237348563-9aa26fed0457?w=1080&q=75',
  friends1: 'https://images.unsplash.com/photo-1758272133713-52c6bb9f74f0?w=1080&q=75',
  friends2: 'https://images.unsplash.com/photo-1758272133483-281d50324455?w=1080&q=75',
  rooftop1: 'https://images.unsplash.com/photo-1758272133542-b3107b947fc2?w=1080&q=75',
  cans1: 'https://images.unsplash.com/photo-1704403529198-7ed712f31c31?w=1080&q=75',
  celebrate1: 'https://images.unsplash.com/photo-1763651956731-d3ae654a3ac2?w=1080&q=75',
  celebrate2: 'https://images.unsplash.com/photo-1763651963738-467583998778?w=1080&q=75',
  outdoor1: 'https://images.unsplash.com/photo-1758275557250-894dd1e8feb3?w=1080&q=75',
};

function clr(c) { return { r: c.r, g: c.g, b: c.b }; }
function rgb(c, a) { return { r: c.r, g: c.g, b: c.b, a: a !== undefined ? a : 1 }; }
function rgba(c, a) { return { r: c.r, g: c.g, b: c.b, a: a }; }
function solidFill(c, opacity) {
  var f = { type: 'SOLID', color: clr(c) };
  if (opacity !== undefined && opacity < 1) f.opacity = opacity;
  return f;
}

var imageCache = {};
var imageQueue = [];

async function loadImage(url) {
  if (imageCache[url]) return imageCache[url];
  try {
    var response = await fetch(url);
    var buffer = await response.arrayBuffer();
    var img = figma.createImage(new Uint8Array(buffer));
    imageCache[url] = img;
    return img;
  } catch (e) { return null; }
}

async function setImageFill(node, url) {
  var img = await loadImage(url);
  if (img) {
    node.fills = [{ type: 'IMAGE', imageHash: img.hash, scaleMode: 'FILL' }];
  }
}

async function loadFont() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Extra Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Black" });
}

function makeFrame(name, x, y) {
  var f = figma.createFrame();
  f.name = name; f.resize(W, H); f.x = x; f.y = y;
  f.clipsContent = true; f.fills = [solidFill(C.dark)];
  return f;
}

function addGradient(parent, stops) {
  var r = figma.createRectangle();
  r.name = 'Gradient'; r.resize(W, H);
  r.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientStops: stops.map(function(s) { return { position: s[0], color: rgb(s[1], s[2] || 1) }; }),
    gradientTransform: [[0.4, 0, 0], [0, 1, 0]]
  }];
  parent.appendChild(r);
}

function addPhoto(parent, photoKey, y, w, h, x) {
  var r = figma.createRectangle();
  r.name = 'Photo'; r.resize(w || W, h || H);
  r.x = x || 0; r.y = y || 0;
  r.fills = [solidFill(C.surface)];
  r.cornerRadius = (w && w < W) ? 16 : 0;
  if (photoKey && PHOTOS[photoKey]) {
    imageQueue.push({ node: r, url: PHOTOS[photoKey] });
  }
  parent.appendChild(r);
  return r;
}

function addOverlay(parent, opacity) {
  var r = figma.createRectangle();
  r.name = 'Overlay'; r.resize(W, H);
  var o = Math.min(opacity || 0.5, 1);
  r.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientStops: [
      { position: 0, color: rgb({ r: 0, g: 0, b: 0 }, Math.min(o + 0.1, 1)) },
      { position: 0.4, color: rgb({ r: 0, g: 0, b: 0 }, Math.max(o - 0.1, 0)) },
      { position: 1, color: rgb({ r: 0, g: 0, b: 0 }, Math.min(o + 0.15, 1)) }
    ],
    gradientTransform: [[0, 0, 0], [0, 1, 0]]
  }];
  parent.appendChild(r);
}

function addText(parent, str, opts) {
  opts = opts || {};
  var t = figma.createText();
  t.characters = str;
  t.fontSize = opts.size || 40;
  t.fontName = { family: "Inter", style: opts.weight || 'Bold' };
  var c = opts.color || C.white;
  var op = c.a !== undefined ? c.a : 1;
  t.fills = [solidFill(c, op)];
  t.textAlignHorizontal = opts.align || 'CENTER';
  t.textAutoResize = 'HEIGHT';
  var w = opts.width || (W - 160);
  t.resize(w, 10);
  t.x = opts.align === 'LEFT' ? (opts.x || 80) : ((W - w) / 2);
  if (opts.x !== undefined && opts.align === 'LEFT') t.x = opts.x;
  t.y = opts.y || 0;
  if (opts.lineHeight) {
    t.lineHeight = { value: opts.lineHeight, unit: 'PIXELS' };
  }
  parent.appendChild(t);
  return t;
}

function addPill(parent, str, x, y, bg, textColor, sz) {
  var f = figma.createFrame();
  f.name = str; f.layoutMode = 'HORIZONTAL';
  f.primaryAxisAlignItems = 'CENTER'; f.counterAxisAlignItems = 'CENTER';
  f.paddingLeft = 40; f.paddingRight = 40; f.paddingTop = 18; f.paddingBottom = 18;
  f.cornerRadius = 40; f.fills = [solidFill(bg)];
  f.x = x; f.y = y;
  var t = figma.createText();
  t.characters = str; t.fontSize = sz || 30;
  t.fontName = { family: "Inter", style: "Extra Bold" };
  t.fills = [solidFill(textColor)];
  f.appendChild(t);
  parent.appendChild(f);
}

function addCard(parent, x, y, w, h, bg, border) {
  var r = figma.createRectangle();
  r.name = 'Card'; r.x = x; r.y = y; r.resize(w, h);
  r.cornerRadius = 20;
  var bgOp = bg && bg.a !== undefined ? bg.a : 0.15;
  r.fills = [solidFill(bg || C.white, bgOp)];
  if (border) {
    var bOp = border.a !== undefined ? border.a : 0.3;
    r.strokes = [solidFill(border, bOp)];
    r.strokeWeight = 1; r.strokeAlign = 'INSIDE';
  }
  parent.appendChild(r);
}

function addCircle(parent, x, y, rad, color) {
  var e = figma.createEllipse();
  e.x = x - rad; e.y = y - rad; e.resize(rad * 2, rad * 2);
  e.fills = [solidFill(color)];
  parent.appendChild(e);
}

// ===================================================================
// SLIDESHOW 1: What is SpyShot (6 slides)
// ===================================================================

function s1_hook(f) {
  addGradient(f, [[0, C.deepPurple], [0.5, C.midPink], [1, C.deepOrange]]);
  addPhoto(f, 'cheers1');
  addOverlay(f, 0.5);
  // Minimal text, lots of breathing room
  addText(f, 'YOUR PARTIES ARE\nABOUT TO CHANGE', { y: 700, size: 28, weight: 'Semi Bold', color: C.primary, lineHeight: 42 });
  addText(f, 'The app that turns\nany night out into\na legendary story', { y: 820, size: 68, weight: 'Black', lineHeight: 82 });
  addText(f, 'swipe', { y: H - 120, size: 20, weight: 'Medium', color: rgba(C.white, 0.35) });
}

function s1_problem(f) {
  addGradient(f, [[0, C.deepPurple], [0.5, C.deepPink], [1, C.deepBlue]]);
  addPhoto(f, 'party2');
  addOverlay(f, 0.6);
  addText(f, "We've all\nbeen there", { y: 260, size: 62, weight: 'Black', lineHeight: 74 });
  var items = [
    "Everyone's on their phone",
    'Same conversations every weekend',
    'The night has zero memorable moments',
    'Nothing to look back on the next day',
  ];
  var py = 520;
  for (var i = 0; i < items.length; i++) {
    addText(f, items[i], { x: 120, y: py, size: 28, weight: 'Regular', color: rgba(C.white, 0.75), align: 'LEFT', width: 840 });
    // Divider line
    var line = figma.createRectangle();
    line.resize(840, 1); line.x = 120; line.y = py + 50;
    line.fills = [solidFill(C.white, 0.08)];
    f.appendChild(line);
    py += 80;
  }
}

function s1_solution(f) {
  addGradient(f, [[0, C.midPurple], [0.5, C.deepPurple], [1, C.deepGreen]]);
  addPhoto(f, 'cheers2');
  addOverlay(f, 0.55);
  addText(f, 'SpyShot', { y: 300, size: 80, weight: 'Black', color: C.primary });
  addText(f, 'The party game\nthat plays itself', { y: 420, size: 34, weight: 'Semi Bold', lineHeight: 48 });
  var features = [
    ['Random Challenges', '120+ tasks, 3 intensity levels'],
    ['Photo Proof', 'Capture every legendary moment'],
    ['Badges & Tiers', 'Bronze to Mythic — flex your rank'],
    ['Bold Mode', 'Risk it for double points'],
    ['Social Feed', 'Relive the night with friends'],
  ];
  var fy = 620;
  for (var i = 0; i < features.length; i++) {
    addCard(f, 80, fy, W - 160, 85, rgba(C.white, 0.06), rgba(C.white, 0.1));
    addText(f, features[i][0], { x: 110, y: fy + 16, size: 26, weight: 'Bold', align: 'LEFT', width: 600 });
    addText(f, features[i][1], { x: 110, y: fy + 50, size: 18, weight: 'Regular', color: rgba(C.white, 0.55), align: 'LEFT', width: 600 });
    fy += 105;
  }
}

function s1_how(f) {
  addGradient(f, [[0, C.deepBlue], [0.5, C.deepPurple], [1, C.midPurple]]);
  addPhoto(f, 'friends1');
  addOverlay(f, 0.55);
  addText(f, 'How it works', { y: 200, size: 52, weight: 'Black' });
  var steps = [
    ['01', 'Create a group', 'Invite friends or share a 4-digit code'],
    ['02', 'Pick your vibe', 'Chill, Wild, or Extreme'],
    ['03', 'The app picks who & what', 'Random player + challenge'],
    ['04', 'Complete & prove it', 'Photo, timer, or just do it'],
    ['05', 'Relive the night', 'Feed, reactions, leaderboard'],
  ];
  var sy = 380;
  for (var i = 0; i < steps.length; i++) {
    addText(f, steps[i][0], { x: 100, y: sy, size: 32, weight: 'Black', color: C.primary, align: 'LEFT', width: 60 });
    addText(f, steps[i][1], { x: 180, y: sy, size: 28, weight: 'Bold', align: 'LEFT', width: 700 });
    addText(f, steps[i][2], { x: 180, y: sy + 38, size: 20, weight: 'Regular', color: rgba(C.white, 0.5), align: 'LEFT', width: 700 });
    sy += 105;
  }
}

function s1_proof(f) {
  addGradient(f, [[0, C.deepGreen], [0.5, C.deepPurple], [1, C.deepPink]]);
  addPhoto(f, 'friends2');
  addOverlay(f, 0.45);
  addText(f, '"We used SpyShot at our\nhouse party and it was\ngenuinely the most fun\nwe\'ve had in months."', { y: 480, size: 44, weight: 'Semi Bold', lineHeight: 60 });
  addText(f, '@emma_w', { y: 800, size: 24, weight: 'Bold', color: C.primary });
  // Stats at bottom with space
  addText(f, '120+', { x: 120, y: 1080, size: 48, weight: 'Black', color: C.primary, align: 'LEFT', width: 200 });
  addText(f, 'challenges', { x: 120, y: 1135, size: 18, weight: 'Medium', color: rgba(C.white, 0.45), align: 'LEFT', width: 200 });
  addText(f, '3', { x: 440, y: 1080, size: 48, weight: 'Black', color: C.primary, align: 'LEFT', width: 200 });
  addText(f, 'intensity levels', { x: 440, y: 1135, size: 18, weight: 'Medium', color: rgba(C.white, 0.45), align: 'LEFT', width: 200 });
  addText(f, '9', { x: 740, y: 1080, size: 48, weight: 'Black', color: C.primary, align: 'LEFT', width: 200 });
  addText(f, 'badge tiers', { x: 740, y: 1135, size: 18, weight: 'Medium', color: rgba(C.white, 0.45), align: 'LEFT', width: 200 });
}

function s1_cta(f) {
  addGradient(f, [[0, C.deepPink], [0.5, C.midPurple], [1, C.deepOrange]]);
  addPhoto(f, 'toast1');
  addOverlay(f, 0.45);
  addText(f, 'SpyShot', { y: 620, size: 96, weight: 'Black', color: C.primary });
  addText(f, 'Your next night out\ndeserves to be legendary', { y: 770, size: 40, weight: 'Semi Bold', lineHeight: 54 });
  addPill(f, 'Download Free', (W - 340) / 2, 960, C.primary, C.dark, 32);
  addText(f, 'iOS & Android', { y: 1060, size: 18, weight: 'Medium', color: rgba(C.white, 0.3) });
}

// ===================================================================
// SLIDESHOW 2: Bold or Easy (5 slides)
// ===================================================================

function s2_hook(f) {
  addGradient(f, [[0, C.deepOrange], [0.5, C.deepPurple], [1, C.deepPink]]);
  addPhoto(f, 'cheers3');
  addOverlay(f, 0.45);
  addText(f, 'Every task has\ntwo versions', { y: 700, size: 64, weight: 'Black', lineHeight: 78 });
  addText(f, 'Play it safe, or go bold.', { y: 920, size: 28, weight: 'Regular', color: rgba(C.white, 0.55) });
}

function s2_easy(f) {
  addGradient(f, [[0, C.deepGreen], [0.5, C.deepBlue], [1, C.deepPurple]]);
  addPhoto(f, 'outdoor1');
  addOverlay(f, 0.6);
  addText(f, 'EASY', { y: 300, size: 24, weight: 'Bold', color: C.green });
  addCard(f, 80, 400, W - 160, 250, rgba(C.green, 0.08), rgba(C.green, 0.2));
  addText(f, 'Stranger Selfie', { x: 120, y: 440, size: 40, weight: 'Extra Bold', align: 'LEFT', width: 800 });
  addText(f, 'Take a selfie with\nsomeone you don\'t know', { x: 120, y: 500, size: 26, weight: 'Regular', color: rgba(C.white, 0.7), align: 'LEFT', width: 800, lineHeight: 36 });
  addText(f, '+1 point', { x: 120, y: 590, size: 22, weight: 'Bold', color: C.green, align: 'LEFT', width: 400 });
  addPill(f, 'Safe & Fun', (W - 240) / 2, 780, C.green, C.white, 26);
}

function s2_bold(f) {
  addGradient(f, [[0, C.deepOrange], [0.5, C.deepPink], [1, C.deepPurple]]);
  addPhoto(f, 'party1');
  addOverlay(f, 0.5);
  addText(f, 'BOLD', { y: 300, size: 24, weight: 'Bold', color: C.orange });
  addCard(f, 80, 400, W - 160, 250, rgba(C.orange, 0.08), rgba(C.orange, 0.2));
  addText(f, 'Stranger Selfie', { x: 120, y: 440, size: 40, weight: 'Extra Bold', align: 'LEFT', width: 800 });
  addText(f, 'Take a selfie with THREE\npeople you don\'t know', { x: 120, y: 500, size: 26, weight: 'Regular', color: rgba(C.white, 0.7), align: 'LEFT', width: 800, lineHeight: 36 });
  addText(f, '+2 points  ·  2x progress', { x: 120, y: 590, size: 22, weight: 'Bold', color: C.orange, align: 'LEFT', width: 400 });
  addPill(f, '2X POINTS', (W - 260) / 2, 780, C.orange, C.white, 28);
}

function s2_vs(f) {
  // Left: Easy (green)
  var left = figma.createRectangle();
  left.resize(W / 2, H); left.fills = [solidFill(C.green)];
  f.appendChild(left);
  addPhoto(f, 'celebrate1', 0, W / 2, H, 0);
  var leftOv = figma.createRectangle();
  leftOv.resize(W / 2, H); leftOv.fills = [solidFill(C.green, 0.65)];
  f.appendChild(leftOv);
  addText(f, 'Easy', { x: 0, y: 800, size: 52, weight: 'Black', align: 'CENTER', width: W / 2 });
  addText(f, 'Chill vibes\nStandard points', { x: 0, y: 880, size: 24, weight: 'Regular', align: 'CENTER', width: W / 2, lineHeight: 36 });

  // Right: Bold (orange)
  var right = figma.createRectangle();
  right.x = W / 2; right.resize(W / 2, H); right.fills = [solidFill(C.orange)];
  f.appendChild(right);
  addPhoto(f, 'celebrate2', 0, W / 2, H, W / 2);
  var rightOv = figma.createRectangle();
  rightOv.x = W / 2; rightOv.resize(W / 2, H); rightOv.fills = [solidFill(C.orange, 0.65)];
  f.appendChild(rightOv);
  addText(f, 'Bold', { x: W / 2, y: 800, size: 52, weight: 'Black', align: 'CENTER', width: W / 2 });
  addText(f, 'Double points\nLegend status', { x: W / 2, y: 880, size: 24, weight: 'Regular', align: 'CENTER', width: W / 2, lineHeight: 36 });

  // VS badge
  addCircle(f, W / 2, H / 2, 46, C.primary);
  addText(f, 'VS', { x: W / 2 - 35, y: H / 2 - 18, size: 30, weight: 'Black', color: C.dark, align: 'CENTER', width: 70 });
}

function s2_cta(f) {
  addGradient(f, [[0, C.midPurple], [0.5, C.deepPink], [1, C.deepOrange]]);
  addPhoto(f, 'cheers4');
  addOverlay(f, 0.45);
  addText(f, 'SpyShot', { y: 680, size: 86, weight: 'Black', color: C.primary });
  addText(f, 'How bold are you\nwilling to go?', { y: 810, size: 42, weight: 'Semi Bold', lineHeight: 56 });
  addPill(f, 'Download Free', (W - 340) / 2, 980, C.primary, C.dark, 32);
}

// ===================================================================
// SLIDESHOW 3: Pick Your Vibe (5 slides)
// ===================================================================

function s3_hook(f) {
  addGradient(f, [[0, C.deepPurple], [0.5, C.deepPink], [1, C.deepOrange]]);
  addPhoto(f, 'group1');
  addOverlay(f, 0.45);
  addText(f, 'Not every night\nis the same vibe', { y: 700, size: 62, weight: 'Black', lineHeight: 76 });
  addText(f, 'Three intensity modes.\nYou choose.', { y: 920, size: 28, weight: 'Regular', color: rgba(C.white, 0.55), lineHeight: 40 });
}

function s3_mode(f, name, desc, nameColor, tasks, photoKey) {
  var grads = {
    'CHILL': [[0, C.deepBlue], [0.5, C.deepPurple], [1, C.deepGreen]],
    'WILD': [[0, C.deepOrange], [0.5, C.midPink], [1, C.deepPurple]],
    'EXTREME': [[0, C.deepPink], [0.5, C.midPurple], [1, C.deepOrange]]
  };
  addGradient(f, grads[name] || [[0, C.deepPurple], [1, C.deepPink]]);
  addPhoto(f, photoKey);
  addOverlay(f, 0.55);
  addText(f, name, { y: 260, size: 64, weight: 'Black', color: nameColor });
  addText(f, desc, { y: 345, size: 26, weight: 'Regular', color: rgba(C.white, 0.55) });
  var ty = 480;
  for (var i = 0; i < tasks.length; i++) {
    addCard(f, 80, ty, W - 160, 60, rgba(nameColor, 0.06), rgba(nameColor, 0.15));
    addText(f, tasks[i], { x: 110, y: ty + 16, size: 22, weight: 'Regular', align: 'LEFT', width: 820 });
    ty += 80;
  }
  return ty;
}

function s3_chill(f) {
  s3_mode(f, 'CHILL', 'Icebreakers & light fun', C.blue, [
    'Sing the first line of your last song',
    'Show your 7th camera roll photo',
    'Compliment everyone at the table',
    'Celebrity impression — group votes',
    'Two truths and one lie',
  ], 'group2');
}

function s3_wild(f) {
  s3_mode(f, 'WILD', 'Classic party mode', C.orange, [
    'Challenge someone to a dance-off',
    'Fake propose to a stranger',
    '30-second air guitar solo',
    'Photobomb as many photos as possible in 60s',
    'Request a song — if it plays, everyone drinks',
  ], 'rooftop1');
}

function s3_extreme(f) {
  s3_mode(f, 'EXTREME', 'Late night chaos', C.pink, [
    'Sing a duet with a complete stranger',
    'Get 3 people to crowd surf you',
    'Eat a lemon without making a face',
    'Give a speech standing on a chair',
    'Full roast battle — group votes the winner',
  ], 'cans1');
  addText(f, 'Not for the faint of heart.', { y: 920, size: 20, weight: 'Medium', color: rgba(C.pink, 0.7) });
}

function s3_cta(f) {
  addGradient(f, [[0, C.midPurple], [0.5, C.deepPink], [1, C.deepOrange]]);
  addPhoto(f, 'toast2');
  addOverlay(f, 0.45);
  addText(f, 'SpyShot', { y: 620, size: 76, weight: 'Black', color: C.primary });
  addText(f, 'Pick your vibe.\nStart the game.', { y: 740, size: 40, weight: 'Semi Bold', lineHeight: 54 });
  // Mode pills
  addPill(f, 'Chill', W / 2 - 280, 900, rgba(C.blue, 0.25), C.blue, 24);
  addPill(f, 'Wild', W / 2 - 55, 900, rgba(C.orange, 0.25), C.orange, 24);
  addPill(f, 'Extreme', W / 2 + 150, 900, rgba(C.pink, 0.25), C.pink, 24);
  addPill(f, 'Download Free', (W - 340) / 2, 1020, C.primary, C.dark, 32);
}

// ===================================================================
// MAIN
// ===================================================================

async function main() {
  await loadFont();
  var page = figma.currentPage;
  var GAP = 120;
  var xOffset = 0;

  var sections = [
    { title: 'Slideshow 1: What is SpyShot', slides: [s1_hook, s1_problem, s1_solution, s1_how, s1_proof, s1_cta] },
    { title: 'Slideshow 2: Bold or Easy', slides: [s2_hook, s2_easy, s2_bold, s2_vs, s2_cta] },
    { title: 'Slideshow 3: Pick Your Vibe', slides: [s3_hook, s3_chill, s3_wild, s3_extreme, s3_cta] },
  ];

  for (var s = 0; s < sections.length; s++) {
    var section = sections[s];
    var label = figma.createText();
    label.characters = section.title;
    label.fontSize = 48;
    label.fontName = { family: "Inter", style: "Bold" };
    label.fills = [solidFill(C.primary)];
    label.x = xOffset; label.y = -80;
    page.appendChild(label);

    for (var i = 0; i < section.slides.length; i++) {
      var frame = makeFrame(section.title + ' - Slide ' + (i + 1), xOffset, 0);
      page.appendChild(frame);
      section.slides[i](frame);
      xOffset += W + GAP;
    }
    xOffset += GAP * 2;
  }

  // Load images
  figma.notify('Loading ' + imageQueue.length + ' photos...');
  var loaded = 0;
  for (var q = 0; q < imageQueue.length; q++) {
    try {
      await setImageFill(imageQueue[q].node, imageQueue[q].url);
      loaded++;
    } catch (e) {}
  }

  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.notify('Done! ' + loaded + ' photos loaded across 16 slides.');
  figma.closePlugin();
}

main();
