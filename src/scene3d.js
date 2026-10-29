import * as THREE from 'three';

const nearZ = 1.2;
const roadStartZ = 4;
const farZ = -58;
const nearHalf = 4.25;
const farHalf = 7.4;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 140);
camera.position.set(0, 2.5, 8.8);
camera.lookAt(0, 0, -20.7);

const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#scene3d'), alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = false;

scene.add(new THREE.HemisphereLight(0xe3ffd5, 0x55402a, 2.1));
const sun = new THREE.DirectionalLight(0xfff0ce, 2.8);
sun.position.set(-4, 10, 7);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xa5d9b2, 1.3);
fill.position.set(5, 5, -8);
scene.add(fill);

const mat = (color, roughness = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const roadMaterial = mat(0x80603a);
const roadEdgeMaterial = mat(0xb4935a);
const laneMaterial = mat(0xe5d49b);
const bark = mat(0x755035);
const barkLight = mat(0xb37b43);
const leaf = mat(0x63934a);
const vineMat = mat(0x357344);
const vineLight = mat(0x9fbd57);
const crateMat = mat(0x875431);
const crateLight = mat(0xc18a50);
const cartMat = mat(0x3e6c60);
const cartTrim = mat(0xb8c89c);
const wheelMat = mat(0x26332c);
const pitMat = mat(0x171d18, 1);
const rimMat = mat(0x80603d);
const coinMat = mat(0xffc23f, 0.35, { metalness: 0.72, emissive: 0x5a3000, emissiveIntensity: 0.25 });
const coinLineMat = mat(0xffec9a, 0.3, { metalness: 0.6 });

function halfWidthAt(z) {
  const progress = THREE.MathUtils.clamp((nearZ - z) / (nearZ - farZ), 0, 1);
  return THREE.MathUtils.lerp(nearHalf, farHalf, progress);
}
function laneWorldX(lane, z) {
  return (lane - 1) * halfWidthAt(z) * 2 / 3;
}

function makeRoad() {
  const positions = [];
  const segments = 56;
  for (let i = 0; i < segments; i++) {
    const z0 = THREE.MathUtils.lerp(roadStartZ, farZ, i / segments);
    const z1 = THREE.MathUtils.lerp(roadStartZ, farZ, (i + 1) / segments);
    const h0 = halfWidthAt(z0), h1 = halfWidthAt(z1);
    positions.push(-h0, 0, z0, h0, 0, z0, -h1, 0, z1, h0, 0, z0, h1, 0, z1, -h1, 0, z1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const road = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x82613b, roughness: 1, side: THREE.DoubleSide }));
  road.position.y = -0.025;
  road.renderOrder = 0;
  scene.add(road);

  const edgeSegments = 56;
  for (const side of [-1, 1]) for (let i = 0; i < edgeSegments; i++) {
    const z0 = THREE.MathUtils.lerp(roadStartZ, farZ, i / edgeSegments);
    const z1 = THREE.MathUtils.lerp(roadStartZ, farZ, (i + 1) / edgeSegments);
    const edge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.075, Math.abs(z1 - z0) + 0.025), roadEdgeMaterial);
    edge.position.set(side * (halfWidthAt(z0) + halfWidthAt(z1)) / 2, 0.025, (z0 + z1) / 2);
    edge.rotation.y = -side * Math.asin((farHalf - nearHalf) / (roadStartZ - farZ));
    scene.add(edge);
  }
  const dashGeometry = new THREE.BoxGeometry(0.045, 0.018, 1.55);
  const dashes = [];
  for (let i = 0; i < 18; i++) {
    for (let lane = 1; lane <= 2; lane++) {
      const dash = new THREE.Mesh(dashGeometry, laneMaterial);
      dash.userData.index = i;
      dash.userData.lane = lane;
      dash.renderOrder = 1;
      scene.add(dash);
      dashes.push(dash);
    }
  }
  return dashes;
}

const laneDashes = makeRoad();
const liveModels = new Map();

function add(group, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  group.add(mesh);
  return mesh;
}

function makeCrate() {
  const group = new THREE.Group();
  add(group, new THREE.BoxGeometry(1.05, 1.18, 0.88), crateMat, [0, 0.62, 0]);
  // Chunky corner rails and a raised top make the box read as a solid wooden object.
  for (const x of [-0.43, 0.43]) {
    add(group, new THREE.BoxGeometry(0.1, 1.25, 0.96), crateLight, [x, 0.63, 0]);
  }
  for (const z of [-0.4, 0.4]) {
    add(group, new THREE.BoxGeometry(0.94, 0.1, 0.08), barkLight, [0, 0.62, z]);
  }
  add(group, new THREE.BoxGeometry(1.13, 0.12, 0.96), crateLight, [0, 1.24, 0]);
  const slat = add(group, new THREE.BoxGeometry(0.1, 0.92, 0.035), barkLight, [0, 0.63, 0.462]);
  slat.rotation.z = -0.62;
  const slat2 = add(group, new THREE.BoxGeometry(0.1, 0.92, 0.035), barkLight, [0, 0.63, 0.462]);
  slat2.rotation.z = 0.62;
  return group;
}

