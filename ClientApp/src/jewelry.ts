import * as THREE from 'three';
import { gsap } from 'gsap'; // Ensure you ran: npm install gsap

let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
let heartMesh: THREE.Mesh, particleSystem: THREE.Group;
let analyser: AnalyserNode, audioContext: AudioContext;
let isPlaying = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isPaused = false;

const container = document.getElementById('canvas-container') as HTMLElement;
const upload = document.getElementById('audio-upload') as HTMLInputElement;
const contDev = document.getElementsByClassName('controls')[0] as HTMLElement;


let particlesGeometry: THREE.BufferAttribute;
let dollarPoints: THREE.Vector3[] = [];
let heartPoints: THREE.Vector3[] = [];
let currentShape: 'heart' | 'dollar' = 'heart';
let dollarMesh: THREE.Mesh;
let dollarParticles: THREE.Object3D; // Particles for the $ sign
let heartParticles: THREE.Object3D;  // Particles for the Heart (your original system)
const particleCount = 2000;


function init() {

    initShapes(); // Important!
    // ... your existing scene/camera/renderer code ...
    
    const btn = document.getElementById('accountant-toggle');
    btn?.addEventListener('click', toggleShape);
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


dollarMesh = createJewelDollar();
scene.add(dollarMesh);

    heartParticles = createHeartPathParticles();
    //scene.add(particleSystem);
    heartMesh.add(heartParticles);

    dollarParticles = createDollarPathParticles(); // Now it will find the name!
    dollarMesh.add(dollarParticles);
    // 3. THE HEART-SHAPED PARTICLE PATH
    

    window.addEventListener('pointerdown', (event) => {
    // 1. Calculate mouse position in "Normalized Device Coordinates" (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 2. Update the raycaster
    raycaster.setFromCamera(mouse, camera);

    // 3. Check if we hit the heart
    const intersects = raycaster.intersectObjects([heartMesh, dollarMesh]);
    if (intersects.length > 0) {
        togglePlayPause();
    }
window.onload = startIntroSequence;
    
});

// Ensure dollar items start invisible
    dollarMesh.scale.set(0, 0, 0);
    (dollarMesh.material as THREE.Material).opacity = 0;
    
    // Force dollar particles to start invisible
    dollarParticles.children.forEach(p => {
        ((p as THREE.Mesh).material as THREE.Material).opacity = 0;
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

function createHeartPathParticles(): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    // Initial positions start at Heart
    heartPoints.forEach((p, i) => {
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry = geometry.getAttribute('position') as THREE.BufferAttribute;

    const mat = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 0.05,
        transparent: true,
        blending: THREE.AdditiveBlending 
    });

    const points = new THREE.Points(geometry, mat);
    points.frustumCulled = false;
    return points;
}

// Heart Path Formula (Parametric)
function getHeartPoint(t: number) {
    const angle = t * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(angle), 3);
    const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
    return { x: x * 0.4, y: y * 0.4 }; // Scale down to fit scene
}

let currentSpeed = 0.005;
function animate() {
    requestAnimationFrame(animate);

    let intensity = 0;
    
    // 1. MUSIC DATA: Get the volume/frequency data
    if (isPlaying && analyser && !isPaused) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        // Calculate average intensity (0 to 1)
        intensity = dataArray.reduce((a, b) => a + b, 0) / (dataArray.length * 128);
    }
heartParticles.children.forEach((obj) => {
        const p = obj as THREE.Mesh;
        const d = p.userData;
        d.t += currentSpeed * 0.05;
        if (d.t > 1) d.t = 0;
        const pos = getHeartPoint(d.t); // Your heart math
        p.position.set(pos.x + d.driftX, pos.y + d.driftY, d.driftZ);
    });

    // Move Dollar Particles (New Logic)
dollarParticles.children.forEach((obj) => {
        const p = obj as THREE.Mesh;
        const d = p.userData;
        d.t += currentSpeed * 0.2; 
        if (d.t > 1) d.t = 0;
        const pos = getDollarPoint(d.t); // Use the new segment math
        p.position.set(pos.x + d.driftX, pos.y + d.driftY, d.driftZ);
    });
    // 2. SPEED: Calculate how fast to spin (0.005 is idle, goes up with music)
    let targetSpeed = isPaused ? 0 : 0.005 + (intensity * 0.15);
    currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, 0.1);

    // 3. ROTATION: Rotate the main heart and the particle cloud
    heartMesh.rotation.y += currentSpeed;
    dollarMesh.rotation.y += currentSpeed;
    // if (particleSystem) {
    //     particleSystem.rotation.y += 0.01;
    // }

    // 4. SYNC DATA: This is crucial! Tells Three.js to show the morphing 
    // progress happening in the GSAP toggle function.
    if (particlesGeometry) {
        particlesGeometry.needsUpdate = true;
    }

    // 5. PULSE: Scale the heart mesh based on the music beat
    // const targetScale = isPaused ? 1 : 1 + (intensity * 0.2);
    // heartMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

