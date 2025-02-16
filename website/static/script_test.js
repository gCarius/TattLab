import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
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


// Top Light (shines downward)
const topLight = new THREE.DirectionalLight(0xffffff, 1);
topLight.position.set(0, 10, 0);
topLight.target.position.set(0, 0, 0);
scene.add(topLight);
scene.add(topLight.target);

// Bottom Light (shines upward)
const bottomLight = new THREE.DirectionalLight(0xffffff, 1);
bottomLight.position.set(0, -10, 0);
bottomLight.target.position.set(0, 0, 0);
scene.add(bottomLight);
scene.add(bottomLight.target);

// Front Light (shines from front to back)
const frontLight = new THREE.DirectionalLight(0xffffff, 1);
frontLight.position.set(0, 0, 10);
frontLight.target.position.set(0, 0, 0);
scene.add(frontLight);
scene.add(frontLight.target);

// Back Light (shines from back to front)
const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(0, 0, -10);
backLight.target.position.set(0, 0, 0);
scene.add(backLight);
scene.add(backLight.target);

const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

// Global reference for the arm model
let armModel = null;
let uploadedTexture = null;
let placingDecal = false; // State for decal placement mode

// Load the arm model
const loader = new GLTFLoader();
loader.load(
  'static/arm2/scene.gltf',
  (gltf) => {
    armModel = gltf.scene;
    armModel.scale.set(0.005, 0.005, 0.005);
    armModel.position.set(0, 0, 0);
    scene.add(armModel);

    armModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0xffcba3 });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Update controls target
    const box = new THREE.Box3().setFromObject(armModel);
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

// Raycaster setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Function to handle decal placement
function onDocumentMouseDown(event) {
  if (!placingDecal || !armModel || !uploadedTexture) return;

  // Convert mouse position to normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Perform raycasting
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(armModel, true);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    const position = intersect.point.clone();
    const orientation = new THREE.Quaternion();
    orientation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), intersect.face.normal);
    const size = new THREE.Vector3(0.12, 0.08, 0.1);

    const decalGeometry = new DecalGeometry(intersect.object, position, orientation, size);
    const decalMaterial = new THREE.MeshPhongMaterial({
      map: uploadedTexture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -8
    });

    const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    scene.add(decalMesh);

    // Exit decal placement mode
    placingDecal = false;
    console.log('Decal placed at:', position);
  }
}

// Function to enable decal placement mode
function enableDecalPlacement() {
  if (!uploadedTexture) {
    console.error('No texture uploaded yet.');
    return;
  }
  placingDecal = true;
  console.log('Click on the model to place the decal.');
}

document.getElementById("save-btn").addEventListener("click", function () {
  setTimeout(enableDecalPlacement, 500);
});

document.addEventListener('dblclick', onDocumentMouseDown);

// Handle image upload and create texture
document.getElementById('upload').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();    
    reader.onload = function (e) {
      const textureLoader = new THREE.TextureLoader();
      uploadedTexture = textureLoader.load(e.target.result, () => {
        console.log('Image texture loaded successfully.');
      });
    };
    reader.readAsDataURL(file);
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
