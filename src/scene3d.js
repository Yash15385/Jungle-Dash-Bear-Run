import * as THREE from 'three';

// -------------------------------------------------------------
// TRACK & GEOMETRY CONSTANTS (True 3D Parallel Coordinates)
// -------------------------------------------------------------
export const LANE_WIDTH = 2.4;
export const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH];
export const TRAIN_HEIGHT = 2.35;
export const TRAIN_LENGTH = 15.0;
export const RAMP_LENGTH = 5.0;

const roadStartZ = 6.0;
const farZ = -95.0;
const roadLength = roadStartZ - farZ;

// -------------------------------------------------------------
// THREE.JS SETUP
// -------------------------------------------------------------
const canvas = document.querySelector('#scene3d');
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x10281d, 32, 98);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 160);
camera.position.set(0, 3.4, 7.8);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.setClearColor(0x10281d, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// -------------------------------------------------------------
// LIGHTING & ENVIRONMENT
// -------------------------------------------------------------
scene.add(new THREE.HemisphereLight(0xe4ffda, 0x2e3d2a, 1.8));

const sun = new THREE.DirectionalLight(0xfff3d1, 2.6);
sun.position.set(-6, 18, 12);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 70;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
sun.shadow.bias = -0.0006;
scene.add(sun);

const ambientFill = new THREE.DirectionalLight(0x78b894, 0.9);
ambientFill.position.set(8, 6, -15);
scene.add(ambientFill);

// -------------------------------------------------------------
// SKY DOME & DISTANT JUNGLE CANOPY SILHOUETTE
// -------------------------------------------------------------
function makeSkyDome() {
  const skyGeo = new THREE.SphereGeometry(140, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const skyMat = new THREE.MeshBasicMaterial({
    color: 0x56a47a,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.position.y = -5;
  scene.add(sky);

  // Distant horizon tree ridge
  const ridgeGroup = new THREE.Group();
  for (let i = 0; i < 48; i++) {
    const angle = (i / 48) * Math.PI - Math.PI * 0.05;
    const r = 115;
    const x = Math.cos(angle) * r;
    const z = -Math.sin(angle) * r;
    const h = 18 + Math.sin(i * 1.7) * 8;
    const ridgeTree = new THREE.Mesh(
      new THREE.ConeGeometry(7 + (i % 3) * 2, h, 6),
      new THREE.MeshBasicMaterial({ color: 0x1d4a34 })
    );
    ridgeTree.position.set(x, h * 0.5 - 2, z);
    ridgeGroup.add(ridgeTree);
  }
  scene.add(ridgeGroup);
}
makeSkyDome();

// -------------------------------------------------------------
// REUSABLE MATERIALS
// -------------------------------------------------------------
const mat = (color, roughness = 0.85, metalness = 0.1, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });

const ballastMat = mat(0x27352c, 0.95);
const railMat = mat(0xc2c9cf, 0.25, 0.85);
const tieMat = mat(0x422d1c, 0.9);
const barrierMat = mat(0x94806a, 0.8);
const hazardMat = mat(0xd6ad3a, 0.5);

const trainRedMat = mat(0xd43f33, 0.4, 0.2);
const trainSilverMat = mat(0xb0b8be, 0.35, 0.6);
const trainDarkMat = mat(0x1e2428, 0.7);
const trainGlassMat = mat(0x204558, 0.15, 0.9);
const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfff6ad });
const rampMat = mat(0x828d96, 0.5, 0.5);

const hurdleStripeMat = mat(0xe8b82a, 0.4);
const hurdleDarkMat = mat(0x222222, 0.8);
const hurdleBeaconMat = new THREE.MeshBasicMaterial({ color: 0xffab00 });
const woodMat = mat(0x734825, 0.9);
const woodLightMat = mat(0xa87542, 0.85);

const coinMat = mat(0xffc107, 0.25, 0.85, { emissive: 0x6e4300, emissiveIntensity: 0.35 });
const coinRingMat = mat(0xffe082, 0.2, 0.7);
const goldBarMat = mat(0xffd54f, 0.2, 0.9, { emissive: 0xff8f00, emissiveIntensity: 0.28 });
const goldBarHighlightMat = mat(0xfff9c4, 0.15, 0.95);

// Sacred Jungle Precision Stone Materials
const gemMat = mat(0x00e676, 0.1, 0.95, { emissive: 0x00e676, emissiveIntensity: 0.85 });
const gemHaloMat = new THREE.MeshBasicMaterial({ color: 0x69f0ae, transparent: true, opacity: 0.45, side: THREE.DoubleSide });

// Talking Tom Gold Run - Thief Materials
const thiefFurMat = mat(0x37474f, 0.8);
const thiefSnoutMat = mat(0xf5f5f5, 0.85);
const thiefNoseMat = mat(0x111111, 0.9);
const thiefStripeDark = mat(0x1b1b1b, 0.85);
const thiefStripeLight = mat(0xeeeeee, 0.85);
const thiefMaskMat = mat(0x0a0a0a, 0.95);
const thiefEyeMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
const thiefSackMat = mat(0x8d6e63, 0.9);
const thiefRopeMat = mat(0xd7ccc8, 0.9);
const thiefBeanieMat = mat(0x263238, 0.85);

const magnetMat = mat(0xdd2c00, 0.3, 0.4);
const magnetTipMat = mat(0xcccccc, 0.2, 0.8);
const jetpackMat = mat(0xd84315, 0.3, 0.5);
const hoverboardGlowMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
const sneakerMat = mat(0xff6d00, 0.3, 0.3);
const multMat = mat(0x76ff03, 0.3, 0.5);

// -------------------------------------------------------------
// TRACK, RAILS, SLEEPERS & SCENERY
// -------------------------------------------------------------
const trackTies = [];
const sideScenery = [];

function buildTrackSystem() {
  const trackBedWidth = LANE_WIDTH * 3 + 2.2; // ~9.4 wide
  // Main ballast gravel ground
  const groundGeo = new THREE.PlaneGeometry(trackBedWidth, roadLength, 1, 1);
  const ground = new THREE.Mesh(groundGeo, ballastMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, (roadStartZ + farZ) / 2);
  ground.receiveShadow = true;
  scene.add(ground);

  // Outer grassy sides
  for (const side of [-1, 1]) {
    const grassGeo = new THREE.PlaneGeometry(35, roadLength);
    const grass = new THREE.Mesh(grassGeo, mat(0x194829, 0.95));
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(side * (trackBedWidth / 2 + 17.5), -0.05, (roadStartZ + farZ) / 2);
    grass.receiveShadow = true;
    scene.add(grass);

    // Trackside concrete curbs with safety lines
    const curbGeo = new THREE.BoxGeometry(0.3, 0.35, roadLength);
    const curb = new THREE.Mesh(curbGeo, barrierMat);
    curb.position.set(side * (trackBedWidth / 2 - 0.15), 0.15, (roadStartZ + farZ) / 2);
    curb.receiveShadow = true;
    curb.castShadow = true;
    scene.add(curb);
  }

  // Steel Rails: 2 per lane (6 rails total)
  const railGeo = new THREE.BoxGeometry(0.065, 0.09, roadLength);
  for (const lx of LANE_X) {
    for (const offset of [-0.62, 0.62]) {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(lx + offset, 0.08, (roadStartZ + farZ) / 2);
      rail.receiveShadow = true;
      scene.add(rail);
    }
  }

  // Wooden Sleepers (Ties) - pooled and scrolled
  const tieCount = Math.floor(roadLength / 1.35);
  const tieGeo = new THREE.BoxGeometry(trackBedWidth - 0.8, 0.07, 0.42);
  for (let i = 0; i < tieCount; i++) {
    const tie = new THREE.Mesh(tieGeo, tieMat);
    tie.receiveShadow = true;
    tie.userData.initialZ = roadStartZ - i * 1.35;
    tie.position.set(0, 0.03, tie.userData.initialZ);
    scene.add(tie);
    trackTies.push(tie);
  }

  // Side Scenery: Palms, streetlamps, and overhead gantries
  const sceneryCount = 22;
  for (let i = 0; i < sceneryCount; i++) {
    const z = roadStartZ - i * 5.0;
    // Left & right palm trees
    for (const side of [-1, 1]) {
      const tree = makeTreeGroup();
      tree.position.set(side * (trackBedWidth / 2 + 3.2 + (i % 3) * 1.8), 0, z + (i % 2) * 1.5);
      tree.userData.baseX = tree.position.x;
      tree.userData.offsetZ = z;
      scene.add(tree);
      sideScenery.push(tree);
    }

    // Overhead gantry arch every 28 units
    if (i % 6 === 0) {
      const gantry = makeGantryArch();
      gantry.position.set(0, 0, z);
      gantry.userData.offsetZ = z;
      scene.add(gantry);
      sideScenery.push(gantry);
    }
  }
}

function makeTreeGroup() {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 5.2, 7), woodMat);
  trunk.position.y = 2.6;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // Foliage cluster
  const leavesMat = mat(0x2e7845, 0.8);
  for (let j = 0; j < 4; j++) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1.6 - j * 0.25, 7, 5), leavesMat);
    ball.position.set((j % 2 ? -0.4 : 0.4) * (j > 1 ? 0.8 : 0), 4.6 + j * 0.75, 0);
    ball.castShadow = true;
    group.add(ball);
  }
  return group;
}

