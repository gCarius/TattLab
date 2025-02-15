import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, armModel, controls;
init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 2);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const loader = new GLTFLoader();
    loader.load('/static/model.glb', function (gltf) {
        armModel = gltf.scene;
        scene.add(armModel);
    });

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(2, 2, 5);
    scene.add(light);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

document.getElementById('upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    fetch('/process_image', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        const texture = new THREE.TextureLoader().load("data:image/png;base64," + data.image_data);
        applyTattoo(texture);
    })
    .catch(error => console.error('Error processing image:', error));
});

function applyTattoo(texture) {
    if (!armModel) return;

    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(0.2, 0.2);
    const tattoo = new THREE.Mesh(geometry, material);

    tattoo.position.set(0, 0.5, 0);
    scene.add(tattoo);
}