function makeRoot() {
  const group = new THREE.Group();
  add(group, new THREE.CylinderGeometry(0.31, 0.34, 1.9, 14, 1), bark, [0, 0.33, 0], [0, 0, Math.PI / 2]);
  add(group, new THREE.CylinderGeometry(0.29, 0.29, 0.055, 14), barkLight, [-0.96, 0.33, 0], [0, 0, Math.PI / 2]);
  add(group, new THREE.CylinderGeometry(0.29, 0.29, 0.055, 14), barkLight, [0.96, 0.33, 0], [0, 0, Math.PI / 2]);
  for (let i = 0; i < 4; i++) {
    const sprout = add(group, new THREE.SphereGeometry(0.17, 8, 6), leaf, [-0.55 + i * 0.36, 0.56, 0.12]);
    sprout.scale.set(0.75, 0.35, 1.4);
    sprout.rotation.z = (i % 2 ? -1 : 1) * 0.4;
  }
  return group;
}

function makeVine() {
  const group = new THREE.Group();
  const points = [
    new THREE.Vector3(-0.92, 2.35, 0), new THREE.Vector3(-0.72, 1.45, 0),
    new THREE.Vector3(-0.32, 1.12, 0), new THREE.Vector3(0, 1.05, 0),
    new THREE.Vector3(0.36, 1.18, 0), new THREE.Vector3(0.72, 1.55, 0),
    new THREE.Vector3(0.92, 2.35, 0),
  ];
  const curve = new THREE.CatmullRomCurve3(points);
  add(group, new THREE.TubeGeometry(curve, 24, 0.105, 8, false), vineMat);
  for (const side of [-1, 1]) {
    const leafMesh = add(group, new THREE.SphereGeometry(0.2, 10, 7), vineLight, [side * 0.91, 2.28, 0]);
    leafMesh.scale.set(1.35, 0.35, 0.8);
    leafMesh.rotation.z = side * 0.3;
  }
  return group;
}

function makeTower(withLadder) {
  const group = new THREE.Group();
  add(group, new THREE.BoxGeometry(1.3, 1.05, 1.05), crateMat, [0, 0.55, 0]);
  add(group, new THREE.BoxGeometry(1.48, 0.12, 1.2), crateLight, [0, 1.08, 0]);
  add(group, new THREE.BoxGeometry(1.3, 0.95, 1.05), bark, [0, 1.62, 0]);
  add(group, new THREE.BoxGeometry(1.48, 0.12, 1.2), crateLight, [0, 2.12, 0]);
  for (const x of [-0.49, 0.49]) {
    add(group, new THREE.BoxGeometry(0.1, 0.9, 0.04), barkLight, [x, 0.55, 0.55]);
    add(group, new THREE.BoxGeometry(0.1, 0.8, 0.04), crateLight, [x, 1.62, 0.55]);
  }
  if (withLadder) {
    for (const x of [-0.34, 0.34]) add(group, new THREE.BoxGeometry(0.09, 2.22, 0.1), barkLight, [x, 1.12, 0.66]);
    for (let i = 0; i < 9; i++) {
      add(group, new THREE.BoxGeometry(0.72, 0.075, 0.13), roadEdgeMaterial, [0, 0.14 + i * 0.245, 0.68]);
    }
  }
  return group;
}

function makeUnderpass(doubleStory) {
  const group = new THREE.Group();
  const height = doubleStory ? 2.4 : 1.75;
  const pillarHeight = height;
  for (const x of [-0.88, 0.88]) {
    add(group, new THREE.BoxGeometry(0.24, pillarHeight, 0.3), bark, [x, pillarHeight / 2, 0]);
    add(group, new THREE.BoxGeometry(0.36, 0.14, 0.42), roadEdgeMaterial, [x, 0.08, 0]);
  }
  add(group, new THREE.BoxGeometry(2.05, 0.3, 0.42), crateMat, [0, height - 0.15, 0]);
  add(group, new THREE.BoxGeometry(2.18, 0.12, 0.48), crateLight, [0, height - 0.34, 0]);
  if (doubleStory) {
    add(group, new THREE.BoxGeometry(2.05, 0.28, 0.42), bark, [0, height - 0.72, 0]);
    add(group, new THREE.BoxGeometry(2.18, 0.12, 0.48), roadEdgeMaterial, [0, height - 0.91, 0]);
  }
  // The open center below the beam is deliberately wide and tall enough for the bear to slide through.
  return group;
}

