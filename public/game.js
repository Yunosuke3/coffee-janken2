

import * as THREE from 'three';

// ---------- FamilyMart palette ----------
const COLOR = {
  FM_GREEN: 0x7FB539,
  FM_BLUE: 0x009BDC,
  CREAM: 0xFFFBEF,
  INK: 0x2A3B4A,
};

// Player accent (neckerchief) palette
const AVATAR_COLORS = [
  0xE57373, 0xF48FB1, 0xBA68C8, 0x9575CD,
  0x64B5F6, 0x4DD0E1, 0x81C784, 0xFFD54F,
  0xFFB74D, 0xA1887F,
];

// Per-character signature colors
const CHARACTER_PALETTE = {
  bear:   { body: 0xC19A6B, head: 0xD4B085, ear: 0xA98458, innerEar: 0x7B5A3A, muzzle: 0xF0D5A8, nose: 0x3A2A1A },
  rabbit: { body: 0xFFF4E0, head: 0xFFF9E8, ear: 0xFFF4E0, innerEar: 0xFFC2CF, nose: 0xFF9BB3 },
  cat:    { body: 0xB8B8C4, head: 0xCDCDD6, ear: 0xB8B8C4, innerEar: 0xFFC2CF, whisker: 0x6A6A78, nose: 0xFF9BB3 },
};

const CHOICE = { ROCK: 'rock', PAPER: 'paper', SCISSORS: 'scissors' };

// ---------- DOM helpers ----------
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// ---------- Three.js setup ----------
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = null;
scene.fog = new THREE.Fog(0xcfe9ff, 18, 45);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
camera.position.set(0, 5.8, 11);
camera.lookAt(0, 1.2, 0);

// ---------- Lighting ----------
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

const hemi = new THREE.HemisphereLight(0xcfe7ff, 0xe6f0d0, 0.55);
hemi.position.set(0, 10, 0);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff3d6, 1.15);
sun.position.set(6, 10, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -10;
sun.shadow.camera.right = 10;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 30;
sun.shadow.bias = -0.0005;
sun.shadow.radius = 4;
scene.add(sun);

// ---------- Ground (grass disc) ----------
const groundGroup = new THREE.Group();
scene.add(groundGroup);

const grassMat = new THREE.MeshStandardMaterial({ color: COLOR.FM_GREEN, roughness: 0.95 });
const ground = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.4, 64), grassMat);
ground.position.y = -0.2;
ground.receiveShadow = true;
groundGroup.add(ground);

const ringMat = new THREE.MeshStandardMaterial({ color: COLOR.FM_BLUE, roughness: 0.8 });
const ring = new THREE.Mesh(new THREE.CylinderGeometry(6.15, 6.15, 0.25, 64), ringMat);
ring.position.y = -0.35;
ring.receiveShadow = true;
groundGroup.add(ring);

const innerMat = new THREE.MeshStandardMaterial({ color: 0x96c94f, roughness: 0.95 });
const inner = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.405, 48), innerMat);
inner.position.y = -0.198;
inner.receiveShadow = true;
groundGroup.add(inner);

// Decorative flowers + tufts
function addDecor() {
  const flowerColors = [0xffffff, 0xffd0dc, 0xfff2b8, 0xc8e7ff];
  for (let i = 0; i < 18; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 3.2 + Math.random() * 2.5;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.04, 0.28, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a9624, roughness: 0.9 }),
    );
    stem.position.set(x, 0.14, z);
    stem.castShadow = true;
    groundGroup.add(stem);
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 10, 10),
      new THREE.MeshStandardMaterial({
        color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
        roughness: 0.6,
      }),
    );
    petal.position.set(x, 0.35, z);
    petal.scale.set(1, 0.65, 1);
    petal.castShadow = true;
    groundGroup.add(petal);
  }
  for (let i = 0; i < 40; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 1.0 + Math.random() * 4.8;
    const x = Math.cos(ang) * r;
    const z = Math.sin(ang) * r;
    const tuft = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.18, 5),
      new THREE.MeshStandardMaterial({ color: 0x6da42c, roughness: 0.95 }),
    );
    tuft.position.set(x, 0.1, z);
    tuft.rotation.y = Math.random() * Math.PI;
    groundGroup.add(tuft);
  }
}
addDecor();

