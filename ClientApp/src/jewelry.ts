import * as THREE from 'three';

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
let heartMesh: THREE.Mesh, particleSystem: THREE.Group;
let analyser: AnalyserNode, dataArray: Uint8Array, audioContext: AudioContext;
let isPlaying = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isPaused = false;

const container = document.getElementById('canvas-container') as HTMLElement;
const upload = document.getElementById('audio-upload') as HTMLInputElement;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 12;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 1. LIGHTING (Crucial for the jewel look)
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(0xff0077, 10, 50);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const whiteLight = new THREE.PointLight(0xffffff, 5, 50);
    whiteLight.position.set(-5, 5, 10);
    scene.add(whiteLight);

    // 2. THE JEWEL HEART (Faceted and Glowing)
    heartMesh = createJewelHeart();
    scene.add(heartMesh);

    // 3. THE HEART-SHAPED PARTICLE PATH
    particleSystem = createHeartPathParticles();
    //scene.add(particleSystem);
    heartMesh.add(particleSystem);

    window.addEventListener('pointerdown', (event) => {
    // 1. Calculate mouse position in "Normalized Device Coordinates" (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 2. Update the raycaster
    raycaster.setFromCamera(mouse, camera);

    // 3. Check if we hit the heart
    const intersects = raycaster.intersectObject(heartMesh);

    if (intersects.length > 0) {
        togglePlayPause();
    }
});

    window.addEventListener('resize', onResize);
    animate();
}

function createJewelHeart(): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0, 1.5, 2, 3, 3, 1.5);
    shape.bezierCurveTo(4, 0, 1.5, -2, 0, -3.5);
    shape.bezierCurveTo(-1.5, -2, -4, 0, -3, 1.5);
    shape.bezierCurveTo(-2, 3, 0, 1.5, 0, 0);

    const extrudeSettings = { depth: 0.8, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 3 };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();

    const material = new THREE.MeshPhongMaterial({
        color: 0xff4488,
        emissive: 0x440022,
        specular: 0xffffff,
        shininess: 100,
        flatShading: true,
        transparent: true,
        opacity: 0.9
    });

    return new THREE.Mesh(geometry, material);
}

function createHeartPathParticles(): THREE.Group {
    const group = new THREE.Group();
    const particleCount = 2000; // Much higher density
    
    // Make particles even smaller so they look like fine glitter
    const geo = new THREE.SphereGeometry(0.015, 4, 4); 

    for (let i = 0; i < particleCount; i++) {
        const mat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff, 
            transparent: true,
            blending: THREE.AdditiveBlending // Makes overlapping particles glow brighter
        });
        
        const p = new THREE.Mesh(geo, mat);
        
        p.userData = { 
            t: Math.random(), 
            speed: 0.005 + Math.random() * 0.01,
            // Add unique jitter values so they stay spread out
            driftX: (Math.random() - 0.5) * 0.8,
            driftY: (Math.random() - 0.5) * 0.8,
            driftZ: (Math.random() - 0.5) * 1.5
        };
        group.add(p);
    }
    return group;
}

// Heart Path Formula (Parametric)
function getHeartPoint(t: number) {
    const angle = t * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(angle), 3);
    const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
    return { x: x * 0.4, y: y * 0.4 }; // Scale down to fit scene
}

const clock = new THREE.Clock();
let currentSpeed = 0.005;
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    let intensity = 0;
    
    // Only calculate music data if not paused
    if (isPlaying && analyser && !isPaused) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        intensity = dataArray.reduce((a, b) => a + b, 0) / (dataArray.length * 128);
    }

    // SPEED LOGIC
    let targetSpeed = 0;
    if (!isPaused) {
        // If not paused, use our slow idle or fast active speed
        targetSpeed = 0.005 + (intensity * 0.15 );
    } else {
        // If paused, target speed is zero
        targetSpeed = 0;
    }

    // Lerp to the target speed (makes the stop feel smooth, not jerky)
    currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, 0.1);

    // Apply rotation and particle movement
    heartMesh.rotation.y += currentSpeed;
    
    particleSystem.children.forEach((obj) => {
        const p = obj as THREE.Mesh;
        const d = p.userData;
        d.t += currentSpeed * 0.05;
        if (d.t > 1) d.t = 0;
        
        const pos = getHeartPoint(d.t);
        p.position.x = pos.x + d.driftX;
        p.position.y = pos.y + d.driftY;
        p.position.z = d.driftZ;
    });

    // Pulse only works when music is playing
    const targetScale1 = isPaused ? 1 : 1 + (intensity * 0.2);
    heartMesh.scale.lerp(new THREE.Vector3(targetScale1, targetScale1, targetScale1), 0.1);

    renderer.render(scene, camera);
}

function togglePlayPause() {
    if (!audioContext) return;

    if (audioContext.state === 'running') {
        audioContext.suspend();
        isPaused = true;
        isPlaying = false; // Stops the music visualizer data
    } else if (audioContext.state === 'suspended') {
        audioContext.resume();
        isPaused = false;
        isPlaying = true;
    }
}
// --- Audio Handling ---
upload.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
        // Create context if it doesn't exist
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Resume in case it was suspended by the browser
        audioContext.resume();

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const buffer = await audioContext.decodeAudioData(ev.target?.result as ArrayBuffer);
            const source = audioContext.createBufferSource();
            
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256; // Smaller FFT for faster, snappier response

            source.buffer = buffer;
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            source.start(0);
            isPlaying = true;
            
            // Optional: Hide the upload button once playing to clean up the UI
            upload.style.display = 'none';
        };
        reader.readAsArrayBuffer(file);
    }
};

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

init();