function makeGantryArch() {
  const group = new THREE.Group();
  const h = 4.8;
  const w = LANE_WIDTH * 3 + 1.6;
  // Two pillars
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.25, h, 0.25), mat(0x405058, 0.5, 0.7));
    pillar.position.set(side * (w / 2), h / 2, 0);
    pillar.castShadow = true;
    group.add(pillar);
  }
  // Cross girder
  const girder = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.32, 0.3), mat(0x405058, 0.5, 0.7));
  girder.position.set(0, h - 0.16, 0);
  girder.castShadow = true;
  group.add(girder);

  // Signal lights above each lane
  for (const lx of LANE_X) {
    const signalBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.48, 0.25), trainDarkMat);
    signalBox.position.set(lx, h - 0.45, 0);
    group.add(signalBox);

    const light = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x44ff66 }));
    light.position.set(lx, h - 0.45, 0.14);
    group.add(light);
  }
  return group;
}

buildTrackSystem();

// -------------------------------------------------------------
// 3D PLAYER CHARACTER (Jake / Subway Runner Mascot)
// -------------------------------------------------------------
export const playerMesh = new THREE.Group();

const tiltGroup = new THREE.Group();
playerMesh.add(tiltGroup);

// Shadow contact disc on ground
const shadowMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 0.42,
  depthWrite: false,
});
const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(0.68, 20), shadowMat);
shadowDisc.rotation.x = -Math.PI / 2;
shadowDisc.position.y = 0.02;
playerMesh.add(shadowDisc);

// Character Hierarchy
const bodyGroup = new THREE.Group();
tiltGroup.add(bodyGroup);

// Torso (Jacket / Hoodie)
const jacketMat = mat(0x1976d2, 0.4, 0.1); // Vibrant blue runner jacket
const shirtMat = mat(0xffffff, 0.5);
const skinMat = mat(0xf5ba8e, 0.7);
const capMat = mat(0xd32f2f, 0.4); // Red backwards cap
const pantsMat = mat(0x37474f, 0.6); // Dark denim jeans
const sneakerWhite = mat(0xffffff, 0.3);
const sneakerAccent = mat(0xff1744, 0.3);

// Torso mesh
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.82, 0.42), jacketMat);
torso.position.y = 1.08;
torso.castShadow = true;
torso.receiveShadow = true;
bodyGroup.add(torso);

// White hoodie undershirt
const undershirt = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 0.44), shirtMat);
undershirt.position.set(0, 1.15, 0.02);
bodyGroup.add(undershirt);

// Head & Cap
const headGroup = new THREE.Group();
headGroup.position.set(0, 1.68, 0);
bodyGroup.add(headGroup);

const head = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.5), skinMat);
head.castShadow = true;
headGroup.add(head);

// Backwards baseball cap
const cap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.24, 0.54), capMat);
cap.position.set(0, 0.16, -0.01);
headGroup.add(cap);
// Cap visor facing backwards
const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.32), capMat);
visor.position.set(0, 0.07, 0.38);
headGroup.add(visor);

// Hair / Goggles band
const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.52), mat(0x212121, 0.5));
goggles.position.set(0, 0.05, 0);
headGroup.add(goggles);

// Arms (Left & Right)
function makeArm(side) {
  const armPivot = new THREE.Group();
  armPivot.position.set(side * 0.46, 1.4, 0);

  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.24), jacketMat);
  sleeve.position.y = -0.21;
  sleeve.castShadow = true;
  armPivot.add(sleeve);

  const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.34, 0.2), skinMat);
  forearm.position.y = -0.48;
  forearm.castShadow = true;
  armPivot.add(forearm);

  return armPivot;
}
const leftArm = makeArm(-1);
const rightArm = makeArm(1);
bodyGroup.add(leftArm);
bodyGroup.add(rightArm);

// Legs (Left & Right)
function makeLeg(side) {
  const legPivot = new THREE.Group();
  legPivot.position.set(side * 0.2, 0.72, 0);

  const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.48, 0.28), pantsMat);
  thigh.position.y = -0.24;
  thigh.castShadow = true;
  legPivot.add(thigh);

  // Chunky Sneaker
  const shoe = new THREE.Group();
  shoe.position.set(0, -0.56, 0.05);

  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.48), sneakerWhite);
  sole.castShadow = true;
  shoe.add(sole);

  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.4), sneakerAccent);
  upper.position.y = 0.12;
  shoe.add(upper);

  legPivot.add(shoe);
  return legPivot;
}
const leftLeg = makeLeg(-1);
const rightLeg = makeLeg(1);
bodyGroup.add(leftLeg);
bodyGroup.add(rightLeg);

// -------------------------------------------------------------
// POWER-UP ATTACHMENTS ON PLAYER
// -------------------------------------------------------------
// 1. Hoverboard
const hoverboardMesh = new THREE.Group();
const boardDeck = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.09, 2.1), mat(0x00b0ff, 0.3, 0.7));
boardDeck.castShadow = true;
hoverboardMesh.add(boardDeck);

const boardTrim = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.05, 2.14), hoverboardGlowMat);
boardTrim.position.y = 0.02;
hoverboardMesh.add(boardTrim);

// Thruster pads under board
for (const z of [-0.65, 0.65]) {
  const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12), trainDarkMat);
  thruster.position.set(0, -0.06, z);
  hoverboardMesh.add(thruster);
}
hoverboardMesh.position.y = 0.12;
hoverboardMesh.visible = false;
bodyGroup.add(hoverboardMesh);

// 2. Jetpack with Procedural Exhaust Flames
const jetpackMesh = new THREE.Group();
const jetFlameOuterMat = new THREE.MeshBasicMaterial({ color: 0xff5722 });
const jetFlameInnerMat = new THREE.MeshBasicMaterial({ color: 0xffeb3b });
const jetpackFlames = [];

for (const side of [-0.22, 0.22]) {
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.65, 12), jetpackMat);
  tank.position.set(side, 1.15, 0.32);
  tank.castShadow = true;
  jetpackMesh.add(tank);

  const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 12), trainDarkMat);
  nozzle.rotation.x = Math.PI;
  nozzle.position.set(side, 0.76, 0.32);
  jetpackMesh.add(nozzle);

  // Outer orange plume
  const plumeOuter = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.65, 8), jetFlameOuterMat);
  plumeOuter.rotation.x = Math.PI;
  plumeOuter.position.set(side, 0.40, 0.32);
  jetpackMesh.add(plumeOuter);

  // Inner bright yellow plume
  const plumeInner = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.42, 8), jetFlameInnerMat);
  plumeInner.rotation.x = Math.PI;
  plumeInner.position.set(side, 0.52, 0.32);
  jetpackMesh.add(plumeInner);

  jetpackFlames.push({ outer: plumeOuter, inner: plumeInner });
}
jetpackMesh.visible = false;
bodyGroup.add(jetpackMesh);