// Floating clouds
const clouds = [];
function addClouds() {
  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0, transparent: true, opacity: 0.85 });
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    for (let j = 0; j < 3; j++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), cloudMat);
      s.position.set(j * 0.9 - 0.9, Math.random() * 0.2, 0);
      s.scale.set(1, 0.6, 1);
      g.add(s);
    }
    const ang = (i / 6) * Math.PI * 2;
    g.position.set(Math.cos(ang) * 15, 6 + Math.random() * 2, Math.sin(ang) * 15);
    g.userData.speed = 0.02 + Math.random() * 0.02;
    g.userData.radius = 15 + Math.random() * 3;
    g.userData.angle = ang;
    g.userData.yOffset = 6 + Math.random() * 2;
    scene.add(g);
    clouds.push(g);
  }
}
addClouds();

// =============================================================
// Avatar factory - 3 character species
// =============================================================
function createAvatar(accentColor, slot, character = 'bear') {
  const group = new THREE.Group();
  group.userData.character = character;
  group.userData.slot = slot;
  group.userData.targetScale = 0;
  group.scale.set(0.001, 0.001, 0.001);

  const palette = CHARACTER_PALETTE[character] || CHARACTER_PALETTE.bear;

  // --- Body (all characters share a capsule body) ---
  const bodyMat = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.6 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.6, 10, 24), bodyMat);
  body.position.y = 0.75;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  group.userData.body = body;

  // --- Head ---
  const headMat = new THREE.MeshStandardMaterial({ color: palette.head, roughness: 0.6 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 28, 28), headMat);
  head.position.y = 1.65;
  head.castShadow = true;
  head.scale.set(1, 0.95, 1);
  group.add(head);
  group.userData.head = head;

  // --- Eyes (all) ---
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222833 });
  const eyeGeo = new THREE.SphereGeometry(0.05, 12, 12);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.13, 1.68, 0.36);
  eyeL.scale.set(1, 1.2, 0.6);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.13, 1.68, 0.36);
  eyeR.scale.set(1, 1.2, 0.6);
  group.add(eyeL, eyeR);

  // --- Cheek blush (all) ---
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xffb8b8, transparent: true, opacity: 0.75 });
  const cheekGeo = new THREE.SphereGeometry(0.07, 10, 10);
  const cL = new THREE.Mesh(cheekGeo, cheekMat);
  cL.position.set(-0.24, 1.6, 0.32);
  cL.scale.set(1, 0.5, 0.3);
  const cR = new THREE.Mesh(cheekGeo, cheekMat);
  cR.position.set(0.24, 1.6, 0.32);
  cR.scale.set(1, 0.5, 0.3);
  group.add(cL, cR);

  // --- Species-specific parts ---
  if (character === 'bear') {
    // Small rounded ears on top-sides
    const earMat = new THREE.MeshStandardMaterial({ color: palette.ear, roughness: 0.7 });
    const innerEarMat = new THREE.MeshStandardMaterial({ color: palette.innerEar, roughness: 0.7 });
    const earGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const innerGeo = new THREE.SphereGeometry(0.07, 12, 12);
    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(earGeo, earMat);
      ear.position.set(side * 0.28, 1.98, 0.03);
      ear.castShadow = true;
      group.add(ear);
      const inner = new THREE.Mesh(innerGeo, innerEarMat);
      inner.position.set(side * 0.28, 1.98, 0.1);
      group.add(inner);
    });
    // Muzzle
    const muzzleMat = new THREE.MeshStandardMaterial({ color: palette.muzzle, roughness: 0.6 });
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 16), muzzleMat);
    muzzle.position.set(0, 1.55, 0.38);
    muzzle.scale.set(1, 0.7, 0.6);
    group.add(muzzle);
    // Nose
    const noseMat = new THREE.MeshStandardMaterial({ color: palette.nose, roughness: 0.4 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), noseMat);
    nose.position.set(0, 1.58, 0.48);
    nose.scale.set(1.4, 1, 0.8);
    group.add(nose);

  } else if (character === 'rabbit') {
    // Long upright ears
    const earMat = new THREE.MeshStandardMaterial({ color: palette.ear, roughness: 0.65 });
    const innerEarMat = new THREE.MeshStandardMaterial({ color: palette.innerEar, roughness: 0.6 });
    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.55, 8, 16), earMat);
      ear.position.set(side * 0.18, 2.35, 0);
      ear.rotation.z = side * 0.08;
      ear.castShadow = true;
      group.add(ear);
      const innerEar = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.4, 8, 12), innerEarMat);
      innerEar.position.set(side * 0.18, 2.33, 0.06);
      innerEar.rotation.z = side * 0.08;
      group.add(innerEar);
    });
    // Small nose (pink)
    const noseMat = new THREE.MeshStandardMaterial({ color: palette.nose, roughness: 0.4 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), noseMat);
    nose.position.set(0, 1.58, 0.42);
    nose.scale.set(1.2, 1, 0.7);
    group.add(nose);
    // Small mouth hint
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0x8b7a6b });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 12, Math.PI), mouthMat);
    mouth.position.set(0, 1.53, 0.4);
    mouth.rotation.x = Math.PI / 2;
    group.add(mouth);

  } else if (character === 'cat') {
    // Triangular pointy ears
    const earMat = new THREE.MeshStandardMaterial({ color: palette.ear, roughness: 0.65 });
    const innerEarMat = new THREE.MeshStandardMaterial({ color: palette.innerEar, roughness: 0.6 });
    [-1, 1].forEach(side => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 8), earMat);
      ear.position.set(side * 0.24, 2.05, 0);
      ear.rotation.z = side * -0.2;
      ear.castShadow = true;
      group.add(ear);
      const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.2, 8), innerEarMat);
      innerEar.position.set(side * 0.24, 2.02, 0.04);
      innerEar.rotation.z = side * -0.2;
      group.add(innerEar);
    });
    // Nose
    const noseMat = new THREE.MeshStandardMaterial({ color: palette.nose, roughness: 0.4 });
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), noseMat);
    nose.position.set(0, 1.58, 0.42);
    nose.scale.set(1.2, 0.8, 0.7);
    group.add(nose);
    // Whiskers
    const whiskerMat = new THREE.MeshBasicMaterial({ color: palette.whisker });
    const whiskerGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.3, 4);
    [-1, 1].forEach(side => {
      for (let i = 0; i < 3; i++) {
        const w = new THREE.Mesh(whiskerGeo, whiskerMat);
        w.position.set(side * 0.3, 1.56 + (i - 1) * 0.035, 0.36);
        w.rotation.z = Math.PI / 2;
        w.rotation.y = side * (-0.05 + (i - 1) * 0.08);
        group.add(w);
      }
    });
    // Tail - curved tube behind
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.9, -0.4),
      new THREE.Vector3(0.25, 1.05, -0.55),
      new THREE.Vector3(0.35, 1.35, -0.45),
      new THREE.Vector3(0.18, 1.55, -0.18),
    ]);
    const tailGeo = new THREE.TubeGeometry(curve, 20, 0.08, 10, false);
    const tailMat = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.65 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.castShadow = true;
    group.add(tail);
    // Tail tip (white tip)
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), tipMat);
    tip.position.set(0.18, 1.55, -0.18);
    group.add(tip);
  }

  // --- Neckerchief (player's unique color, around the neck) ---
  const neckMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6 });
  const neckerchief = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.1, 10, 24), neckMat);
  neckerchief.position.y = 1.22;
  neckerchief.rotation.x = Math.PI / 2 - 0.1;
  neckerchief.scale.set(1, 1, 0.7);
  group.add(neckerchief);
  // Knot
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), neckMat);
  knot.position.set(0, 1.2, 0.28);
  knot.scale.set(1, 0.9, 0.7);
  group.add(knot);

  // --- Hand display area ---
  const handGroup = new THREE.Group();
  handGroup.position.y = 3.0;
  handGroup.scale.set(0, 0, 0);
  group.add(handGroup);
  group.userData.handGroup = handGroup;

  group.userData.bobOffset = Math.random() * Math.PI * 2;
  return group;
}

