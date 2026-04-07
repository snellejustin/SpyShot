// SpyShot Figma Slide Generator
// Creates all 16 marketing slides as editable Figma frames

const W = 1080;
const H = 1920;

const C = {
  bg: { r: 0.122, g: 0.161, b: 0.216 },       // #1f2937
  dark: { r: 0.067, g: 0.094, b: 0.153 },      // #111827
  surface: { r: 0.216, g: 0.255, b: 0.318 },    // #374151
  border: { r: 0.294, g: 0.333, b: 0.388 },     // #4b5563
  primary: { r: 0.984, g: 0.745, b: 0.141 },    // #fbbf24
  orange: { r: 0.976, g: 0.451, b: 0.086 },     // #f97316
  pink: { r: 0.925, g: 0.282, b: 0.600 },       // #ec4899
  blue: { r: 0.231, g: 0.510, b: 0.965 },       // #3b82f6
  green: { r: 0.063, g: 0.725, b: 0.506 },      // #10b981
  purple: { r: 0.659, g: 0.333, b: 0.969 },     // #a855f7
  error: { r: 0.937, g: 0.267, b: 0.267 },      // #ef4444
  white: { r: 1, g: 1, b: 1 },
  textMuted: { r: 0.612, g: 0.639, b: 0.686 },  // #9ca3af
  textSec: { r: 0.820, g: 0.835, b: 0.855 },    // #d1d5db
};

// Figma solid fills: color = {r,g,b}, opacity is separate.
// Figma gradient stops: color = {r,g,b,a} — alpha IS on the color.
function clr(c) { return { r: c.r, g: c.g, b: c.b }; }

// For gradient stop colors (includes alpha)
function rgb(c, a) { return { r: c.r, g: c.g, b: c.b, a: a !== undefined ? a : 1 }; }

// Shorthand to create a color with alpha (used by addText/addCard to detect opacity)
function rgba(c, a) { return { r: c.r, g: c.g, b: c.b, a: a }; }

// For solid fills (opacity separate)
function solidFill(c, opacity) {
  var f = { type: 'SOLID', color: clr(c) };
  if (opacity !== undefined && opacity < 1) f.opacity = opacity;
  return f;
}

async function loadFont() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  await figma.loadFontAsync({ family: "Inter", style: "Semi Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Extra Bold" });
  await figma.loadFontAsync({ family: "Inter", style: "Black" });
}

function createSlideFrame(name, x, y) {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(W, H);
  frame.x = x;
  frame.y = y;
  frame.clipsContent = true;
  frame.fills = [solidFill(C.bg)];
  frame.layoutMode = 'NONE';
  return frame;
}

function addGradientBg(parent, colors) {
  const rect = figma.createRectangle();
  rect.name = 'Background Gradient';
  rect.resize(W, H);
  rect.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientStops: colors.map(([pos, color, opacity]) => ({
      position: pos,
      color: rgb(color, opacity || 1),
    })),
    gradientTransform: [[0.4, 0, 0], [0, 1, 0]],
  }];
  parent.appendChild(rect);
  return rect;
}

function addPhotoPlaceholder(parent, label, y, w, h, borderColor, x) {
  const group = figma.createFrame();
  group.name = '📷 ' + label;
  group.resize(w || W, h || H);
  group.x = x || 0;
  group.y = y || 0;
  group.fills = [solidFill(C.surface)];
  group.strokes = [solidFill(borderColor || C.border)];
  group.strokeWeight = 2;
  group.dashPattern = [8, 4];
  group.cornerRadius = 16;
  group.layoutMode = 'VERTICAL';
  group.primaryAxisAlignItems = 'CENTER';
  group.counterAxisAlignItems = 'CENTER';

  const txt = figma.createText();
  txt.characters = '📷 ' + label;
  txt.fontSize = w && w < 300 ? 14 : 18;
  txt.fontName = { family: "Inter", style: "Medium" };
  txt.fills = [solidFill(C.textMuted)];
  txt.textAlignHorizontal = 'CENTER';
  group.appendChild(txt);

  parent.appendChild(group);
  return group;
}

