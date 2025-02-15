import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 3);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;  // Disable panning so the orbit target stays fixed
controls.enableZoom = true;  // Allow zooming
// Set an initial target; we'll update this after the model loads.
controls.target.set(0, 0, 0);
controls.update();

scene.add(new THREE.AmbientLight(0xffffff));

const loader = new GLTFLoader();
loader.load(
  'static/arm2/scene.gltf',
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.005, 0.005, 0.005);
    // Center the model at the origin.
    model.position.set(0, 0, 0);
    scene.add(model);

    // Compute the model's bounding box center and update OrbitControls target.
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    controls.target.copy(center);
    controls.update();
  },
  undefined,
  (error) => {
    console.error('Error loading model:', error);
  }
);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