// ---------- Hand model factory ----------
function createHandModel(kind) {
  const g = new THREE.Group();
  if (kind === CHOICE.ROCK) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x8d8d9a, roughness: 0.7, metalness: 0.1 });
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat);
    m.castShadow = true;
    g.add(m);
  } else if (kind === CHOICE.PAPER) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 1.1), mat);
    base.castShadow = true;
    base.rotation.x = 0.12;
    g.add(base);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xcfd4dd });
    for (let i = -2; i <= 2; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.005, 0.02), lineMat);
      line.position.set(0, 0.028, i * 0.18);
      line.rotation.x = 0.12;
      g.add(line);
    }
  } else if (kind === CHOICE.SCISSORS) {
    const mat = new THREE.MeshStandardMaterial({ color: 0xc0c5cf, roughness: 0.3, metalness: 0.7 });
    const handleMat = new THREE.MeshStandardMaterial({ color: COLOR.FM_BLUE, roughness: 0.5 });
    const bladeGeo = new THREE.ConeGeometry(0.08, 0.9, 10);
    const b1 = new THREE.Mesh(bladeGeo, mat);
    b1.position.set(0.16, 0.3, 0);
    b1.rotation.z = -0.25;
    b1.castShadow = true;
    const b2 = new THREE.Mesh(bladeGeo, mat);
    b2.position.set(-0.16, 0.3, 0);
    b2.rotation.z = 0.25;
    b2.castShadow = true;
    g.add(b1, b2);
    const ringGeo = new THREE.TorusGeometry(0.15, 0.05, 12, 24);
    const r1 = new THREE.Mesh(ringGeo, handleMat);
    r1.position.set(0.28, -0.25, 0);
    r1.rotation.y = Math.PI / 2;
    r1.castShadow = true;
    const r2 = new THREE.Mesh(ringGeo, handleMat);
    r2.position.set(-0.28, -0.25, 0);
    r2.rotation.y = Math.PI / 2;
    r2.castShadow = true;
    g.add(r1, r2);
  }
  return g;
}