function addText(parent, str, opts = {}) {
  const {
    x = W / 2, y = 0, size = 40, weight = 'Bold',
    color = C.white, align = 'CENTER', width = W - 160,
  } = opts;

  const txt = figma.createText();
  txt.characters = str;
  txt.fontSize = size;
  txt.fontName = { family: "Inter", style: weight };
  // Handle colors that might have .a (opacity) from rgba()
  var fillOpacity = color.a !== undefined ? color.a : 1;
  txt.fills = [solidFill(color, fillOpacity)];
  txt.textAlignHorizontal = align;
  txt.textAutoResize = 'HEIGHT';
  txt.resize(width, 10);
  txt.x = align === 'CENTER' ? (W - width) / 2 : x;
  txt.y = y;
  if (align === 'LEFT') txt.x = x;

  parent.appendChild(txt);
  return txt;
}

function addPill(parent, str, x, y, bgColor, textColor, size) {
  const frame = figma.createFrame();
  frame.name = str;
  frame.layoutMode = 'HORIZONTAL';
  frame.primaryAxisAlignItems = 'CENTER';
  frame.counterAxisAlignItems = 'CENTER';
  frame.paddingLeft = 40;
  frame.paddingRight = 40;
  frame.paddingTop = 16;
  frame.paddingBottom = 16;
  frame.cornerRadius = 40;
  frame.fills = [solidFill(bgColor)];
  frame.x = x;
  frame.y = y;

  const txt = figma.createText();
  txt.characters = str;
  txt.fontSize = size || 30;
  txt.fontName = { family: "Inter", style: "Extra Bold" };
  txt.fills = [solidFill(textColor)];
  frame.appendChild(txt);

  parent.appendChild(frame);
  return frame;
}

function addCard(parent, x, y, w, h, bgColor, borderColor) {
  const rect = figma.createRectangle();
  rect.name = 'Card';
  rect.x = x;
  rect.y = y;
  rect.resize(w, h);
  rect.cornerRadius = 24;
  var bg = bgColor || C.surface;
  var bgOpacity = bg.a !== undefined ? bg.a : 0.3;
  rect.fills = [solidFill(bg, bgOpacity)];
  if (borderColor) {
    var bOpacity = borderColor.a !== undefined ? borderColor.a : 1;
    rect.strokes = [solidFill(borderColor, bOpacity)];
    rect.strokeWeight = 1;
    rect.strokeAlign = 'INSIDE';
  }
  parent.appendChild(rect);
  return rect;
}

function addCircle(parent, x, y, r, color) {
  const e = figma.createEllipse();
  e.x = x - r;
  e.y = y - r;
  e.resize(r * 2, r * 2);
  e.fills = [solidFill(color)];
  parent.appendChild(e);
  return e;
}

function addOverlay(parent, opacity) {
  const rect = figma.createRectangle();
  rect.name = 'Dark Overlay';
  rect.resize(W, H);
  rect.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientStops: [
      { position: 0, color: rgb({ r: 0, g: 0, b: 0 }, opacity || 0.7) },
      { position: 0.5, color: rgb({ r: 0, g: 0, b: 0 }, (opacity || 0.7) - 0.15) },
      { position: 1, color: rgb({ r: 0, g: 0, b: 0 }, (opacity || 0.7) + 0.1) },
    ],
    gradientTransform: [[0, 0, 0], [0, 1, 0]],
  }];
  parent.appendChild(rect);
}

function slideLabel(parent, current, total) {
  addText(parent, 'SLIDE ' + current + ' OF ' + total, {
    y: H - 70, size: 20, weight: 'Semi Bold',
    color: rgba(C.white, 0.25),
  });
}

// ===================================================================
// SLIDES
// ===================================================================