// 3. Super Sneakers glow wings
const wingsMesh = new THREE.Group();
for (const side of [-0.34, 0.34]) {
  const wing = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 4), multMat);
  wing.position.set(side, 0.2, 0);
  wing.rotation.z = side > 0 ? 0.7 : -0.7;
  wingsMesh.add(wing);
}
wingsMesh.visible = false;
bodyGroup.add(wingsMesh);

// 4. Customization Skins
const SKINS = {
  jake: { jacket: 0x1976d2, cap: 0xd32f2f, pants: 0x37474f, sneaker: 0xff1744 },
  tricky: { jacket: 0xfbc02d, cap: 0xe91e63, pants: 0x00838f, sneaker: 0xffeb3b },
  shadow: { jacket: 0x212121, cap: 0xb71c1c, pants: 0x121212, sneaker: 0xff0055 },
};

const BOARDS = {
  blueWave: { deck: 0x00b0ff, glow: 0x00e5ff },
  starfire: { deck: 0xd50000, glow: 0xff6d00 },
  viper: { deck: 0x1b5e20, glow: 0x76ff03 },
};

export function setCustomization(characterId = 'jake', boardId = 'blueWave') {
  const char = SKINS[characterId] || SKINS.jake;
  jacketMat.color.setHex(char.jacket);
  capMat.color.setHex(char.cap);
  pantsMat.color.setHex(char.pants);
  sneakerAccent.color.setHex(char.sneaker);

  const board = BOARDS[boardId] || BOARDS.blueWave;
  boardDeck.material.color.setHex(board.deck);
  boardTrim.material.color.setHex(board.glow);
}

// 5. Magnet Aura Ring
const magnetAura = new THREE.Mesh(
  new THREE.TorusGeometry(0.95, 0.035, 8, 28),
  new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.75 })
);
magnetAura.rotation.x = Math.PI / 2;
magnetAura.position.y = 1.0;
magnetAura.visible = false;
bodyGroup.add(magnetAura);

// 6. Giant Headstart Rocket Boosters with Exhaust Plumes
const headstartMesh = new THREE.Group();
const headstartFlames = [];
for (const side of [-0.55, 0.55]) {
  const rocket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.4, 14), mat(0xd50000, 0.3, 0.6));
  rocket.position.set(side, 1.1, 0.1);
  rocket.rotation.x = 0.2;
  headstartMesh.add(rocket);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 14), mat(0xffd600, 0.3, 0.6));
  nose.position.set(side, 1.85, 0.1);
  headstartMesh.add(nose);

  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.85, 8), jetFlameOuterMat);
  flame.position.set(side, 0.25, 0.1);
  flame.rotation.x = Math.PI + 0.2;
  headstartMesh.add(flame);
  headstartFlames.push(flame);
}
headstartMesh.visible = false;
bodyGroup.add(headstartMesh);

scene.add(playerMesh);

// -------------------------------------------------------------
// 3D THIEF CHARACTER - TALKING TOM GOLD RUN (Roy the Jungle Bandit)
// -------------------------------------------------------------
export const thiefMesh = new THREE.Group();
const thiefTilt = new THREE.Group();
thiefMesh.add(thiefTilt);

const thiefShadow = new THREE.Mesh(new THREE.CircleGeometry(0.65, 18), shadowMat);
thiefShadow.rotation.x = -Math.PI / 2;
thiefShadow.position.y = 0.02;
thiefMesh.add(thiefShadow);

const thiefBodyGroup = new THREE.Group();
thiefTilt.add(thiefBodyGroup);

// Torso: Black & white striped bandit jumper
const thiefTorso = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.76, 0.38), thiefStripeDark);
thiefTorso.position.y = 1.05;
thiefTorso.castShadow = true;
thiefBodyGroup.add(thiefTorso);

// White stripes on sweater
for (const sy of [0.88, 1.05, 1.22]) {
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.07, 0.39), thiefStripeLight);
  stripe.position.set(0, sy, 0);
  thiefBodyGroup.add(stripe);
}

// Belt & gold buckle
const thiefBelt = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.39), mat(0x111111, 0.9));
thiefBelt.position.set(0, 0.74, 0);
thiefBodyGroup.add(thiefBelt);
const thiefBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.40), coinMat);
thiefBuckle.position.set(0, 0.74, 0);
thiefBodyGroup.add(thiefBuckle);

// Head & Bandit Mask
const thiefHeadGroup = new THREE.Group();
thiefHeadGroup.position.set(0, 1.62, 0);
thiefBodyGroup.add(thiefHeadGroup);

// Bandit head base (raccoon grey fur)
const thiefHead = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.48, 0.46), thiefFurMat);
thiefHead.castShadow = true;
thiefHeadGroup.add(thiefHead);

// Beanie cap
const thiefBeanie = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.22, 0.49), thiefBeanieMat);
thiefBeanie.position.set(0, 0.18, 0);
thiefHeadGroup.add(thiefBeanie);

// Bandit ears (pointy raccoon ears)
for (const side of [-1, 1]) {
  const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 4), thiefFurMat);
  ear.position.set(side * 0.20, 0.30, 0);
  ear.rotation.z = side * -0.3;
  thiefHeadGroup.add(ear);

  const innerEar = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.15, 4), mat(0xffccbc, 0.8));
  innerEar.position.set(side * 0.20, 0.30, -0.02);
  innerEar.rotation.z = side * -0.3;
  thiefHeadGroup.add(innerEar);
}

// Snout (white)
const thiefSnout = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.18), thiefSnoutMat);
thiefSnout.position.set(0, -0.09, -0.27);
thiefHeadGroup.add(thiefSnout);

// Black nose
const thiefNose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.08), thiefNoseMat);
thiefNose.position.set(0, -0.06, -0.36);
thiefHeadGroup.add(thiefNose);

// Black bandit domino mask around eyes
const thiefMask = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.14, 0.12), thiefMaskMat);
thiefMask.position.set(0, 0.03, -0.23);
thiefHeadGroup.add(thiefMask);

// Sly yellow eyes on the mask
for (const side of [-1, 1]) {
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.02), thiefEyeMat);
  eye.position.set(side * 0.13, 0.03, -0.29);
  thiefHeadGroup.add(eye);
}

// Bulging Loot Sack on his back!
const thiefLootSack = new THREE.Group();
thiefLootSack.position.set(0.14, 1.05, 0.32);
const sackBody = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 1), thiefSackMat);
sackBody.scale.set(1.0, 1.25, 0.95);
sackBody.castShadow = true;
thiefLootSack.add(sackBody);

// Tied rope neck
const sackRope = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 12), thiefRopeMat);
sackRope.rotation.x = Math.PI / 2;
sackRope.position.y = 0.40;
thiefLootSack.add(sackRope);

// Spilling gold bars poking out top of sack
const sackGold1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.3), goldBarMat);
sackGold1.position.set(-0.05, 0.46, -0.04);
sackGold1.rotation.set(0.3, 0.4, 0.2);
thiefLootSack.add(sackGold1);

const sackGold2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.24), coinMat);
sackGold2.position.set(0.07, 0.48, 0.04);
sackGold2.rotation.set(-0.2, -0.3, -0.2);
thiefLootSack.add(sackGold2);

// THE SACRED JUNGLE PRECISION STONE mounted atop the loot sack!
const thiefPrecisionGem = new THREE.Group();
thiefPrecisionGem.position.set(0, 0.65, 0);

const gemDiamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), gemMat);
gemDiamond.castShadow = true;
thiefPrecisionGem.add(gemDiamond);

const gemRingMesh = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 6, 16), gemHaloMat);
gemRingMesh.rotation.x = Math.PI / 3;
thiefPrecisionGem.add(gemRingMesh);

thiefLootSack.add(thiefPrecisionGem);
thiefBodyGroup.add(thiefLootSack);

// Striped Raccoon Tail!
const thiefTail = new THREE.Group();
thiefTail.position.set(0, 0.70, 0.20);
for (let i = 0; i < 4; i++) {
  const tailSeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.13, 0.18),
    i % 2 === 0 ? thiefStripeDark : thiefStripeLight
  );
  tailSeg.position.set(0, -i * 0.07, i * 0.15);
  tailSeg.rotation.x = 0.42;
  thiefTail.add(tailSeg);
}
thiefBodyGroup.add(thiefTail);