function createMysteryBlock(slot) {
  const color = slot % 2 === 0 ? COLOR.FM_GREEN : COLOR.FM_BLUE;
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), mat);
  box.castShadow = true;
  g.add(box);
  const tex = makeQuestionTexture();
  const spriteMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  for (let side = 0; side < 2; side++) {
    const q = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), spriteMat);
    q.position.z = side === 0 ? 0.28 : -0.28;
    q.rotation.y = side === 0 ? 0 : Math.PI;
    g.add(q);
  }
  return g;
}
function makeQuestionTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 100px "M PLUS Rounded 1c", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 64, 72);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function createNameSprite(name) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const ctx = c.getContext('2d');
  const padding = 18;
  ctx.font = 'bold 56px "M PLUS Rounded 1c", sans-serif';
  const metrics = ctx.measureText(name);
  const textW = Math.min(460, metrics.width);
  const boxW = textW + padding * 2;
  const boxH = 80;
  const boxX = (512 - boxW) / 2;
  const boxY = (128 - boxH) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRect(ctx, boxX, boxY, boxW, boxH, 40);
  ctx.fill();
  ctx.fillStyle = '#2A3B4A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 256, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(2, 0.5, 1);
  return sprite;
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- Resize ----------
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// ---------- Avatars manager ----------
const playerAvatars = new Map();
let currentRoom = null;
let myId = null;
let selectedChoice = null;
let selectedCharacter = 'bear';
let cameraShakeTime = 0;

function ensureAvatar(player) {
  const existing = playerAvatars.get(player.id);
  if (existing && existing.userData.character === player.character) return existing;
  if (existing) {
    // Character changed (rare) - remove and recreate
    scene.remove(existing);
    playerAvatars.delete(player.id);
  }
  const color = new THREE.Color(AVATAR_COLORS[player.slot % AVATAR_COLORS.length]);
  const av = createAvatar(color, player.slot, player.character || 'bear');
  scene.add(av);
  const label = createNameSprite(player.name);
  label.position.y = 2.95;
  av.add(label);
  av.userData.label = label;
  av.userData.lastName = player.name;
  av.userData.targetScale = 1;
  playerAvatars.set(player.id, av);
  return av;
}