function slide1_hook(frame) {
  addGradientBg(frame, [[0, C.dark], [0.5, C.bg], [1, { r: 0.118, g: 0.106, b: 0.302 }]]);
  addPhotoPlaceholder(frame, 'Friends group selfie outdoor with beers', 0, W, H, C.primary);
  addOverlay(frame, 0.65);
  addText(frame, 'YOUR PARTIES ARE ABOUT TO CHANGE', { y: 680, size: 30, weight: 'Semi Bold', color: C.primary });
  addText(frame, 'The app that turns any night out into a legendary story', { y: 760, size: 72, weight: 'Black' });
  addText(frame, 'SWIPE →', { y: H - 110, size: 26, color: rgba(C.white, 0.4) });
  slideLabel(frame, 1, 6);
}

function slide1_problem(frame) {
  addGradientBg(frame, [[0, C.dark], [1, { r: 0.059, g: 0.090, b: 0.165 }]]);
  addPhotoPlaceholder(frame, 'People bored on phones at party/gathering', 0, W, H, C.error);
  addOverlay(frame, 0.88);
  addText(frame, "We've all been there...", { y: 180, size: 58, weight: 'Extra Bold' });
  const problems = [
    "Everyone's on their phone at the party",
    'Same boring conversations every weekend',
    'No one wants to suggest a drinking game',
    'The night has zero memorable moments',
    'Nothing to look back on the next day',
  ];
  let py = 340;
  problems.forEach(p => {
    addText(frame, '✕', { x: 100, y: py, size: 36, weight: 'Extra Bold', color: C.error, align: 'LEFT', width: 50 });
    addText(frame, p, { x: 170, y: py, size: 32, weight: 'Regular', color: C.textSec, align: 'LEFT', width: 780 });
    py += 80;
  });
  slideLabel(frame, 2, 6);
}

function slide1_solution(frame) {
  addGradientBg(frame, [[0, { r: 0.118, g: 0.106, b: 0.302 }], [0.5, C.bg], [1, { r: 0.059, g: 0.161, b: 0.125 }]]);
  addPhotoPlaceholder(frame, 'Group of friends having fun at outdoor party', 0, W, H, C.green);
  addOverlay(frame, 0.9);
  addText(frame, 'SpyShot', { y: 240, size: 88, weight: 'Black', color: C.primary });
  addText(frame, 'The party game that plays itself', { y: 360, size: 36, weight: 'Semi Bold' });
  const features = [
    ['🎯', 'Random Challenges', '120+ tasks from chill to extreme'],
    ['📸', 'Photo Proof', 'Capture every legendary moment'],
    ['🏆', 'Badges & Tiers', 'Bronze to Mythic — flex your rank'],
    ['🔥', 'Bold Mode', 'Risk it for 2x points'],
    ['👥', 'Social Feed', 'Relive the night with friends'],
  ];
  let fy = 500;
  features.forEach(([icon, title, desc]) => {
    addCard(frame, 80, fy, W - 160, 95, rgba(C.white, 0.04), rgba(C.white, 0.08));
    addText(frame, icon, { x: 110, y: fy + 28, size: 36, align: 'LEFT', width: 50 });
    addText(frame, title, { x: 180, y: fy + 20, size: 28, weight: 'Bold', align: 'LEFT', width: 600 });
    addText(frame, desc, { x: 180, y: fy + 56, size: 20, weight: 'Regular', color: C.textMuted, align: 'LEFT', width: 600 });
    fy += 115;
  });
  slideLabel(frame, 3, 6);
}

