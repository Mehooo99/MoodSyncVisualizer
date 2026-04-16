export class ReactiveFlower {
    private angle: number;
    private bloomScale: number = 0;

    constructor(index: number, total: number) {
        // Fans the flowers out in a bouquet shape
        this.angle = ((index / (total - 1)) - 0.5) * Math.PI * 0.6;
    }

    public draw(ctx: CanvasRenderingContext2D, intensity: number, canvas: HTMLCanvasElement) {
        const originX = canvas.width / 2;
        const originY = canvas.height + 10;
        
        // The flower grows and pulses with the music intensity
        const baseLength = canvas.height * 0.5;
        const currentLength = baseLength + (intensity * 40);
        
        const tipX = originX + Math.sin(this.angle) * currentLength;
        const tipY = originY - Math.cos(this.angle) * currentLength;

        // 1. Draw the Stem
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(
            originX + Math.sin(this.angle) * (currentLength * 0.5),
            originY - (currentLength * 0.5),
            tipX, tipY
        );
        ctx.strokeStyle = '#1a3316';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Draw the Heart Bloom
        this.drawHeart(ctx, tipX, tipY, intensity);
    }

    private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number) {
        // Pulse logic: base size + music boost
        const size = 20 + (intensity * 40); 
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.angle); // Aligns heart with the stem direction

        // Glow effect
        ctx.shadowBlur = 10 + (intensity * 25);
        ctx.shadowColor = "rgba(255, 77, 109, 0.6)";

        ctx.beginPath();
        // Starting at the bottom point of the heart
        ctx.moveTo(0, size);

        // Left side of the heart
        ctx.bezierCurveTo(
            -size, size / 2, 
            -size, -size / 2, 
            0, -size / 4
        );

        // Right side of the heart
        ctx.bezierCurveTo(
            size, -size / 2, 
            size, size / 2, 
            0, size
        );

        ctx.fillStyle = "#ff4d6d";
        ctx.fill();

        // Add a small bright "shine" to make it look 3D
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}