function layoutPlayers(players) {
  const n = players.length;
  const baseRadius = n <= 3 ? 2.2 : n <= 5 ? 2.8 : 3.2;
  players.forEach((p, i) => {
    const av = playerAvatars.get(p.id);
    if (!av) return;
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    av.userData.targetX = Math.cos(angle) * baseRadius;
    av.userData.targetZ = Math.sin(angle) * baseRadius;
    av.userData.facingAngle = Math.atan2(-av.userData.targetX, -av.userData.targetZ);
  });
}

function syncAvatarState(room) {
  const currentIds = new Set(room.players.map(p => p.id));
  for (const [id, av] of playerAvatars) {
    if (!currentIds.has(id)) {
      av.userData.targetScale = 0;
      av.userData.removing = true;
    }
  }
  room.players.forEach((p) => {
    const av = ensureAvatar(p);
    av.userData.alive = p.alive;

    if (av.userData.lastName !== p.name || av.userData.hostMarked !== p.isHost) {
      av.remove(av.userData.label);
      const display = p.isHost ? '👑 ' + p.name : p.name;
      const newLabel = createNameSprite(display);
      newLabel.position.y = 2.95;
      av.add(newLabel);
      av.userData.label = newLabel;
      av.userData.lastName = p.name;
      av.userData.hostMarked = p.isHost;
    }

    // Hand update
    const hg = av.userData.handGroup;
    const desired = p.choice ? `choice:${p.choice}` : (p.hasChosen ? 'mystery' : 'none');
    if (av.userData.handKind !== desired) {
      while (hg.children.length) hg.remove(hg.children[0]);
      if (p.choice) {
        hg.add(createHandModel(p.choice));
        av.userData.handKindIsChoice = true;
      } else if (p.hasChosen) {
        hg.add(createMysteryBlock(p.slot));
        av.userData.handKindIsChoice = false;
      }
      av.userData.handKind = desired;
      av.userData.handTargetScale = (p.choice || p.hasChosen) ? 1 : 0;
    }

    if (!p.alive) {
      av.userData.targetScale = 0.75;
      av.userData.deadTilt = true;
    } else {
      av.userData.targetScale = 1;
      av.userData.deadTilt = false;
    }
  });
  layoutPlayers(room.players);
}

// ---------- UI state ----------
function showToast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._id);
  showToast._id = setTimeout(() => t.classList.remove('show'), ms);
}

function enterHud(roomCode) {
  $('#home-screen').classList.add('hidden');
  $('#hud').classList.remove('hidden');
  $('#room-code').textContent = roomCode;
  const url = new URL(location.href);
  url.searchParams.set('room', roomCode);
  history.replaceState(null, '', url.toString());
}

function updateHud(room) {
  const isHost = room.hostId === myId;
  const phase = room.phase;
  const me = room.players.find(p => p.id === myId);

  const statusEl = $('#status-pill');
  const roundEl = $('#round-pill');
  const choicePanel = $('#choice-panel');
  const hostPanel = $('#host-panel');
  const finalePanel = $('#finale-panel');

  if (phase === 'playing') {
    roundEl.classList.remove('hidden');
    roundEl.textContent = `ROUND ${room.round}`;
  } else {
    roundEl.classList.add('hidden');
  }

  if (phase === 'lobby') {
    choicePanel.classList.add('hidden');
    finalePanel.classList.add('hidden');
    if (isHost) {
      hostPanel.classList.remove('hidden');
      $('#btn-start').disabled = room.players.length < 2;
    } else {
      hostPanel.classList.add('hidden');
    }
    statusEl.textContent = room.players.length < 2
      ? '他のプレイヤーの参加を待っています…'
      : (isHost ? '準備ができたらスタートを押してね' : 'ホストの開始を待っています…');
  } else if (phase === 'playing') {
    hostPanel.classList.add('hidden');
    finalePanel.classList.add('hidden');
    if (me && me.alive) {
      choicePanel.classList.remove('hidden');
      if (!me.hasChosen) {
        $$('.choice-btn').forEach(b => { b.classList.remove('selected'); b.disabled = false; });
        selectedChoice = null;
      } else {
        $$('.choice-btn').forEach(b => b.disabled = true);
      }
    } else {
      choicePanel.classList.add('hidden');
    }
    const aliveCount = room.players.filter(p => p.alive).length;
    const chosenCount = room.players.filter(p => p.alive && p.hasChosen).length;
    statusEl.textContent = me && me.alive
      ? (me.hasChosen ? `他のプレイヤーを待ってます… (${chosenCount}/${aliveCount})` : '手を選ぼう！')
      : `観戦中… 生き残り ${aliveCount}人`;
  } else if (phase === 'finished') {
    hostPanel.classList.add('hidden');
    choicePanel.classList.add('hidden');
    statusEl.textContent = '';
  }
}