function slide1_howItWorks(frame) {
  addGradientBg(frame, [[0, C.dark], [1, { r: 0.059, g: 0.090, b: 0.165 }]]);
  addPhotoPlaceholder(frame, 'Friends at outdoor dinner/gathering', 0, W, H, C.blue);
  addOverlay(frame, 0.92);
  addText(frame, 'How SpyShot works', { y: 140, size: 52, weight: 'Extra Bold' });
  const steps = [
    ['Create a group', 'Invite friends or share a 4-digit room code'],
    ['Pick your vibe', 'Chill, Wild, or Extreme — you set the intensity'],
    ['The app picks who & what', 'Random player + challenge. Easy or Bold — your choice'],
    ['Complete & prove it', 'Snap a photo, beat the timer, earn badges'],
    ['Relive the night', 'Feed, reactions, leaderboard — see it all the next day'],
  ];
  let sy = 300;
  steps.forEach(([title, desc], i) => {
    addCircle(frame, 140, sy + 28, 34, C.primary);
    addText(frame, String(i + 1), { x: 120, y: sy + 10, size: 30, weight: 'Black', color: C.dark, align: 'CENTER', width: 40 });
    addText(frame, title, { x: 200, y: sy, size: 32, weight: 'Bold', align: 'LEFT', width: 700 });
    addText(frame, desc, { x: 200, y: sy + 40, size: 22, weight: 'Regular', color: C.textMuted, align: 'LEFT', width: 700 });
    sy += 115;
  });
  slideLabel(frame, 4, 6);
}

function slide1_socialProof(frame) {
  addGradientBg(frame, [[0, { r: 0.059, g: 0.161, b: 0.125 }], [0.5, C.bg], [1, { r: 0.118, g: 0.106, b: 0.302 }]]);
  addPhotoPlaceholder(frame, 'Friends laughing at outdoor party/BBQ', 0, W, H, C.green);
  addOverlay(frame, 0.7);
  addText(frame, '"', { y: 380, size: 140, weight: 'Black', color: C.primary });
  addText(frame, "We used SpyShot at our house party and it was genuinely the most fun we've had in months. Everyone was crying laughing.", { y: 560, size: 40, weight: 'Semi Bold' });
  addText(frame, '— @emma_w', { y: 900, size: 28, weight: 'Bold', color: C.primary });
  addText(frame, 'Gold tier badge holder', { y: 940, size: 22, color: rgba(C.white, 0.4) });
  const stats = [['120+', 'Challenges'], ['3', 'Intensities'], ['9', 'Badge Tiers']];
  stats.forEach(([num, label], i) => {
    const sx = 200 + i * 280;
    addText(frame, num, { x: sx - 60, y: 1100, size: 50, weight: 'Black', color: C.primary, align: 'CENTER', width: 120 });
    addText(frame, label, { x: sx - 80, y: 1165, size: 20, weight: 'Medium', color: rgba(C.white, 0.5), align: 'CENTER', width: 160 });
  });
  slideLabel(frame, 5, 6);
}

function slide1_cta(frame) {
  addGradientBg(frame, [[0, C.dark], [0.5, { r: 0.118, g: 0.106, b: 0.302 }], [1, C.dark]]);
  addPhotoPlaceholder(frame, 'Beer cheers outdoor close-up', 0, W, H, C.primary);
  addOverlay(frame, 0.8);
  addText(frame, 'SpyShot', { y: 600, size: 100, weight: 'Black', color: C.primary });
  addText(frame, 'Your next night out deserves to be legendary', { y: 750, size: 48, weight: 'Extra Bold' });
  addPill(frame, 'Download Free', (W - 340) / 2, 980, C.primary, C.dark, 34);
  addText(frame, 'Available on iOS & Android', { y: 1080, size: 24, color: rgba(C.white, 0.4) });
  slideLabel(frame, 6, 6);
}

// SLIDESHOW 2
function slide2_hook(frame) {
  addGradientBg(frame, [[0, C.bg], [1, C.dark]]);
  addPhotoPlaceholder(frame, 'Friends cheersing beers at outdoor gathering', 0, W, H, C.orange);
  addOverlay(frame, 0.65);
  addText(frame, '🔥', { y: 620, size: 100 });
  addText(frame, 'Every task has two versions', { y: 760, size: 66, weight: 'Black' });
  addText(frame, 'Do you play it safe... or go BOLD?', { y: 1020, size: 30, color: rgba(C.white, 0.55) });
  slideLabel(frame, 1, 5);
}