function makeCart() {
  const group = new THREE.Group();
  add(group, new THREE.BoxGeometry(1.55, 0.55, 0.95), cartMat, [0, 0.58, 0]);
  add(group, new THREE.BoxGeometry(1.35, 0.12, 0.78), cartTrim, [0, 0.92, 0]);
  add(group, new THREE.BoxGeometry(0.1, 0.45, 0.08), barkLight, [0, 0.62, 0.5]);
  const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 16);
  for (const x of [-0.62, 0.62]) {
    const wheel = add(group, wheelGeometry, wheelMat, [x, 0.28, 0], [0, 0, Math.PI / 2]);
    wheel.userData.rollingWheel = true;
    add(group, new THREE.CylinderGeometry(0.09, 0.09, 0.175, 12), roadEdgeMaterial, [x, 0.28, 0], [0, 0, Math.PI / 2]);
  }
  return group;
}

function makeGap() {
  const group = new THREE.Group();
  const hole = add(group, new THREE.BoxGeometry(1.75, 0.035, 1.1), pitMat, [0, 0.012, 0]);
  hole.material.side = THREE.DoubleSide;
  for (const z of [-0.58, 0.58]) {
    add(group, new THREE.BoxGeometry(2.05, 0.18, 0.16), rimMat, [0, 0.045, z]);
  }
  for (const x of [-0.94, 0.94]) {
    add(group, new THREE.BoxGeometry(0.16, 0.16, 1.08), roadEdgeMaterial, [x, 0.045, 0]);
  }
  return group;
}

function makeCoin() {
  const group = new THREE.Group();
  const coin = add(group, new THREE.CylinderGeometry(0.24, 0.24, 0.075, 24), coinMat, [0, 0.83, 0], [Math.PI / 2, 0, 0]);
  coin.userData.coinFace = true;
  const ring = add(group, new THREE.TorusGeometry(0.16, 0.018, 6, 20), coinLineMat, [0, 0.83, 0.045]);
  ring.userData.coinRing = true;
  add(group, new THREE.SphereGeometry(0.045, 8, 6), coinLineMat, [0, 0.83, 0.052]);
  return group;
}

const constructors = {
  root: makeRoot, jump: makeRoot, climb: () => makeTower(true), solid: () => makeTower(false),
  slide: () => makeUnderpass(false), slideDouble: () => makeUnderpass(true),
  coin: makeCoin,
};

function releaseGroup(group) {
  group.traverse(object => {
    if (!object.isMesh) return;
    object.geometry.dispose();
    if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
    else if (![roadMaterial, roadEdgeMaterial, laneMaterial, bark, barkLight, leaf, vineMat, vineLight, crateMat, crateLight, cartMat, cartTrim, wheelMat, pitMat, rimMat, coinMat, coinLineMat].includes(object.material)) object.material.dispose();
  });
  scene.remove(group);
}

export function resizeScene(width, height) {
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

export function updateScene(objects, distance, timeSeconds) {
  const active = new Set(objects);
  for (const [object, group] of liveModels) {
    if (!active.has(object)) { releaseGroup(group); liveModels.delete(object); }
  }
  for (const object of objects) {
    let group = liveModels.get(object);
    if (!group) {
      group = constructors[object.kind === 'coin' ? 'coin' : object.type]?.();
      if (!group) continue;
      group.userData.kind = object.kind === 'coin' ? 'coin' : object.type;
      scene.add(group);
      liveModels.set(object, group);
    }
    const relativeDistance = object.distance - distance;
    const z = nearZ - relativeDistance * 0.66;
    group.position.set(laneWorldX(object.lane, z), 0, z);
    group.visible = z > farZ - 2 && z < nearZ + 4;
    if (group.userData.kind === 'coin') {
      group.rotation.y = Math.sin(timeSeconds * 3 + object.distance) * 0.12;
      group.rotation.z = timeSeconds * 1.8 + object.distance;
      group.position.y = 0.05 + Math.sin(timeSeconds * 4 + object.distance) * 0.08;
    } else if (group.userData.kind === 'slide' || group.userData.kind === 'slideDouble') {
      group.rotation.z = Math.sin(timeSeconds * 1.8 + object.distance) * 0.035;
    } else if (group.userData.kind === 'cart') {
      group.traverse(child => { if (child.userData.rollingWheel) child.rotation.x = timeSeconds * 2.8; });
    }
  }
  const roadLength = roadStartZ - farZ;
  for (const dash of laneDashes) {
    const index = dash.userData.index;
    const lane = dash.userData.lane;
    let z = roadStartZ - ((index * 3.4 + distance * 0.72) % roadLength);
    if (z > roadStartZ) z -= roadLength;
    dash.position.set((lane - 1.5) * halfWidthAt(z) * 2 / 3, 0.015, z);
    const size = halfWidthAt(z) / 3;
    dash.scale.x = Math.max(0.55, size / 0.9);
  }
  renderer.render(scene, camera);
}