// Thief Arms
function makeThiefArm(side) {
  const arm = new THREE.Group();
  arm.position.set(side * 0.42, 1.35, 0);
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.2), thiefStripeDark);
  sleeve.position.y = -0.17;
  arm.add(sleeve);
  const glove = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.18), mat(0x111111, 0.9));
  glove.position.y = -0.40;
  arm.add(glove);
  return arm;
}
const thiefLeftArm = makeThiefArm(-1);
const thiefRightArm = makeThiefArm(1);
thiefBodyGroup.add(thiefLeftArm);
thiefBodyGroup.add(thiefRightArm);

// Thief Legs
function makeThiefLeg(side) {
  const leg = new THREE.Group();
  leg.position.set(side * 0.18, 0.68, 0);
  const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.24), mat(0x212121, 0.7));
  thigh.position.y = -0.22;
  leg.add(thigh);
  const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.36), mat(0x111111, 0.8));
  boot.position.set(0, -0.50, -0.04);
  leg.add(boot);
  return leg;
}
const thiefLeftLeg = makeThiefLeg(-1);
const thiefRightLeg = makeThiefLeg(1);
thiefBodyGroup.add(thiefLeftLeg);
thiefBodyGroup.add(thiefRightLeg);

scene.add(thiefMesh);

// -------------------------------------------------------------
// 3D HIGH-PERFORMANCE ZERO-ALLOCATION PARTICLE POOL
// -------------------------------------------------------------
const MAX_PARTICLES = 64;
const particleGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
const particleGroup = new THREE.Group();
scene.add(particleGroup);

const PARTICLE_MATERIALS = {
  gold: new THREE.MeshBasicMaterial({ color: 0xffd54f }),
  fire: new THREE.MeshBasicMaterial({ color: 0xff5722 }),
  yellow: new THREE.MeshBasicMaterial({ color: 0xffeb3b }),
  cyan: new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
  dust: new THREE.MeshBasicMaterial({ color: 0x8d6e63 }),
  smoke: new THREE.MeshBasicMaterial({ color: 0xd7ccc8 }),
  white: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  purple: new THREE.MeshBasicMaterial({ color: 0xab47bc }),
  green: new THREE.MeshBasicMaterial({ color: 0x76ff03 }),
};

const particlePool = [];
for (let i = 0; i < MAX_PARTICLES; i++) {
  const mesh = new THREE.Mesh(particleGeo, PARTICLE_MATERIALS.gold);
  mesh.visible = false;
  particleGroup.add(mesh);
  particlePool.push({
    mesh,
    vx: 0,
    vy: 0,
    vz: 0,
    life: 0,
    maxLife: 0.5,
  });
}
let poolCursor = 0;

export function spawnParticles(x, y, z, color = 0xffe082, count = 8, speed = 3.5) {
  let pMat = PARTICLE_MATERIALS.gold;
  if (color === 0x00e5ff) pMat = PARTICLE_MATERIALS.cyan;
  else if (color === 0xff5722 || color === 0xff3d00 || color === 0xd50000 || color === 0xff1744) pMat = PARTICLE_MATERIALS.fire;
  else if (color === 0xffeb3b || color === 0xffd600) pMat = PARTICLE_MATERIALS.yellow;
  else if (color === 0x8d6e63) pMat = PARTICLE_MATERIALS.dust;
  else if (color === 0xd7ccc8) pMat = PARTICLE_MATERIALS.smoke;
  else if (color === 0xffffff || color === 0xcccccc) pMat = PARTICLE_MATERIALS.white;
  else if (color === 0xab47bc) pMat = PARTICLE_MATERIALS.purple;
  else if (color === 0x76ff03) pMat = PARTICLE_MATERIALS.green;

  const actualCount = Math.min(count, 12);
  for (let i = 0; i < actualCount; i++) {
    const p = particlePool[poolCursor];
    poolCursor = (poolCursor + 1) % MAX_PARTICLES;

    p.mesh.material = pMat;
    p.mesh.position.set(x, y, z);
    p.mesh.scale.set(1, 1, 1);
    p.mesh.visible = true;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const s = (0.4 + Math.random() * 0.6) * speed;
    p.vx = Math.sin(phi) * Math.cos(theta) * s;
    p.vy = Math.cos(phi) * s + 0.8;
    p.vz = Math.sin(phi) * Math.sin(theta) * s;
    p.maxLife = 0.35 + Math.random() * 0.2;
    p.life = p.maxLife;
  }
}

function updateParticles(dt) {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = particlePool[i];
    if (p.life <= 0) continue;

    p.life -= dt;
    if (p.life <= 0) {
      p.mesh.visible = false;
      continue;
    }

    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.vy -= 9.8 * dt; // Gravity

    const scale = Math.max(0.01, p.life / p.maxLife);
    p.mesh.scale.set(scale, scale, scale);
  }
}

// -------------------------------------------------------------
// 3D OBSTACLES & TRAIN CONSTRUCTORS
// -------------------------------------------------------------
function addMesh(group, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

// SUBWAY TRAIN (Parked or Moving, with walkable roof & optional ramp)
export function makeTrain(hasRamp = false, isMoving = false) {
  const group = new THREE.Group();
  const width = 2.15;
  const height = TRAIN_HEIGHT;
  const length = TRAIN_LENGTH;

  // Main Carriage Body
  const bodyGeo = new THREE.BoxGeometry(width, height - 0.35, length);
  const body = addMesh(group, bodyGeo, isMoving ? trainRedMat : trainSilverMat, [0, height / 2 + 0.15, 0]);

  // Red accent livery stripe
  addMesh(group, new THREE.BoxGeometry(width + 0.04, 0.4, length + 0.02), trainRedMat, [0, 1.15, 0]);

  // Dark Roof with Walkway Ribs
  addMesh(group, new THREE.BoxGeometry(width - 0.1, 0.15, length), trainDarkMat, [0, height + 0.05, 0]);
  for (let i = -5; i <= 5; i += 2) {
    addMesh(group, new THREE.BoxGeometry(1.2, 0.22, 1.4), mat(0x455a64, 0.6), [0, height + 0.18, i]);
  }

  // Front Cab & Windshield (at z = length / 2)
  const cabZ = length / 2;
  addMesh(group, new THREE.BoxGeometry(width - 0.3, 0.7, 0.1), trainGlassMat, [0, 1.7, cabZ + 0.02]);
  // Grill
  addMesh(group, new THREE.BoxGeometry(1.4, 0.45, 0.12), trainDarkMat, [0, 0.65, cabZ + 0.02]);

  // Dual Headlights
  for (const side of [-0.68, 0.68]) {
    addMesh(group, new THREE.BoxGeometry(0.24, 0.24, 0.15), headlightMat, [side, 1.05, cabZ + 0.04]);
  }

  // Windows along both sides
  const winGeo = new THREE.BoxGeometry(0.06, 0.55, 1.1);
  for (let z = -cabZ + 2; z <= cabZ - 2; z += 2.2) {
    for (const side of [-1, 1]) {
      addMesh(group, winGeo, trainGlassMat, [side * (width / 2 + 0.01), 1.6, z]);
    }
  }

  // Wheels / Bogies
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 14);
  for (const bz of [-cabZ + 2.2, cabZ - 2.2]) {
    for (const side of [-1, 1]) {
      const wheel = addMesh(group, wheelGeo, trainDarkMat, [side * 0.95, 0.28, bz], [0, 0, Math.PI / 2]);
      wheel.userData.trainWheel = true;
    }
  }

  // Incline Ramp leading to the roof!
  if (hasRamp) {
    const rampLength = RAMP_LENGTH;
    const rampAngle = Math.atan2(height, rampLength);
    const rampHypotenuse = Math.hypot(height, rampLength);
    const rampGeo = new THREE.BoxGeometry(width - 0.1, 0.14, rampHypotenuse);
    const rampMesh = addMesh(group, rampGeo, rampMat, [0, height * 0.5, cabZ + rampLength * 0.5], [rampAngle, 0, 0]);
    // Diamond plate side guide rails
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.BoxGeometry(0.09, 0.32, rampHypotenuse), hazardMat, [
        side * (width * 0.5 - 0.08),
        height * 0.5 + 0.16,
        cabZ + rampLength * 0.5,
      ], [rampAngle, 0, 0]);
    }
  }

  group.userData.hasRamp = hasRamp;
  group.userData.isTrain = true;
  group.userData.isMoving = isMoving;
  group.userData.length = length;
  return group;
}