function showResultBanner(kind, round, winChoice, loseChoice) {
  const b = $('#result-banner');
  b.classList.remove('hidden', 'tie', 'advance');
  b.classList.add(kind === 'tie' ? 'tie' : 'advance');
  if (kind === 'tie') {
    b.innerHTML = `🤝 あいこ！<br/><small style="font-size:14px;opacity:0.8">もう一回！</small>`;
  } else {
    const e = { rock:'✊', paper:'✋', scissors:'✌️' };
    b.innerHTML = `${e[winChoice]} の勝ち！<br/><small style="font-size:14px;opacity:0.8">${e[loseChoice]} の人が脱落…</small>`;
  }
  clearTimeout(showResultBanner._id);
  showResultBanner._id = setTimeout(() => b.classList.add('hidden'), 1900);
  cameraShakeTime = performance.now();
}

function showFinale(data) {
  $('#finale-panel').classList.remove('hidden');
  $('#loser-name').textContent = `${data.loserName} さん`;
  $('#btn-restart').disabled = currentRoom && currentRoom.hostId !== myId;
  $('#btn-restart').textContent = currentRoom && currentRoom.hostId !== myId
    ? 'ホストの操作待ち…' : 'もう一度';
}

// ---------- Socket.IO ----------
const socket = io();
socket.on('connect', () => { myId = socket.id; });
socket.on('room:update', (room) => { currentRoom = room; syncAvatarState(room); updateHud(room); });
socket.on('round:result', (r) => showResultBanner(r.kind, r.round, r.winChoice, r.loseChoice));
socket.on('game:over', (data) => { showFinale(data); spawnConfetti(); });
socket.on('disconnect', () => showToast('サーバーとの接続が切れました'));

// ---------- Input handlers ----------
$$('.character-card').forEach(card => {
  card.addEventListener('click', () => {
    $$('.character-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedCharacter = card.getAttribute('data-character');
  });
});

$('#btn-create').addEventListener('click', () => {
  const name = $('#name-input').value.trim();
  if (!name) return showToast('お名前を入力してください');
  socket.emit('room:create', { name, character: selectedCharacter }, (res) => {
    if (res && res.ok) enterHud(res.roomCode);
    else showToast('ルーム作成に失敗しました');
  });
});

$('#btn-join').addEventListener('click', () => {
  const name = $('#name-input').value.trim();
  const code = $('#code-input').value.trim().toUpperCase();
  if (!name) return showToast('お名前を入力してください');
  if (code.length !== 4) return showToast('参加コードは4桁です');
  socket.emit('room:join', { name, character: selectedCharacter, roomCode: code }, (res) => {
    if (res && res.ok) enterHud(res.roomCode);
    else showToast(res && res.error ? res.error : '参加できませんでした');
  });
});

$('#btn-copy').addEventListener('click', async () => {
  const code = $('#room-code').textContent;
  const url = `${location.origin}${location.pathname}?room=${code}`;
  try { await navigator.clipboard.writeText(url); showToast('共有URLをコピーしました ☕'); }
  catch { showToast(`URL: ${url}`); }
});

$('#btn-start').addEventListener('click', () => socket.emit('game:start'));
$('#btn-restart').addEventListener('click', () => {
  socket.emit('game:restart');
  $('#finale-panel').classList.add('hidden');
  clearConfetti();
});
$('#btn-leave').addEventListener('click', () => { location.href = location.pathname; });

$$('.choice-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const c = btn.getAttribute('data-choice');
    selectedChoice = c;
    $$('.choice-btn').forEach(b => b.classList.toggle('selected', b === btn));
    socket.emit('game:choose', { choice: c });
  });
});

(() => {
  const p = new URLSearchParams(location.search);
  const r = p.get('room');
  if (r) $('#code-input').value = r.toUpperCase();
})();

