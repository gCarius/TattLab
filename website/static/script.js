import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

// Create scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 3);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = true;
controls.target.set(0, 0, 0);
controls.update();

// Ambient light
scene.add(new THREE.AmbientLight(0xffffff));

// Global reference for the arm model
let armModel = null;

// Load the arm model via GLTFLoader
const loader = new GLTFLoader();
loader.load(
  'static/arm2/scene.gltf',
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(0.005, 0.005, 0.005);
    model.position.set(0, 0, 0);
    scene.add(model);
    armModel = model; // Use entire model for raycasting

    // Update OrbitControls target based on model's bounding box center.
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

// Raycaster and mouse vector for interactive decal placement
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Listen for click events
window.addEventListener('click', (event) => {
  console.log('Click event:', event.clientX, event.clientY);
  if (!armModel) {
    console.error('Arm model not loaded.');
    return;
  }

  // Convert mouse position to normalized device coordinates.
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  console.log('Normalized mouse:', mouse.x, mouse.y);

  raycaster.setFromCamera(mouse, camera);
  // Raycast against the entire arm model (all children)
  const intersects = raycaster.intersectObject(armModel, true);
  console.log('Intersections:', intersects.length);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    console.log('Intersection point:', intersect.point);

    // Offset the intersection point along the face normal to prevent clipping.
    const offset = intersect.face.normal.clone().multiplyScalar(0.02);
    const position = intersect.point.clone().add(offset);

    // Create a quaternion that aligns decal's forward vector (0,0,1) with the face normal.
    const orientation = new THREE.Quaternion();
    orientation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), intersect.face.normal);

    // Adjust decal size (tweak these values as needed).
    const size = new THREE.Vector3(0.12, 0.08, 0.1);

    // Create the decal geometry on the intersected mesh.
    const decalGeometry = new DecalGeometry(intersect.object, position, orientation, size);
    console.log('Decal geometry vertex count:', decalGeometry.attributes.position.count);

    // Load the tattoo texture from tattoo.png.
    const tattooTexture = new THREE.TextureLoader().load(
      'static/tattoo.png',
      () => { console.log('tattoo.png loaded successfully'); },
      undefined,
      (err) => { console.error('Error loading tattoo.png:', err); }
    );

    // Create a material using the tattoo texture.
    const decalMaterial = new THREE.MeshPhongMaterial({
      map: tattooTexture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -8 // increased factor to push the decal further out
    });

    // Create the decal mesh and add it to the scene.
    const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    scene.add(decalMesh);
  } else {
    console.log('No intersections found.');
  }
});

// Resize event handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