function slide2_easy(frame) {
  addGradientBg(frame, [[0, { r: 0.059, g: 0.161, b: 0.125 }], [1, C.bg]]);
  addPhotoPlaceholder(frame, 'Relaxed outdoor hangout with friends', 0, W, H, C.green);
  addOverlay(frame, 0.93);
  addText(frame, '✅ EASY MODE', { y: 280, size: 28, weight: 'Bold', color: C.green });
  addCard(frame, 80, 380, W - 160, 280, rgba(C.green, 0.06), rgba(C.green, 0.2));
  addText(frame, 'Stranger Selfie', { x: 130, y: 420, size: 44, weight: 'Extra Bold', align: 'LEFT', width: 780 });
  addText(frame, "Take a selfie with someone you don't know", { x: 130, y: 485, size: 30, weight: 'Regular', color: C.textSec, align: 'LEFT', width: 780 });
  addText(frame, '+1 point  ·  Standard badge progress', { x: 130, y: 570, size: 24, weight: 'Bold', color: C.green, align: 'LEFT', width: 780 });
  addPhotoPlaceholder(frame, 'Photo 1', 760, 260, 220, C.green, 100);
  addPhotoPlaceholder(frame, 'Photo 2', 760, 260, 220, C.green, 390);
  addPhotoPlaceholder(frame, 'Photo 3', 760, 260, 220, C.green, 680);
  addPill(frame, '🛡️ Safe & Fun', (W - 260) / 2, 1050, C.green, C.white, 28);
  slideLabel(frame, 2, 5);
}

function slide2_bold(frame) {
  addGradientBg(frame, [[0, { r: 0.176, g: 0.094, b: 0.063 }], [1, C.bg]]);
  addPhotoPlaceholder(frame, 'Energetic outdoor party group', 0, W, H, C.orange);
  addOverlay(frame, 0.92);
  addText(frame, '🔥🔥🔥', { y: 280, size: 70 });
  addText(frame, 'BOLD MODE', { y: 400, size: 28, weight: 'Bold', color: C.orange });
  addCard(frame, 80, 490, W - 160, 280, rgba(C.orange, 0.06), rgba(C.orange, 0.2));
  addText(frame, 'Stranger Selfie', { x: 130, y: 530, size: 44, weight: 'Extra Bold', align: 'LEFT', width: 780 });
  addText(frame, 'Take a selfie with THREE people you don\'t know', { x: 130, y: 595, size: 30, weight: 'Regular', color: C.textSec, align: 'LEFT', width: 780 });
  addText(frame, '+2 points  ·  2x badge progress', { x: 130, y: 680, size: 24, weight: 'Bold', color: C.orange, align: 'LEFT', width: 780 });
  addPill(frame, '⚡ 2X POINTS', (W - 280) / 2, 860, C.orange, C.white, 32);
  slideLabel(frame, 3, 5);
}

function slide2_vs(frame) {
  // Left half - Easy
  const leftBg = figma.createRectangle();
  leftBg.resize(W / 2, H);
  leftBg.fills = [solidFill(C.green)];
  frame.appendChild(leftBg);
  addPhotoPlaceholder(frame, 'Chill hangout photo', 0, W / 2, H, C.green, 0);
  const leftOv = figma.createRectangle();
  leftOv.resize(W / 2, H);
  leftOv.fills = [solidFill(C.green, 0.7)];
  frame.appendChild(leftOv);
  addText(frame, 'Easy', { x: 0, y: 800, size: 56, weight: 'Black', align: 'CENTER', width: W / 2 });
  addText(frame, 'Chill vibes\nStandard points\nNo pressure', { x: 0, y: 890, size: 28, align: 'CENTER', width: W / 2 });

  // Right half - Bold
  const rightBg = figma.createRectangle();
  rightBg.x = W / 2;
  rightBg.resize(W / 2, H);
  rightBg.fills = [solidFill(C.orange)];
  frame.appendChild(rightBg);
  addPhotoPlaceholder(frame, 'Wild party photo', 0, W / 2, H, C.orange, W / 2);
  const rightOv = figma.createRectangle();
  rightOv.x = W / 2;
  rightOv.resize(W / 2, H);
  rightOv.fills = [solidFill(C.orange, 0.7)];
  frame.appendChild(rightOv);
  addText(frame, 'Bold', { x: W / 2, y: 800, size: 56, weight: 'Black', align: 'CENTER', width: W / 2 });
  addText(frame, 'Maximum chaos\nDouble points\nLegend status', { x: W / 2, y: 890, size: 28, align: 'CENTER', width: W / 2 });

  // VS badge
  addCircle(frame, W / 2, H / 2, 50, C.primary);
  addText(frame, 'VS', { x: W / 2 - 40, y: H / 2 - 20, size: 34, weight: 'Black', color: C.dark, align: 'CENTER', width: 80 });
  slideLabel(frame, 4, 5);
}

