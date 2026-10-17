import * as THREE from 'three';

const TILT_DEGREES = 25;
const SPIN_SPEED = 0.42;
type Piece = 'queen' | 'king';

function createPiece(material: THREE.MeshStandardMaterial, kind: Piece) {
  const piece = new THREE.Group();
  const bodyProfile = [
    [0, 0], [0.72, 0], [0.84, 0.06], [0.88, 0.16], [0.85, 0.27],
    [0.72, 0.34], [0.73, 0.40], [0.79, 0.45], [0.79, 0.52], [0.65, 0.59],
    [0.59, 0.72], [0.50, 0.96], [0.40, 1.26], [0.33, 1.62], [0.29, 1.96],
    [0.28, 2.26], [0.31, 2.48], [0.43, 2.62], [0.50, 2.66], [0.50, 2.74],
    [0.40, 2.80], [0.32, 2.86],
  ];
  const crownProfile = kind === 'king' ? [
    [0.31, 2.96], [0.35, 3.03], [0.46, 3.10], [0.47, 3.18],
    [0.39, 3.25], [0.33, 3.30], [0.40, 3.43], [0.41, 3.56],
    [0.35, 3.65], [0.25, 3.72], [0, 3.72],
  ] : [
    [0.30, 2.98], [0.35, 3.12], [0.48, 3.28], [0.59, 3.40],
    [0.62, 3.47], [0.61, 3.54], [0.47, 3.59], [0, 3.59],
  ];
  const profile = [...bodyProfile, ...crownProfile]
    .map(([radius, height]) => new THREE.Vector2(radius, height - 2.14));
  piece.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 80), material));

  if (kind === 'king') {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.20, 0.20, 24), material);
    pedestal.position.y = 3.79 - 2.14;
    piece.add(pedestal);
    const cross = new THREE.Group();
    cross.position.y = 4.10 - 2.14;
    cross.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.68, 0.16), material));
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 0.16), material);
    crossbar.position.y = 0.10;
    cross.add(crossbar);
    piece.add(cross);
    piece.rotation.y = 0.35;
    return piece;
  }

  const toothGeometry = new THREE.ConeGeometry(0.12, 0.44, 16);
  const tipGeometry = new THREE.SphereGeometry(0.065, 16, 12);
  for (let index = 0; index < 8; index++) {
    const angle = index * Math.PI / 4;
    const tooth = new THREE.Group();
    tooth.position.set(Math.sin(angle) * 0.51, 3.65 - 2.14, Math.cos(angle) * 0.51);
    tooth.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(Math.sin(angle) * 0.3, 1, Math.cos(angle) * 0.3).normalize(),
    );
    tooth.add(new THREE.Mesh(toothGeometry, material));
    const tip = new THREE.Mesh(tipGeometry, material);
    tip.position.y = 0.22;
    tooth.add(tip);
    piece.add(tooth);
  }

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 0.40, 24), material);
  stem.position.y = 3.77 - 2.14;
  piece.add(stem);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 24), material);
  finial.position.y = 4.10 - 2.14;
  piece.add(finial);
  return piece;
}

export function mountPieceScene(host: HTMLElement): () => void {
  const kind: Piece = host.dataset.piece === 'king' ? 'king' : 'queen';
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch {
    host.hidden = true;
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 30);
  camera.position.set(0, 1.4, 9);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.3));
  for (const [x, y, z, intensity] of [[-4, 6, 5, 4], [4, 1, 3, 1.7], [2, 4, -4, 3]]) {
    const light = new THREE.DirectionalLight(0xffffff, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }

  const material = new THREE.MeshStandardMaterial({
    color: kind === 'king' ? 0x313131 : 0xf2f2f2,
    metalness: kind === 'king' ? 0.15 : 0.35,
    roughness: kind === 'king' ? 0.30 : 0.23,
  });
  const piece = createPiece(material, kind);
  // Rotate the child about local Y; the parent preserves the tilted axis.
  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(kind === 'king' ? TILT_DEGREES : -TILT_DEGREES);
  tilt.add(piece);
  scene.add(tilt);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const halfHeight = 2.75;
    const halfWidth = halfHeight * width / height;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let previousTime: number | undefined;
  let disposed = false;
  const renderFrame = (time: number) => {
    if (previousTime !== undefined) piece.rotation.y += Math.min((time - previousTime) / 1000, 0.05) * SPIN_SPEED;
    previousTime = time;
    renderer.render(scene, camera);
  };
  const updateAnimation = () => {
    if (disposed) return;
    previousTime = undefined;
    renderer.setAnimationLoop(null);
    if (!document.hidden && !reducedMotion.matches) renderer.setAnimationLoop(renderFrame);
    else renderer.render(scene, camera);
  };
  document.addEventListener('visibilitychange', updateAnimation);
  reducedMotion.addEventListener('change', updateAnimation);
  updateAnimation();

  return () => {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    observer.disconnect();
    document.removeEventListener('visibilitychange', updateAnimation);
    reducedMotion.removeEventListener('change', updateAnimation);
    const geometries = new Set<THREE.BufferGeometry>();
    piece.traverse((object) => {
      if (object instanceof THREE.Mesh) geometries.add(object.geometry);
    });
    geometries.forEach((geometry) => geometry.dispose());
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
