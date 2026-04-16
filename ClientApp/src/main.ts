import './style.css'
import { AudioAnalyser } from './audio';
import { ReactiveFlower } from './flowers';
import * as signalR from "@microsoft/signalr";

const canvas = document.getElementById('visualizer') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const audio = document.getElementById('audio-player') as HTMLAudioElement;
const fileInput = document.getElementById('audio-file') as HTMLInputElement;

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

    // Send beat to C# Server (Optional: for multi-user sync)
    connection.invoke("SendBeat", intensity);

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
