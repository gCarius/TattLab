import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ----- Renderer, Scene & Camera -----
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

// ----- Orbit Controls -----
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

scene.add(new THREE.AmbientLight(0xffffff));

// ----- Canvas Texture Setup -----
// Create a canvas that will serve as the texture for the arm model.
let baseCanvas = document.createElement('canvas');
baseCanvas.width = 1024;
baseCanvas.height = 1024;
let baseCtx = baseCanvas.getContext('2d');
// Fill with a base color (white, for example)
baseCtx.fillStyle = '#ffffff';
baseCtx.fillRect(0, 0, baseCanvas.width, baseCanvas.height);

const canvasTexture = new THREE.CanvasTexture(baseCanvas);
canvasTexture.needsUpdate = true;

// ----- Global Variables -----
let armModel = null;
let uploadedTattooImage = null; // The image uploaded by the user to be used as tattoo.
let placingTattoo = false;      // Flag for placement mode
let sizeValue = 1;

// ----- Load the Arm Model -----
// (Using the GLB from the UV tattoo processing version)
const loader = new GLTFLoader();
loader.load(
  'static/armflex.glb',
  (gltf) => {
    armModel = gltf.scene;
    armModel.scale.set(0.7, 0.7, 0.7);
    armModel.position.set(0, 0, 0);
    scene.add(armModel);

    // Use the canvas texture for every mesh in the model.
    armModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshPhongMaterial({
          map: canvasTexture,
          transparent: true,
          color: 0xffcba3 // No quotes around the hex value
        });
        
        child.castShadow = true;
        child.receiveShadow = true;

      }
    });

    // Update OrbitControls target based on model’s bounding box.
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

// ----- Raycaster & Mouse -----
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ----- Tattoo Painting Function -----
// Given the UV coordinates from a raycast, convert to canvas coordinates and paint the tattoo.
function shoot(uv) {
  // Convert UV (0 to 1) to canvas pixel coordinates.
  const x = uv.x * baseCanvas.width;
  const y = (1 - uv.y) * baseCanvas.height; // Flip Y because canvas origin is top-left

  // Use the uploaded image as the tattoo.
  if (!uploadedTattooImage) {
    console.error('No tattoo image available.');
    return;
  }
  
  // Determine tattoo size in pixels.
  const tattooWidth = 100 * sizeValue;
  const tattooHeight = 100 * sizeValue;
  
  // Draw the tattoo image centered at (x, y)
  baseCtx.drawImage(
    uploadedTattooImage,
    x - tattooWidth / 2,
    y - tattooHeight / 2,
    tattooWidth,
    tattooHeight
  );
  
  // Notify the canvas texture to update.
  canvasTexture.needsUpdate = true;
  console.log('Tattoo painted at UV:', uv);
}

// ----- Event: Upload Tattoo Image -----
// Listen to changes on the file input to load the image dynamically.
document.getElementById('upload').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();    
    reader.onload = function (e) {
      // Create a new image using the loaded data URL.
      const img = new Image();
      img.onload = () => {
        uploadedTattooImage = img;
        console.log('Tattoo image loaded successfully.');
      };
      img.onerror = (err) => {
        console.error('Error loading tattoo image:', err);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// ----- Event: Enable Placement Mode -----
// When the user clicks the "save" button, allow one tattoo placement (after a slight delay).
document.getElementById("save-btn").addEventListener("click", function () {
  if (!uploadedTattooImage) {
    console.error('Please upload a tattoo image first.');
    return;
  }
  setTimeout(() => {
    placingTattoo = true;
    console.log('Tattoo placement enabled. Double click on the model to place the tattoo.');
  }, 500);
});

// ----- Event: Place Tattoo on Double Click -----
// Only act if we’re in placement mode.
document.addEventListener('dblclick', (event) => {
  if (!placingTattoo || !armModel) return;
  
  // Convert mouse coordinates to normalized device coordinates.
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Raycast against the arm model.
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(armModel, true);
  if (intersects.length > 0) {
    const intersect = intersects[0];
    if (intersect.uv) {
      shoot(intersect.uv);
    } else {
      console.warn('No UV data found on the intersected face.');
    }
    // Disable placement mode after one tattoo is placed.
    placingTattoo = false;
  }
});

document.getElementById("save-btn").addEventListener("click", function () {
  sizeValue = document.getElementById("size").value;
  console.log("Selected size:", sizeValue);
});


// ----- Handle Window Resize -----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ----- Animation Loop -----
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
