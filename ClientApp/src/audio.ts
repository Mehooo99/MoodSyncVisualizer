export class AudioAnalyser {
    private context: AudioContext;
    private analyser: AnalyserNode;
    private dataArray: Uint8Array;
    private source: MediaElementAudioSourceNode;

    constructor(audioElement: HTMLAudioElement) {
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.source = this.context.createMediaElementSource(audioElement);
        this.source.connect(this.analyser);
        this.analyser.connect(this.context.destination);
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    getSyncData() {
        const safeData = this.dataArray as Uint8Array<ArrayBuffer>;
        this.analyser.getByteFrequencyData(safeData);
        // Average the low frequencies for the "beat"
        const bass = (this.dataArray[0] + this.dataArray[1] + this.dataArray[2]) / 3;
        return bass / 255; 
    }
}