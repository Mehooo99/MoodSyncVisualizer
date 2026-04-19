export class ReactiveFlower {
    private angle: number;
    private _index: number;
    private _total: number;

    constructor(index: number, total: number) {
        // Fans the flowers out in a bouquet shape
        this.angle = ((index / (total - 1)) - 0.5) * Math.PI * 0.6;
        this._index=index;
        this._total=total;
    }
public getTipCoordinates(canvas: HTMLCanvasElement, intensity: number) {
        const originX = canvas.width / 2;
        const originY = canvas.height + 10;
        
        // Use the same length math as the draw() method
        const baseLength = canvas.height * 0.5;
        const currentLength = baseLength + (intensity * 40);
        
        return {
            x: originX + Math.sin(this.angle) * currentLength,
            y: originY - Math.cos(this.angle) * currentLength
        };
    }
    public draw(ctx: CanvasRenderingContext2D, intensity: number, canvas: HTMLCanvasElement) {
       const originX = canvas.width / 2;
    const originY = canvas.height + 10;
    
    // 1. DYNAMIC SPREAD: 
    // If there are 2 flowers, spread them wide. 
    // If there are 50, keep the angle tight so they stay on screen.
    const maxSpread = Math.min(Math.PI * 0.8, 20 / this._total); 
    const positionFactor = this._total <= 1 ? 0.5 : (this._index / (this._total - 1));
    const currentAngle = (positionFactor - 0.5) * maxSpread;

    // 2. DYNAMIC LENGTH:
    // Make stems slightly shorter if the garden is crowded
    const baseLength = canvas.height * (this._total > 10 ? 0.4 : 0.5);
    const currentLength = baseLength + (intensity * 40);

    const padding = 50; // pixels from the edge
    let tipX = originX + Math.sin(currentAngle) * currentLength;
    tipX = Math.max(padding, Math.min(canvas.width - padding, tipX));
    const tipY = originY - Math.cos(currentAngle) * currentLength;

const fanIndex = this._total > 1 ? this._index : 0;
    const fanTotal = this._total > 1 ? this._total - 1 : 1;
    
    const angle = (fanIndex / fanTotal - 0.5) * Math.PI * 0.5;
        // 1. Draw the Stem
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(
            originX + Math.sin(angle) * (currentLength * 0.5),
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
        ctx.shadowBlur = 10 + (intensity * 20);
        // ctx.shadowColor = "rgba(255, 77, 109, 0.6)";

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