function slide2_cta(frame) {
  addGradientBg(frame, [[0, { r: 0.118, g: 0.106, b: 0.302 }], [0.5, C.bg], [1, { r: 0.059, g: 0.161, b: 0.125 }]]);
  addPhotoPlaceholder(frame, 'Beer cheers outdoor', 0, W, H, C.primary);
  addOverlay(frame, 0.8);
  addText(frame, 'SpyShot', { y: 680, size: 90, weight: 'Black', color: C.primary });
  addText(frame, 'How bold are you willing to go?', { y: 810, size: 50, weight: 'Extra Bold' });
  addPill(frame, 'Download Free', (W - 340) / 2, 980, C.primary, C.dark, 34);
  slideLabel(frame, 5, 5);
}

// SLIDESHOW 3
function slide3_hook(frame) {
  addGradientBg(frame, [[0, C.bg], [1, C.dark]]);
  addPhotoPlaceholder(frame, 'Group outdoor with drinks/beers', 0, W, H, C.primary);
  addOverlay(frame, 0.7);
  addText(frame, '😎  🔥  💀', { y: 640, size: 70 });
  addText(frame, 'Not every night is the same vibe', { y: 780, size: 62, weight: 'Black' });
  addText(frame, "That's why SpyShot has 3 intensity modes", { y: 1020, size: 28, color: rgba(C.white, 0.45) });
  slideLabel(frame, 1, 5);
}

function modeSlide(frame, emoji, name, desc, nameColor, descColor, borderColor, tasks, slideNum, bgPhoto) {
  addGradientBg(frame, [[0, C.dark], [1, C.bg]]);
  addPhotoPlaceholder(frame, bgPhoto, 0, W, H, borderColor);
  addOverlay(frame, 0.93);
  addText(frame, emoji, { y: 200, size: 90 });
  addText(frame, name, { y: 320, size: 66, weight: 'Black', color: nameColor });
  addText(frame, desc, { y: 410, size: 30, color: descColor });
  let ty = 510;
  tasks.forEach(t => {
    addCard(frame, 80, ty, W - 160, 65, rgba(borderColor, 0.05), rgba(borderColor, 0.15));
    addText(frame, t, { x: 110, y: ty + 16, size: 24, weight: 'Regular', align: 'LEFT', width: 820 });
    ty += 82;
  });
  slideLabel(frame, slideNum, 5);
  return ty;
}

function slide3_chill(frame) {
  const ty = modeSlide(frame, '😎', 'CHILL', 'Icebreakers & light fun', C.blue, { r: 0.576, g: 0.773, b: 0.988 }, C.blue, [
    '🎤  Sing the first line of your last song',
    '📱  Show your 7th camera roll photo',
    '🤝  Compliment everyone at the table',
    '🎭  Celebrity impression contest',
    '💬  Two truths and one lie',
  ], 2, 'Relaxed hangout with friends and beers');
  addPhotoPlaceholder(frame, 'Chill photo 1', ty + 20, 260, 180, C.blue, 100);
  addPhotoPlaceholder(frame, 'Chill photo 2', ty + 20, 260, 180, C.blue, 390);
  addPhotoPlaceholder(frame, 'Chill photo 3', ty + 20, 260, 180, C.blue, 680);
}

