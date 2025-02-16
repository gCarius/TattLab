import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

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

// Global reference for the arm model and canvas texture elements
let armModel = null;
let baseCanvas = document.createElement('canvas');
baseCanvas.width = 1024;
baseCanvas.height = 1024;
let baseCtx = baseCanvas.getContext('2d');

// Fill the canvas with a base color (white, for example)
baseCtx.fillStyle = '#ffffff';
baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

// Create a THREE.CanvasTexture from the canvas
const canvasTexture = new THREE.CanvasTexture(baseCanvas);
canvasTexture.needsUpdate = true;

// Load the arm model via GLTFLoader (using a GLB file)
const loader = new GLTFLoader();
loader.load(
  'static/armflex.glb',
  (gltf) => {
    armModel = gltf.scene;
    armModel.scale.set(0.7, 0.7, 0.7);
    armModel.position.set(0, 0, 0);
    scene.add(armModel);

    // Traverse the model and update each mesh's material to use the canvas texture
    armModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshPhongMaterial({
          map: canvasTexture,
          transparent: true
        });
      }
    });

    // Update OrbitControls target based on the model's bounding box center.
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

// Raycaster and mouse vector for interactive tattoo placement
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Shoot function: paints the tattoo onto the canvas at the UV location.
function shoot(uv) {
  // Convert UV coordinates (range 0-1) to canvas coordinates.
  const x = uv.x * baseCanvas.width;
  const y = (1 - uv.y) * baseCanvas.height; // Flip Y since canvas origin is top-left
  
  // Create an image element for the tattoo.
  const tattooImage = new Image();
  tattooImage.src = 'static/tattoo.png';
  tattooImage.onload = () => {
    // Determine the size (in pixels) for the tattoo; adjust as needed.
    const tattooWidth = 100;
    const tattooHeight = 100;
    
    // Draw the tattoo image onto the canvas, centered at (x, y).
    baseCtx.drawImage(tattooImage, x - tattooWidth / 2, y - tattooHeight / 2, tattooWidth, tattooHeight);
    
    // Mark the canvas texture as needing an update.
    canvasTexture.needsUpdate = true;
    console.log('Tattoo painted at UV:', uv);
  };
  tattooImage.onerror = (err) => {
    console.error('Error loading tattoo image:', err);
  };
}

// Listen for click events to place the tattoo.
window.addEventListener('click', (event) => {
  if (!armModel) return;
  
  // Convert mouse position to normalized device coordinates.
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  
  // Raycast against the arm model.
  const intersects = raycaster.intersectObject(armModel, true);
  if (intersects.length > 0) {
    const intersect = intersects[0];
    // Check if the intersection provides UV coordinates.
    if (intersect.uv) {
      console.log('Intersection UV:', intersect.uv);
      shoot(intersect.uv);
    } else {
      console.warn('No UV data found on the intersected face.');
    }
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
