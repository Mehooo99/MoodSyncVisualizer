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
let myFlowerIndex: number = -1;
let totalFlowersOnline: number = 0;
const bouquet: Map<number, { flower: ReactiveFlower, intensity: number }> = new Map();

// SignalR Connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5130/visualizerHub",{
      transport: signalR.HttpTransportType.WebSockets
    })
    .build();
    const userCountEl = document.getElementById('user-count');

connection.on("UpdateTotalFlowers", (count: number) => {
    totalFlowersOnline = count;

    ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    bouquet.clear();

    // 2. Rebuild the garden from scratch with fresh indices
    for (let i = 0; i < totalFlowersOnline; i++) {
        bouquet.set(i, { 
            flower: new ReactiveFlower(i, totalFlowersOnline), 
            intensity: 0 
        });
    }
    if (userCountEl) userCountEl.innerText = count.toString();
    // Smoothly rebuild the garden
    syncBouquetArray();
});
connection.on("AssignFlower", (index: number) => {
    myFlowerIndex = index;
    console.log(`You are flower #${index}`);
});
    await connection.start();

    async function start() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    analyser = new AudioAnalyser(audio);
    // for (let i = 0; i < 15; i++) bouquet.push(new ReactiveFlower(i, 15));
    animate();
}





connection.on("ReceiveRemoteBeat", (flowerIndex: number, intensity: number) => {
    const flowerData = bouquet.get(flowerIndex);
    if (flowerData) {
        flowerData.intensity = intensity;
    }
});

function syncBouquetArray() {
    // Clear and rebuild flowers based on the new total count
    bouquet.clear();
    for (let i = 0; i < totalFlowersOnline; i++) {
        bouquet.set(i, { 
            flower: new ReactiveFlower(i, totalFlowersOnline), 
            intensity: 0 
        });
    }
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


let animationId: number;

function startAnimation() {
    // 1. Prevent multiple loops from running at once
    if (animationId) cancelAnimationFrame(animationId);

    // 2. Start the recursive loop
    animationId = requestAnimationFrame(animate);
}


function animate() {

  ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const localIntensity = analyser ? analyser.getSyncData() : 0;

// 1. Send your local beat to the server
    if (localIntensity > 0.1) {
        connection.invoke("SendBeat", localIntensity);
    }
    // 2. Draw the whole garden
    bouquet.forEach((data, index) => {
        // If it's your flower, use local data for zero latency
        const isMine = (index === myFlowerIndex);
    const displayIntensity = isMine ? localIntensity : data.intensity;
        
        data.flower.draw(ctx, displayIntensity, canvas,isMine);

        // Spawn petals for anyone who is "peaking"
        if (displayIntensity > 0.7) {
            const tip = data.flower.getTipCoordinates(canvas, displayIntensity);
            for (let i = 0; i < 2; i++) {
                const jitterX = (Math.random() - 0.5) * 20;
                const jitterY = (Math.random() - 0.5) * 20;
                // Hue 350 is Pink/Red
                particles.push(new Petal(tip.x + jitterX, tip.y + jitterY, 350));
            }
        }
    });

    // ... update particles ...
  //
  //
  //
  for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(ctx);

        if (p.isDead || particles.length > 300) {
            particles.splice(i, 1);
        }
    }
    animationId =  requestAnimationFrame(animate);
    const intensityBar = document.getElementById('intensity-bar');
    if (intensityBar) {
      // Convert 0.0-1.0 to 0%-100%
         intensityBar.style.width = `${localIntensity * 100}%`;
    }

}
const startBtn = document.getElementById('start-btn');
if (startBtn) {
    startBtn.onclick = () => {
        start();
        audio.play();
        startAnimation();
    };
}
const stopBtn = document.getElementById('stop-btn');

if (stopBtn) {
    stopBtn.onclick = () => {
        // 1. Stop the audio element
        audio.pause();
        //audio.currentTime = 0;
 ctx.fillStyle = 'rgba(5, 5, 5, 0.15)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 2. Clear the particles array so hearts vanish immediately
        particles.length = 0; 

// Tell the server we stopped
        connection.invoke("SendBeat", 0);
        // 3. Update status text
        const status = document.getElementById('status');
        if (status) status.innerText = "Playback stopped.";
    };
}