// LOW HURDLE (Jump over)
function makeHurdle() {
  const group = new THREE.Group();
  const w = 2.15;
  const h = 0.82;
  // Two hazard posts with feet & A-frame braces
  for (const side of [-1, 1]) {
    const px = side * (w / 2 - 0.1);
    // Vertical post
    addMesh(group, new THREE.BoxGeometry(0.16, h, 0.16), hurdleDarkMat, [px, h / 2, 0]);
    // Foot pad
    addMesh(group, new THREE.BoxGeometry(0.38, 0.08, 0.38), hurdleDarkMat, [px, 0.04, 0]);
    // Diagonal A-frame braces
    for (const fz of [-0.22, 0.22]) {
      addMesh(group, new THREE.BoxGeometry(0.08, 0.38, 0.08), hurdleDarkMat, [
        px,
        0.18,
        fz,
      ], [fz > 0 ? 0.6 : -0.6, 0, 0]);
    }
    // Flashing amber warning beacon on top of each post
    const beacon = addMesh(group, new THREE.CylinderGeometry(0.08, 0.1, 0.13, 8), hurdleBeaconMat, [px, h + 0.07, 0]);
    beacon.userData.isHurdleBeacon = true;
  }
  // Crossbar main yellow backing board
  addMesh(group, new THREE.BoxGeometry(w, 0.26, 0.11), hurdleStripeMat, [0, h - 0.14, 0]);
  // Real 3D slanted black hazard chevrons
  for (let x = -0.8; x <= 0.8; x += 0.36) {
    const chevron = addMesh(group, new THREE.BoxGeometry(0.11, 0.28, 0.12), hurdleDarkMat, [x, h - 0.14, 0]);
    chevron.rotation.z = 0.45;
  }
  return group;
}

// HIGH OVERPASS (Slide under)
function makeHighBarrier() {
  const group = new THREE.Group();
  const w = 2.3;
  const h = 2.45;
  const clearance = 1.35;
  for (const side of [-1, 1]) {
    addMesh(group, new THREE.BoxGeometry(0.22, h, 0.22), woodMat, [side * (w / 2), h / 2, 0]);
  }
  // Overhead beam
  addMesh(group, new THREE.BoxGeometry(w + 0.3, 0.85, 0.25), woodLightMat, [0, h - 0.42, 0]);
  // Warning sign in center
  addMesh(group, new THREE.BoxGeometry(1.2, 0.4, 0.3), hurdleStripeMat, [0, clearance + 0.35, 0]);
  return group;
}

// ROADBLOCK CRATES (Must dodge)
function makeRoadblock() {
  const group = new THREE.Group();
  const crateGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
  // Stack of 3 crates blocking the lane
  addMesh(group, crateGeo, woodMat, [-0.48, 0.54, 0]);
  addMesh(group, crateGeo, woodLightMat, [0.48, 0.54, 0]);
  addMesh(group, crateGeo, woodMat, [0, 1.58, 0]);
  return group;
}

// TALKING TOM GOLD RUN - GOLD BAR BULLION INGOT
const goldBarGeo = new THREE.BoxGeometry(0.48, 0.16, 0.26);
const goldTopGeo = new THREE.BoxGeometry(0.40, 0.04, 0.20);
const goldStampGeo = new THREE.BoxGeometry(0.22, 0.02, 0.10);

function makeCoin() {
  const group = new THREE.Group();
  addMesh(group, goldBarGeo, goldBarMat, [0, 0.85, 0]);
  addMesh(group, goldTopGeo, goldBarHighlightMat, [0, 0.94, 0]);
  addMesh(group, goldStampGeo, coinRingMat, [0, 0.965, 0]);
  return group;
}

// THE SACRED JUNGLE PRECISION STONE COLLECTIBLE
const gemOctaGeo = new THREE.OctahedronGeometry(0.36, 0);
const gemTorusGeo = new THREE.TorusGeometry(0.5, 0.025, 6, 18);
const gemSparkleGeo = new THREE.OctahedronGeometry(0.14, 0);

function makeSacredGem() {
  const group = new THREE.Group();
  addMesh(group, gemOctaGeo, gemMat, [0, 1.0, 0]);
  const ring = addMesh(group, gemTorusGeo, gemHaloMat, [0, 1.0, 0], [Math.PI / 4, 0, 0]);
  ring.userData.isGemRing = true;
  addMesh(group, gemSparkleGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), [0, 1.0, 0]);
  group.userData.isSacredGem = true;
  return group;
}

// -------------------------------------------------------------
// 3D POWER-UP COLLECTIBLES
// -------------------------------------------------------------
function makeMagnetPickup() {
  const group = new THREE.Group();
  const horseshoe = new THREE.Group();
  const leftPole = addMesh(horseshoe, new THREE.BoxGeometry(0.18, 0.6, 0.18), magnetMat, [-0.26, 0.85, 0]);
  const rightPole = addMesh(horseshoe, new THREE.BoxGeometry(0.18, 0.6, 0.18), magnetMat, [0.26, 0.85, 0]);
  const arch = addMesh(horseshoe, new THREE.BoxGeometry(0.7, 0.18, 0.18), magnetMat, [0, 1.15, 0]);
  // Silver tips
  addMesh(horseshoe, new THREE.BoxGeometry(0.2, 0.16, 0.2), magnetTipMat, [-0.26, 0.55, 0]);
  addMesh(horseshoe, new THREE.BoxGeometry(0.2, 0.16, 0.2), magnetTipMat, [0.26, 0.55, 0]);
  group.add(horseshoe);
  return group;
}

function makeHoverboardPickup() {
  const group = new THREE.Group();
  const board = addMesh(group, new THREE.BoxGeometry(0.55, 0.08, 1.5), mat(0x00e5ff, 0.2, 0.8), [0, 0.85, 0]);
  board.rotation.x = -0.4;
  addMesh(group, new THREE.BoxGeometry(0.58, 0.04, 1.54), hoverboardGlowMat, [0, 0.85, 0], [-0.4, 0, 0]);
  return group;
}

function makeJetpackPickup() {
  const group = new THREE.Group();
  for (const s of [-0.2, 0.2]) {
    addMesh(group, new THREE.CylinderGeometry(0.12, 0.12, 0.65, 12), jetpackMat, [s, 0.88, 0]);
  }
  addMesh(group, new THREE.BoxGeometry(0.3, 0.2, 0.15), trainDarkMat, [0, 0.88, 0]);
  return group;
}

function makeSneakersPickup() {
  const group = new THREE.Group();
  const shoe = addMesh(group, new THREE.BoxGeometry(0.42, 0.28, 0.68), sneakerMat, [0, 0.85, 0]);
  const wing = addMesh(group, new THREE.ConeGeometry(0.2, 0.5, 4), multMat, [0.28, 0.95, 0]);
  wing.rotation.z = -0.6;
  return group;
}

function makeMultiplierPickup() {
  const group = new THREE.Group();
  const textGroup = new THREE.Group();
  // '2X' 3D block emblem
  addMesh(textGroup, new THREE.BoxGeometry(0.55, 0.55, 0.2), multMat, [0, 0.88, 0]);
  addMesh(textGroup, new THREE.TorusGeometry(0.4, 0.05, 8, 20), coinRingMat, [0, 0.88, 0]);
  group.add(textGroup);
  return group;
}

// Confetti particle engine
export function spawnConfetti(x, y, z, count = 40) {
  const colors = [0xff1744, 0x00e5ff, 0xffea00, 0x76ff03, 0xd500f9, 0xff9100];
  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    const cMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), cMat);
    mesh.position.set(x + (Math.random() - 0.5) * 4, y + 2, z + (Math.random() - 0.5) * 2);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    const vx = (Math.random() - 0.5) * 6;
    const vy = 5 + Math.random() * 5;
    const vz = (Math.random() - 0.5) * 4;
    particles.push({ mesh, vx, vy, vz, life: 1.4 });
    scene.add(mesh);
  }
}