const pulse = 1 + (intensity * 0.2);
    if (currentShape === 'heart') {
        heartMesh.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.1);
    } else {
        dollarMesh.scale.lerp(new THREE.Vector3(pulse, pulse, pulse), 0.1);
    }
    renderer.render(scene, camera);
}

function togglePlayPause() {
    if (!audioContext) return;

    if (audioContext.state === 'running') {
        audioContext.suspend();
        isPaused = true;
        isPlaying = false; // Stops the music visualizer data
                    upload.style.display = 'block';
            contDev.style.display='block';
        showSurprise();
    } else if (audioContext.state === 'suspended') {
        audioContext.resume();
        isPaused = false;
        isPlaying = true;
                    upload.style.display = 'none';
            contDev.style.display='none';
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
            contDev.style.display='none';
        };
        reader.readAsArrayBuffer(file);
    }
};

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

async function startIntroSequence() {
    const textContainer = document.getElementById('intro-text') as HTMLElement;
    const overlay = document.getElementById('intro-container') as HTMLElement;

    // Helper to run one "Slam" cycle
  async function slamSequence(newText: string) {
    const textContainer = document.getElementById('intro-text') as HTMLElement;
    const coreText = document.getElementById('core-text') as HTMLElement;

    if (!textContainer || !coreText) return;

    // --- PHASE 1: THE SLOW SQUEEZE ---
    // Bars move in, letters huddle, and the word gets "thinner"
    textContainer.style.gap = "0px";
    coreText.style.letterSpacing = "-5px"; // Letters huddle
    coreText.style.transform = "scaleX(0.7) scaleY(1.1)"; // Squashed look
    
    // Wait for the slow 2s movement to finish
    await new Promise(res => setTimeout(res, 2000));

    // --- PHASE 2: THE TRANSFORMATION (POP) ---
    // Change the word and briefly "Pop" it to show the change
    coreText.innerHTML = newText;
    coreText.style.transform = "scale(1.4)"; // Sudden expansion
    coreText.style.letterSpacing = "2px";
    
    await new Promise(res => setTimeout(res, 400));

    // --- PHASE 3: THE RECOIL ---
    // Return everything to the original elegant state
    textContainer.style.gap = "20px";
    coreText.style.letterSpacing = "5px";
    coreText.style.transform = "scale(1)"; 

    // Wait for the bars to finish moving out before next sequence
    await new Promise(res => setTimeout(res, 2000));
}

    // --- The actual timeline ---
    
    await new Promise(res => setTimeout(res, 1500)); // Initial wait

    // Step 1: i love you -> i ❤️ you
    await slamSequence('i <span class="heart-icon">❤️</span> you');

    await new Promise(res => setTimeout(res, 1000));

    // Step 2: i ❤️ you -> i ❤️ u
    await slamSequence('i <span class="heart-icon">❤️</span> u');

    await new Promise(res => setTimeout(res, 1000));

    // Final Step: Complete Collapse into 3D Reveal
    textContainer.style.gap = "0px";
    // coreText.innerHTML = '<span class="heart-icon" style="font-size: 5rem;">❤️</span>';
    await slamSequence('<span class="heart-icon" style="font-size: 5rem;">❤️</span>');
    // document.querySelectorAll('.bar').forEach(b => (b as HTMLElement).style.opacity = '0');

    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {init();overlay.style.display = 'none'; }, 1500);
    }, 2000);
}
function showSurprise() {
    const modal = document.getElementById('surprise-modal');
    const ledger = document.getElementById('ledger-modal');
    if (currentShape === 'dollar') {
        // Show the Accountant Surprise
        if (ledger) ledger.style.display = 'block';
    } else {
    if(modal) modal.style.display = 'block';
    }
}
function initShapes() {
    for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;

        // Heart Math (Parametric)
        const angle = t * Math.PI * 2;
        const hX = 16 * Math.pow(Math.sin(angle), 3) * 0.4;
        const hY = (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) * 0.4;
        heartPoints.push(new THREE.Vector3(hX, hY, (Math.random() - 0.5) * 1.5));

        // Dollar Math
        const sT = (t < 0.2) ? (t / 0.2) : (t - 0.2) / 0.8; 
        if (t < 0.2) {
            dollarPoints.push(new THREE.Vector3(0, (sT * 8 - 4), (Math.random() - 0.5) * 1.5));
        } else {
            const sAngle = sT * Math.PI * 2.5;
            const dX = Math.sin(sAngle) * 3;
            const dY = (sT * 10 - 5);
            dollarPoints.push(new THREE.Vector3(dX, dY, (Math.random() - 0.5) * 1.5));
        }
    }
}
function toggleShape() {
    const isToDollar = currentShape === 'heart';
    const auditGrid = document.getElementById('audit-grid');

    if (isToDollar) {
        // EXIT HEART
        gsap.to(heartMesh.scale, { x: 0, y: 0, z: 0, duration: 1 });
        heartParticles.children.forEach(p => {
            gsap.to((p as THREE.Mesh).material, { opacity: 0, duration: 0.5 });
        });

        // ENTER DOLLAR
        gsap.to(dollarMesh.scale, { x: 1, y: 1, z: 1, duration: 1.2, delay: 0.3 });
        gsap.to(dollarMesh.material, { opacity: 0.9, metalness: 1, roughness: 0.1, duration: 1.5 });
        dollarParticles.children.forEach(p => {
            gsap.to((p as THREE.Mesh).material, { opacity: 1, duration: 1, delay: 0.5 });
        });
        gsap.to(dollarMesh.rotation, { y: Math.PI * 2, duration: 1, delay: 0.2 });
        
        currentShape = 'dollar';
        // Show the Audit Grid
        if (auditGrid) auditGrid.style.opacity = "1";
        
        // Optional: Make the background slightly lighter green-grey
        document.body.style.backgroundColor = "#0a0f0c";
    } else {
        // EXIT DOLLAR
        gsap.to(dollarMesh.scale, { x: 0, y: 0, z: 0, duration: 1 });
        dollarParticles.children.forEach(p => {
            gsap.to((p as THREE.Mesh).material, { opacity: 0, duration: 0.5 });
        });

        // ENTER HEART
        gsap.to(heartMesh.scale, { x: 1, y: 1, z: 1, duration: 1.2, delay: 0.3 });
        gsap.to(heartMesh.material, { opacity: 0.9, metalness: 0, roughness: 0.5, duration: 1.5 });
        heartParticles.children.forEach(p => {
            gsap.to((p as THREE.Mesh).material, { opacity: 1, duration: 1, delay: 0.5 });
        });
        
        currentShape = 'heart';
        // Hide the Audit Grid
        if (auditGrid) auditGrid.style.opacity = "0";
        
        // Back to Romantic Black
        document.body.style.backgroundColor = "#000000";
    }
}
function createJewelDollar(): THREE.Mesh {
    const dollarGroup = new THREE.Group();

    // 1. MATERIAL: Using the "Excel" Green you wanted for the accountant theme
    const material = new THREE.MeshPhongMaterial({
        color: 0x217346,
        emissive: 0x0a2212,
        specular: 0xffffff,
        shininess: 100,
        flatShading: true, // Crucial for the "Jewel" facet effect
        transparent: true,
        opacity: 0
    });

    // 2. THE "S" SEGMENTS: Using Boxes to ensure it looks sharp and digital
    const horizontalGeo = new THREE.BoxGeometry(5, 1.5, 0.8);
    const verticalGeo = new THREE.BoxGeometry(1.5, 3, 0.8);

    // Top Bar
    const topBar = new THREE.Mesh(horizontalGeo, material);
    topBar.position.y = 4;
    
    // Middle Bar
    const midBar = new THREE.Mesh(horizontalGeo, material);
    midBar.position.y = 0;

    // Bottom Bar
    const botBar = new THREE.Mesh(horizontalGeo, material);
    botBar.position.y = -4;

    // Top-Left Connector
    const topLeft = new THREE.Mesh(verticalGeo, material);
    topLeft.position.set(-1.75, 2, 0);

    // Bottom-Right Connector
    const botRight = new THREE.Mesh(verticalGeo, material);
    botRight.position.set(1.75, -2, 0);

    // 3. THE VERTICAL STRIKE (The "Money" Line)
    const strikeGeo = new THREE.BoxGeometry(0.8, 12, 1.2); // Slightly deeper to stand out
    const strike = new THREE.Mesh(strikeGeo, material);

    // Add all parts to a single group
    dollarGroup.add(topBar, midBar, botBar, topLeft, botRight, strike);

    // Wrap the group in a Mesh-like container for your existing logic
    const wrapper = new THREE.Mesh(); 
    wrapper.add(dollarGroup);
    wrapper.scale.set(0, 0, 0);
    
    // We assign the material to the wrapper so GSAP can find it
    wrapper.material = material; 
    
    return wrapper;
}
function getDollarPoint(t: number) {
    // We divide t (0 to 1) into 6 sections
    if (t < 0.2) {
        // 1. The Vertical Strike (Center Line)
        const p = t / 0.2;
        return { x: 0, y: 12 * p - 6 }; 
    } else if (t < 0.36) {
        // 2. Top Curve/Bar
        const p = (t - 0.2) / 0.16;
        return { x: 4 * Math.cos(p * Math.PI), y: 5 + Math.sin(p * Math.PI) * 0.5 };
    } else if (t < 0.52) {
        // 3. Top-Left Vertical
        const p = (t - 0.36) / 0.16;
        return { x: -4, y: 5 - 5 * p };
    } else if (t < 0.68) {
        // 4. Middle Bar
        const p = (t - 0.52) / 0.16;
        return { x: -4 + 8 * p, y: 0 };
    } else if (t < 0.84) {
        // 5. Bottom-Right Vertical
        const p = (t - 0.68) / 0.16;
        return { x: 4, y: 0 - 5 * p };
    } else {
        // 6. Bottom Curve/Bar
        const p = (t - 0.84) / 0.16;
        return { x: 4 * Math.cos(p * Math.PI + Math.PI), y: -5 - Math.sin(p * Math.PI) * 0.5 };
    }
}
function createDollarPathParticles(): THREE.Group {
    const group = new THREE.Group();
    const particleCount = 2000; 
    const geo = new THREE.SphereGeometry(0.015, 4, 4); 

    for (let i = 0; i < particleCount; i++) {
       const mat = new THREE.MeshBasicMaterial({ 
            color: 0xccffcc, // Very light green glitter
            transparent: true, 
            opacity: 0, 
            blending: THREE.AdditiveBlending 
        });
        const p = new THREE.Mesh(geo, mat);
        
        p.userData = { 
            t: Math.random(), 
            speed: 0.005 + Math.random() * 0.01,
            driftX: (Math.random() - 0.5) * 0.8,
            driftY: (Math.random() - 0.5) * 0.8,
            driftZ: (Math.random() - 0.5) * 1.5
        };
        group.add(p);
    }
    return group;
}
window.addEventListener('DOMContentLoaded', startIntroSequence);