function slide3_wild(frame) {
  modeSlide(frame, '🔥', 'WILD', 'Classic party mode', C.orange, { r: 0.992, g: 0.729, b: 0.455 }, C.orange, [
    '💃  Challenge someone to a dance-off',
    '💍  Fake propose to a stranger',
    '🎸  30-second air guitar solo',
    '📸  Photobomb as many photos as possible',
    '🎵  Request a song — if it plays, everyone drinks',
  ], 3, 'Festival or outdoor party energy');
}

function slide3_extreme(frame) {
  const ty = modeSlide(frame, '💀', 'EXTREME', 'Late night chaos', C.pink, { r: 0.976, g: 0.659, b: 0.831 }, C.pink, [
    '🎤  Sing a duet with a complete stranger',
    '🏄  Get 3 people to crowd surf you',
    '🍋  Eat a lemon without making a face',
    '🎙️  Give a speech standing on a chair',
    '🔥  Full roast battle — group votes winner',
  ], 4, 'Intense crowd energy outdoor');
  addText(frame, '* Not for the faint of heart', { y: ty + 20, size: 24, weight: 'Semi Bold', color: C.pink });
}

function slide3_cta(frame) {
  addGradientBg(frame, [[0, C.bg], [1, C.dark]]);
  addPhotoPlaceholder(frame, 'Beers outdoor close-up', 0, W, H, C.primary);
  addOverlay(frame, 0.85);
  addText(frame, 'SpyShot', { y: 620, size: 80, weight: 'Black', color: C.primary });
  addText(frame, 'Pick your vibe. Start the game.', { y: 750, size: 48, weight: 'Extra Bold' });
  addPill(frame, 'Chill', W / 2 - 300, 900, rgba(C.blue, 0.2), C.blue, 26);
  addPill(frame, 'Wild', W / 2 - 60, 900, rgba(C.orange, 0.2), C.orange, 26);
  addPill(frame, 'Extreme', W / 2 + 160, 900, rgba(C.pink, 0.2), C.pink, 26);
  addPill(frame, 'Download Free', (W - 340) / 2, 1020, C.primary, C.dark, 34);
  slideLabel(frame, 5, 5);
}

// ===================================================================
// MAIN
// ===================================================================

async function main() {
  await loadFont();

  const page = figma.currentPage;
  const GAP = 120;
  let xOffset = 0;

  // Section labels
  const sections = [
    { title: 'Slideshow 1: What is SpyShot', slides: [slide1_hook, slide1_problem, slide1_solution, slide1_howItWorks, slide1_socialProof, slide1_cta] },
    { title: 'Slideshow 2: Bold or Easy', slides: [slide2_hook, slide2_easy, slide2_bold, slide2_vs, slide2_cta] },
    { title: 'Slideshow 3: Pick Your Vibe', slides: [slide3_hook, slide3_chill, slide3_wild, slide3_extreme, slide3_cta] },
  ];

  for (const section of sections) {
    // Section title
    const label = figma.createText();
    label.characters = section.title;
    label.fontSize = 48;
    label.fontName = { family: "Inter", style: "Bold" };
    label.fills = [solidFill(C.primary)];
    label.x = xOffset;
    label.y = -80;
    page.appendChild(label);

    for (let i = 0; i < section.slides.length; i++) {
      var frame = createSlideFrame(section.title + ' — Slide ' + (i + 1), xOffset, 0);
      page.appendChild(frame);
      section.slides[i](frame);
      xOffset += W + GAP;
    }
    xOffset += GAP * 2; // Extra gap between sections
  }

  // Zoom to fit
  figma.viewport.scrollAndZoomIntoView(page.children);
  figma.notify('✅ 16 SpyShot slides created!');
  figma.closePlugin();
}

main();