function makeLetter(char = 'D') {
  const group = new THREE.Group();
  const colors = { D: 0x00e5ff, A: 0xff1744, S: 0xffea00, H: 0x76ff03 };
  const col = colors[char] || 0x00e5ff;
  const letterMat = mat(col, 0.2, 0.8, { emissive: col, emissiveIntensity: 0.5 });

  // Main block diamond with glowing core
  const block = addMesh(group, new THREE.BoxGeometry(0.72, 0.72, 0.24), letterMat, [0, 0.95, 0]);
  block.rotation.z = Math.PI / 4; // Diamond orientation

  // Inner dark cutout
  addMesh(group, new THREE.BoxGeometry(0.38, 0.38, 0.28), trainDarkMat, [0, 0.95, 0], [0, 0, Math.PI / 4]);

  // Floating sparkle halo ring
  const halo = addMesh(group, new THREE.TorusGeometry(0.55, 0.03, 8, 20), coinRingMat, [0, 0.95, 0]);
  halo.rotation.x = Math.PI / 2;

  group.userData.isLetter = true;
  group.userData.char = char;
  return group;
}

// 3D High Score Finish Line Arch
function makeHighScoreArch() {
  const group = new THREE.Group();
  const w = LANE_WIDTH * 3 + 2.0;
  const h = 5.2;
  const goldArchMat = mat(0xffc107, 0.2, 0.9, { emissive: 0xff8f00, emissiveIntensity: 0.3 });

  // Two golden pillars
  for (const side of [-1, 1]) {
    addMesh(group, new THREE.BoxGeometry(0.35, h, 0.35), goldArchMat, [side * (w / 2), h / 2, 0]);
  }
  // Overhead banner
  addMesh(group, new THREE.BoxGeometry(w + 0.4, 0.9, 0.4), goldArchMat, [0, h - 0.45, 0]);

  // Golden Trophy on top
  const trophy = new THREE.Group();
  addMesh(trophy, new THREE.CylinderGeometry(0.35, 0.2, 0.6, 12), goldArchMat, [0, h + 0.35, 0]);
  addMesh(trophy, new THREE.TorusGeometry(0.28, 0.04, 6, 16), goldArchMat, [0, h + 0.4, 0]);
  group.add(trophy);

  // Checkered Finish Ribbon spanning across tracks at height 1.2
  const ribbonGeo = new THREE.BoxGeometry(w, 0.25, 0.05);
  const ribbon = addMesh(group, ribbonGeo, mat(0xff1744, 0.4, 0.2), [0, 1.2, 0]);
  ribbon.name = 'finishRibbon';

  return group;
}

function makeMysteryBox() {
  const group = new THREE.Group();
  const boxMat = mat(0xab47bc, 0.35, 0.2); // Vibrant magenta
  const ribbonMat = mat(0xffd54f, 0.2, 0.8, { emissive: 0xffa000, emissiveIntensity: 0.4 }); // Glowing gold
  // Main cube
  addMesh(group, new THREE.BoxGeometry(0.85, 0.85, 0.85), boxMat, [0, 0.88, 0]);
  // Vertical ribbon
  addMesh(group, new THREE.BoxGeometry(0.88, 0.88, 0.22), ribbonMat, [0, 0.88, 0]);
  // Horizontal ribbon
  addMesh(group, new THREE.BoxGeometry(0.22, 0.88, 0.88), ribbonMat, [0, 0.88, 0]);
  // Bow on top
  addMesh(group, new THREE.SphereGeometry(0.18, 8, 8), ribbonMat, [0, 1.35, 0]);
  return group;
}

// Constructors dictionary
const constructors = {
  coin: makeCoin,
  goldBar: makeCoin,
  sacredGem: makeSacredGem,
  train: () => makeTrain(false, false),
  trainRamp: () => makeTrain(true, false),
  trainMoving: () => makeTrain(false, true),
  jump: makeHurdle,
  hurdle: makeHurdle,
  slide: makeHighBarrier,
  highBarrier: makeHighBarrier,
  solid: makeRoadblock,
  crate: makeRoadblock,
  climb: makeRoadblock,
  magnet: makeMagnetPickup,
  hoverboard: makeHoverboardPickup,
  jetpack: makeJetpackPickup,
  sneakers: makeSneakersPickup,
  multiplier: makeMultiplierPickup,
  mysteryBox: makeMysteryBox,
  letter_D: () => makeLetter('D'),
  letter_A: () => makeLetter('A'),
  letter_S: () => makeLetter('S'),
  letter_H: () => makeLetter('H'),
  highScoreArch: makeHighScoreArch,
};

const liveModels = new Map();

function releaseGroup(group) {
  scene.remove(group);
}

// -------------------------------------------------------------
// CAMERA CONTROLLER & SHAKE
// -------------------------------------------------------------
let cameraShake = 0;

export function triggerCameraShake(intensity = 0.3) {
  cameraShake = Math.max(cameraShake, intensity);
}