// ---------- Confetti ----------
function spawnConfetti() {
  const emojis = ['☕','🎉','🟢','🔵','✨','🥤'];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement('div');
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.cssText = `
      position: fixed; top: -30px; left: ${Math.random() * 100}vw;
      font-size: ${18 + Math.random() * 18}px;
      z-index: 40; pointer-events: none;
      animation: confetti-fall ${2.5 + Math.random() * 2}s linear ${Math.random()}s forwards;
    `;
    el.classList.add('confetti-piece');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  }
}
function clearConfetti() {
  document.querySelectorAll('.confetti-piece').forEach(e => e.remove());
}
(() => {
  const s = document.createElement('style');
  s.textContent = `@keyframes confetti-fall {
    0% { transform: translateY(0) rotate(0); opacity: 1; }
    100% { transform: translateY(110vh) rotate(720deg); opacity: 0.8; }
  }`;
  document.head.appendChild(s);
})();

// ---------- Animation loop ----------
const clock = new THREE.Clock();
function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const cx = Math.sin(t * 0.18) * 0.8;
  const cz = 11 + Math.cos(t * 0.15) * 0.3;
  let shakeX = 0, shakeY = 0;
  if (cameraShakeTime) {
    const elapsed = (performance.now() - cameraShakeTime) / 1000;
    if (elapsed < 0.5) {
      const s = Math.max(0, 0.5 - elapsed) * 0.15;
      shakeX = (Math.random() - 0.5) * s;
      shakeY = (Math.random() - 0.5) * s;
    } else { cameraShakeTime = 0; }
  }
  camera.position.x = cx + shakeX;
  camera.position.z = cz;
  camera.position.y = 5.8 + shakeY;
  camera.lookAt(0, 1.3, 0);

  for (const c of clouds) {
    c.userData.angle += c.userData.speed * dt;
    c.position.x = Math.cos(c.userData.angle) * c.userData.radius;
    c.position.z = Math.sin(c.userData.angle) * c.userData.radius;
    c.position.y = c.userData.yOffset + Math.sin(t * 0.4 + c.userData.angle) * 0.15;
  }

  for (const [id, av] of playerAvatars) {
    const ts = av.userData.targetScale ?? 1;
    const curS = av.scale.x;
    const newS = curS + (ts - curS) * Math.min(1, dt * 8);
    av.scale.set(newS, newS, newS);

    if (av.userData.removing && newS < 0.02) {
      scene.remove(av);
      playerAvatars.delete(id);
      continue;
    }

    const tx = av.userData.targetX ?? 0;
    const tz = av.userData.targetZ ?? 0;
    av.position.x += (tx - av.position.x) * Math.min(1, dt * 4);
    av.position.z += (tz - av.position.z) * Math.min(1, dt * 4);

    if (av.userData.facingAngle !== undefined) {
      const target = av.userData.facingAngle;
      av.rotation.y += (target - av.rotation.y) * Math.min(1, dt * 4);
    }

    const targetTilt = av.userData.deadTilt ? -0.5 : 0;
    av.rotation.z += (targetTilt - av.rotation.z) * Math.min(1, dt * 4);
    const targetY = av.userData.deadTilt ? -0.4 : 0;
    av.position.y += (targetY - av.position.y) * Math.min(1, dt * 4);

    if (!av.userData.deadTilt && av.userData.body) {
      const bob = Math.sin(t * 2 + av.userData.bobOffset) * 0.04;
      av.userData.body.position.y = 0.75 + bob;
      av.userData.head.position.y = 1.65 + bob * 0.6;
    }

    const hg = av.userData.handGroup;
    const hts = av.userData.handTargetScale ?? 0;
    const chs = hg.scale.x;
    const nhs = chs + (hts - chs) * Math.min(1, dt * 10);
    hg.scale.set(nhs, nhs, nhs);

    if (nhs > 0.05) {
      hg.rotation.y += dt * 1.2;
      hg.position.y = 3.0 + Math.sin(t * 3 + av.userData.bobOffset) * 0.12;
      hg.rotation.x = av.userData.handKindIsChoice
        ? Math.sin(t * 2) * 0.1
        : Math.sin(t * 3) * 0.15;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
