import './style.css'
import { AudioAnalyser } from './audio';
import { ReactiveFlower } from './flowers';
import { Petal } from './petal';
import * as signalR from "@microsoft/signalr";

const canvas = document.getElementById('visualizer') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const audio = document.getElementById('audio-player') as HTMLAudioElement;
const fileInput = document.getElementById('audio-file') as HTMLInputElement;
const particles: Petal[] = [];

let analyser: AudioAnalyser;
const bouquet: ReactiveFlower[] = [];

// SignalR Connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5130/visualizerHub")
    .build();

async function start() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    analyser = new AudioAnalyser(audio);
    for (let i = 0; i < 15; i++) bouquet.push(new ReactiveFlower(i, 15));
    
    await connection.start();
    animate();
}

// Only assign the event if the element actually exists
if (fileInput) {
    fileInput.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            const file = target.files[0];
            audio.src = URL.createObjectURL(file);
        }
    };
} else {
    console.error("Could not find the 'audio-file' element. Check your index.html ID!");
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const intensity = analyser.getSyncData();

    // 1. Spawning Logic: If the bass is heavy (> 0.7), create petals
    if (intensity > 0.7) {
        bouquet.forEach(flower => {
            // Get the tip coordinates from your flower
            const tip = flower.getTipCoordinates(canvas,intensity); 
            const jitterX = (Math.random() - 0.5) * 20;
            const jitterY = (Math.random() - 0.5) * 20;
            particles.push(new Petal(tip.x + jitterX, tip.y + jitterY, 350));
        });
    }
    

    // 2. Update and Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);
        
        // Remove dead particles to save memory
        if (p.isDead) particles.splice(i, 1);
    }

    bouquet.forEach(f => f.draw(ctx, intensity, canvas));
    requestAnimationFrame(animate);
}
const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.onclick = () => {
        start();
        audio.play();
    };
}