export function resizeScene(width, height) {
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

// -------------------------------------------------------------
// MAIN 3D RENDER LOOP HOOK
// -------------------------------------------------------------
export function update3DScene(playerState, objects, distance, timeSeconds, dt, thiefState) {
  // 1. UPDATE SLEEPERS & SCENERY SCROLL
  for (const tie of trackTies) {
    let z = roadStartZ - ((tie.userData.initialZ - distance) % roadLength);
    if (z > roadStartZ) z -= roadLength;
    tie.position.z = z;
  }
  for (const item of sideScenery) {
    let z = roadStartZ - ((item.userData.offsetZ - distance) % roadLength);
    if (z > roadStartZ) z -= roadLength;
    item.position.z = z;
  }

  // 2. UPDATE ACTIVE 3D PARTICLES
  updateParticles(dt);

  // 3. UPDATE 3D OBSTACLES & COLLECTIBLES
  const activeSet = new Set(objects);
  for (const [object, group] of liveModels) {
    if (!activeSet.has(object)) {
      releaseGroup(group);
      liveModels.delete(object);
    }
  }

  for (const object of objects) {
    let group = liveModels.get(object);
    if (!group) {
      const ctor = constructors[object.type] || constructors[object.kind];
      if (!ctor) continue;
      group = ctor();
      group.userData.kind = object.type || object.kind;
      scene.add(group);
      liveModels.set(object, group);
    }

    const relZ = -(object.distance - distance);
    const lx = object.kind === 'highScoreArch' ? 0 : (LANE_X[object.lane] || 0);
    group.position.set(lx, 0, relZ);
    group.visible = relZ > farZ - 10 && relZ < roadStartZ + 15;

    // Moving trains rush toward player!
    if (group.userData.isMoving && group.visible) {
      group.position.z = relZ;
    }

    // High Score Finish Arch ribbon status
    if (object.kind === 'highScoreArch') {
      const ribbon = group.getObjectByName('finishRibbon');
      if (ribbon) ribbon.visible = distance < object.distance;
    }

    // Flashing warning beacons on hurdles
    const flash = (Math.floor(timeSeconds * 5.5) % 2 === 0);
    hurdleBeaconMat.color.setHex(flash ? 0xffea00 : 0x6d4000);

    // Collectible floating and spinning animations
    if (object.kind === 'coin') {
      const baseY = (object.roof ? TRAIN_HEIGHT : 0) + (object.arcY || object.rampHeight || 0);
      group.rotation.y = timeSeconds * 3.5 + object.distance;
      group.rotation.x = object.arcSlope || 0;
      group.position.y = baseY + 0.08 + Math.sin(timeSeconds * 5 + object.distance) * (object.arcY ? 0.03 : 0.12);

      // Magnetic attraction to player in 3D (Magnet, Jetpack, Headstart)
      const isMagnetic = playerState.magnetActive || playerState.jetpackActive || playerState.headstartActive;
      if (isMagnetic && Math.abs(relZ) < 14 && relZ < 2.5) {
        group.position.x = THREE.MathUtils.lerp(group.position.x, playerMesh.position.x, dt * 10);
        group.position.y = THREE.MathUtils.lerp(group.position.y, playerMesh.position.y + 0.9, dt * 10);
        group.position.z = THREE.MathUtils.lerp(group.position.z, playerMesh.position.z, dt * 10);
      }
    } else if (object.kind === 'sacredGem') {
      group.rotation.y = timeSeconds * 3.6 + object.distance;
      const baseY = object.roof ? TRAIN_HEIGHT : 0;
      group.position.y = baseY + 0.15 + Math.sin(timeSeconds * 5 + object.distance) * 0.16;
      const ring = group.children.find(c => c.userData && c.userData.isGemRing);
      if (ring) ring.rotation.z = timeSeconds * 4;

      const isMagnetic = playerState.magnetActive || playerState.jetpackActive || playerState.headstartActive;
      if (isMagnetic && Math.abs(relZ) < 14 && relZ < 2.5) {
        group.position.x = THREE.MathUtils.lerp(group.position.x, playerMesh.position.x, dt * 10);
        group.position.y = THREE.MathUtils.lerp(group.position.y, playerMesh.position.y + 0.9, dt * 10);
        group.position.z = THREE.MathUtils.lerp(group.position.z, playerMesh.position.z, dt * 10);
      }
    } else if (object.kind === 'letter') {
      group.rotation.y = timeSeconds * 2.8 + object.distance;
      const baseY = object.roof ? TRAIN_HEIGHT : (object.elevated ? 1.2 : 0.35);
      group.position.y = baseY + 0.12 + Math.sin(timeSeconds * 4.5 + object.distance) * 0.12;
    } else if (object.kind === 'mysteryBox') {
      group.rotation.y = timeSeconds * 2.4;
      const baseY = object.roof ? TRAIN_HEIGHT : 0;
      group.position.y = baseY + 0.12 + Math.sin(timeSeconds * 3.5) * 0.14;
    } else if (['magnet', 'hoverboard', 'jetpack', 'sneakers', 'multiplier'].includes(object.kind)) {
      group.rotation.y = timeSeconds * 2.8;
      group.position.y = 0.15 + Math.sin(timeSeconds * 4) * 0.15;
    }
  }

  // 4. ANIMATE 3D PLAYER CHARACTER
  const targetX = LANE_X[playerState.lane] || 0;
  playerMesh.position.x = THREE.MathUtils.lerp(playerMesh.position.x, targetX, Math.min(1, dt * 16));
  playerMesh.position.y = playerState.y;
  playerMesh.position.z = 0;

  // Lateral banking into turns & ramp slope pitch
  const xDiff = targetX - playerMesh.position.x;
  tiltGroup.rotation.z = -xDiff * 0.35;
  tiltGroup.rotation.y = xDiff * 0.25;

  const rampAngle = Math.atan2(TRAIN_HEIGHT, RAMP_LENGTH);
  const targetPitch = playerState.onRamp ? -rampAngle : 0;
  tiltGroup.rotation.x = THREE.MathUtils.lerp(tiltGroup.rotation.x, targetPitch, Math.min(1, dt * 14));

  // Running stride cycle
  const runCycle = timeSeconds * (playerState.speed * 0.85);
  const isGrounded = playerState.y <= playerState.groundY + 0.05 && playerState.jump <= 0;
  const isRunning = isGrounded && playerState.slide <= 0 && playerState.state === 'playing';

  // Hoverboard visibility and surf pose
  hoverboardMesh.visible = Boolean(playerState.hoverboardActive);
  jetpackMesh.visible = Boolean(playerState.jetpackActive);
  wingsMesh.visible = Boolean(playerState.sneakersActive);
  if (playerState.sneakersActive && wingsMesh.children.length >= 2) {
    const flap = Math.sin(timeSeconds * 22) * 0.3;
    wingsMesh.children[0].rotation.z = -0.7 - flap;
    wingsMesh.children[1].rotation.z = 0.7 + flap;
  }
  magnetAura.visible = Boolean(playerState.magnetActive);
  headstartMesh.visible = Boolean(playerState.headstartActive);

  if (playerState.headstartActive) {
    // Supersonic rocket flames pulsation (Zero allocations)
    const flicker = 1.0 + Math.sin(timeSeconds * 42) * 0.28;
    for (const f of headstartFlames) {
      f.scale.set(1.0, flicker, 1.0);
    }
  }

  if (playerState.hoverboardActive) {
    // Surfer pose: sideways stance, knees bent
    bodyGroup.rotation.y = 1.1; // 60 degrees sideways
    bodyGroup.rotation.x = 0;
    hoverboardMesh.rotation.x = 0;
    leftLeg.rotation.x = -0.3;
    rightLeg.rotation.x = 0.3;
    leftArm.rotation.x = -0.6;
    rightArm.rotation.x = 0.6;
    bodyGroup.position.y = 0.1;
    // Occasional hoverboard spark
    if (Math.random() < 0.15) {
      spawnParticles(playerMesh.position.x, 0.1, 0.8, 0x00e5ff, 1, 1.5);
    }
  } else if (playerState.jetpackActive) {
    // Flying rocket pose: arms back, legs trailing
    bodyGroup.rotation.y = 0;
    bodyGroup.rotation.x = 0.3;
    bodyGroup.position.y = 0;
    leftLeg.rotation.x = 0.4;
    rightLeg.rotation.x = 0.4;
    leftArm.rotation.x = 0.8;
    rightArm.rotation.x = 0.8;
    // Pulsating dual flame plumes (ZERO allocations)
    const flicker = 1.0 + Math.sin(timeSeconds * 40) * 0.25;
    for (const f of jetpackFlames) {
      f.outer.scale.set(1.0 + Math.cos(timeSeconds * 28) * 0.15, flicker, 1.0);
      f.inner.scale.set(1.0, flicker * 1.2, 1.0);
    }
  } else if (playerState.slide > 0) {
    // Low slide pose
    bodyGroup.rotation.y = 0;
    bodyGroup.rotation.x = 1.15; // Lean flat forward
    bodyGroup.position.y = -0.42;
    leftLeg.rotation.x = 1.2;
    rightLeg.rotation.x = 1.2;
    leftArm.rotation.x = -0.8;
    rightArm.rotation.x = -0.8;
    // Foot scrape dust
    if (Math.random() < 0.4) {
      spawnParticles(playerMesh.position.x, 0.05, 0.3, 0xd7ccc8, 2, 1.5);
    }
  } else if (playerState.jump > 0 || !isGrounded) {
    // Dynamic athletic Subway Surfers hurdle clearance leap!
    const vy = playerState.vy || 0;
    bodyGroup.rotation.y = 0;
    bodyGroup.position.y = 0;

    if (vy > 2.0) {
      // Ascending: athletic forward leap, knees tucking up over fence, arms pumping forward
      bodyGroup.rotation.x = -0.22;
      leftLeg.rotation.x = -1.05;
      rightLeg.rotation.x = -0.65;
      leftArm.rotation.x = -0.85;
      rightArm.rotation.x = -1.15;
    } else if (vy > -3.0) {
      // Apex float directly over the fence: knees tightly tucked, arms out for flight balance
      bodyGroup.rotation.x = -0.05;
      leftLeg.rotation.x = -0.95;
      rightLeg.rotation.x = -0.85;
      leftArm.rotation.x = -1.35;
      rightArm.rotation.x = -1.35;
    } else {
      // Descending to track: legs extending downward to absorb landing, torso upright
      bodyGroup.rotation.x = 0.12;
      leftLeg.rotation.x = 0.35;
      rightLeg.rotation.x = 0.2;
      leftArm.rotation.x = -0.35;
      rightArm.rotation.x = -0.35;
    }
  } else if (isRunning) {
    // Standard Subway Surfers run cycle with lively stride
    bodyGroup.rotation.y = 0;
    bodyGroup.rotation.x = 0.14;
    bodyGroup.position.y = Math.abs(Math.sin(runCycle)) * 0.12;

    const legAngle = Math.sin(runCycle) * 0.75;
    leftLeg.rotation.x = legAngle;
    rightLeg.rotation.x = -legAngle;

    const armAngle = Math.sin(runCycle) * 0.65;
    leftArm.rotation.x = -armAngle;
    rightArm.rotation.x = armAngle;

    // Running footstep dust
    if (Math.abs(Math.sin(runCycle)) > 0.95 && Math.random() < 0.25) {
      spawnParticles(playerMesh.position.x, 0.05, 0.2, 0x8d6e63, 1, 1);
    }
  } else {
    // Idle pose
    bodyGroup.rotation.set(0, 0, 0);
    bodyGroup.position.set(0, 0, 0);
    leftLeg.rotation.set(0, 0, 0);
    rightLeg.rotation.set(0, 0, 0);
    leftArm.rotation.set(0, 0, 0);
    rightArm.rotation.set(0, 0, 0);
  }

  // Shadow disc scales and fades with jump height
  const heightAboveGround = playerMesh.position.y - playerState.groundY;
  const shadowScale = Math.max(0.2, 1.0 - heightAboveGround * 0.25);
  shadowDisc.scale.set(shadowScale, shadowScale, shadowScale);
  shadowDisc.position.y = (playerState.groundY - playerMesh.position.y) + 0.02;
  shadowDisc.material.opacity = Math.max(0.1, 0.42 - heightAboveGround * 0.1);
  shadowDisc.rotation.x = -Math.PI / 2 + (playerState.onRamp ? rampAngle : 0);

  // 4B. ANIMATE 3D THIEF (Talking Tom Gold Run - Roy the Jungle Bandit)
  if (thiefState && thiefMesh) {
    const relZ = -(thiefState.distance - distance);
    const inRange = relZ > farZ - 10 && relZ < roadStartZ + 15;
    thiefMesh.visible = inRange;

    if (inRange) {
      const targetX = LANE_X[thiefState.lane] || 0;
      thiefMesh.position.x = THREE.MathUtils.lerp(thiefMesh.position.x, targetX, Math.min(1, dt * 10));
      thiefMesh.position.y = thiefState.y || 0;
      thiefMesh.position.z = relZ;

      // Running stride
      const thiefStride = timeSeconds * 20;
      thiefLeftLeg.rotation.x = Math.sin(thiefStride) * 0.85;
      thiefRightLeg.rotation.x = -Math.sin(thiefStride) * 0.85;

      // Body bounce & forward sprint lean
      thiefBodyGroup.position.y = Math.abs(Math.sin(thiefStride)) * 0.12;
      thiefBodyGroup.rotation.x = 0.24;

      // Loot sack bounce
      thiefLootSack.position.y = 1.05 + Math.sin(thiefStride * 2) * 0.05;

      // Sacred Precision Stone magical pulse and spin
      thiefPrecisionGem.rotation.y = timeSeconds * 3.4;
      const gemPulse = 1.0 + Math.sin(timeSeconds * 8) * 0.16;
      thiefPrecisionGem.scale.set(gemPulse, gemPulse, gemPulse);

      // Tail swish
      thiefTail.rotation.y = Math.sin(thiefStride) * 0.35;

      // Reactions: Panic flail or looking back over shoulder
      if (thiefState.panic > 0) {
        thiefLeftArm.rotation.x = -1.2 + Math.sin(timeSeconds * 32) * 0.6;
        thiefRightArm.rotation.x = -1.2 - Math.sin(timeSeconds * 32) * 0.6;
        thiefHeadGroup.rotation.y = THREE.MathUtils.lerp(thiefHeadGroup.rotation.y, 2.7, Math.min(1, dt * 14));
        thiefTilt.rotation.z = Math.sin(timeSeconds * 24) * 0.16;
      } else if (thiefState.lookBackTimer > 0) {
        thiefHeadGroup.rotation.y = THREE.MathUtils.lerp(thiefHeadGroup.rotation.y, 2.6, Math.min(1, dt * 8));
        thiefLeftArm.rotation.x = -Math.sin(thiefStride) * 0.75;
        thiefRightArm.rotation.x = Math.sin(thiefStride) * 0.75;
        thiefTilt.rotation.z = 0;
      } else {
        thiefHeadGroup.rotation.y = THREE.MathUtils.lerp(thiefHeadGroup.rotation.y, 0, Math.min(1, dt * 6));
        thiefLeftArm.rotation.x = -Math.sin(thiefStride) * 0.75;
        thiefRightArm.rotation.x = Math.sin(thiefStride) * 0.75;
        thiefTilt.rotation.z = 0;
      }

      // Shadow disc tracking
      thiefShadow.position.y = -thiefMesh.position.y + 0.02;
    }
  }

  // 5. DYNAMIC SUBWAY TUNNEL BIOME TRANSITION
  const cycleDist = distance % 600;
  const inTunnel = cycleDist > 240 && cycleDist < 460;
  const targetFog = inTunnel ? new THREE.Color(0x0c1720) : new THREE.Color(0x10281d);
  scene.fog.color.lerp(targetFog, dt * 2.5);
  renderer.setClearColor(scene.fog.color, 1);
  sun.intensity = THREE.MathUtils.lerp(sun.intensity, inTunnel ? 1.0 : 2.6, dt * 2.5);
  ambientFill.intensity = THREE.MathUtils.lerp(ambientFill.intensity, inTunnel ? 1.6 : 0.9, dt * 2.5);

  // 6. DYNAMIC 3D CAMERA (Vantage, Altitude POV, Tilt, Shake & Speed FOV)
  const isFlying = Boolean(playerState.jetpackActive || playerState.headstartActive);
  const isOnTrain = !isFlying && Boolean(playerState.onRamp || (playerState.groundY && playerState.groundY >= 1.8));

  let targetCamY = 3.4;
  let targetCamZ = 7.4;
  let targetLookAtY = 1.45;
  let lookAtZ = -18;

  if (isFlying) {
    // Jetpack Sky Flight: High-altitude cinematic aerial POV
    // Camera ascends and pulls back so runner is in lower-third, leaving clear view of upcoming sky coins & tracks ahead
    targetCamY = playerMesh.position.y + 4.1;
    targetCamZ = 9.8;
    targetLookAtY = playerMesh.position.y + 1.1;
    lookAtZ = -28;
  } else if (isOnTrain) {
    // Train / Bus Roof: Elevated panoramic POV over train roofs
    // High clearance over player's cap, pulled back slightly to clearly see roof hurdles, train ends & ramps
    const baseTrainY = playerState.groundY || TRAIN_HEIGHT;
    targetCamY = baseTrainY + 3.65;
    targetCamZ = 8.2;
    targetLookAtY = baseTrainY + 1.55;
    lookAtZ = -22;
  } else {
    // Normal Ground Running & Jumping: Camera remains rock-steady at ground level!
    // Jumping on the road will NOT shift the camera POV or cause vertical bobbing.
    targetCamY = 3.4;
    targetCamZ = 7.4;
    targetLookAtY = 1.45;
    lookAtZ = -18;
  }

  const targetCamX = playerMesh.position.x * 0.38;

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, Math.min(1, dt * 10));
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, Math.min(1, dt * 7));
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, Math.min(1, dt * 6));

  // Dynamic LookAt Point
  const targetLookAtX = playerMesh.position.x * 0.22;

  // Camera Shake
  if (cameraShake > 0) {
    camera.position.x += (Math.random() - 0.5) * cameraShake;
    camera.position.y += (Math.random() - 0.5) * cameraShake;
    cameraShake = Math.max(0, cameraShake - dt * 1.5);
  }

  // Speed FOV expansion (speed sensation, wider during jetpack)
  const baseFov = isFlying ? 58 : 50;
  const targetFov = baseFov + (playerState.speed - 13) * 0.7;
  camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 3);
  camera.updateProjectionMatrix();

  camera.lookAt(targetLookAtX, targetLookAtY, lookAtZ);

  // Sun shadow camera tracks with player position
  sun.position.x = playerMesh.position.x - 6;
  sun.target.position.set(playerMesh.position.x, playerMesh.position.y * 0.4, -10);
  sun.target.updateMatrixWorld();

  renderer.render(scene, camera);
}
