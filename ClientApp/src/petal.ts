export class Petal {
    public x: number;
    public y: number;
    private size: number;
    private velocityX: number;
    private velocityY: number;
    private opacity: number = 1;
    private hue: number;
    private rotation: number;

    constructor(x: number, y: number, hue: number) {
        this.x = x;
        this.y = y;
        this.hue = hue + (Math.random() * 20 - 10);
        // Smaller size for petals
        this.size = Math.random() * 6 + 3;
        this.velocityX = (Math.random() - 0.5) * 4; // Wider spread
        this.velocityY = -(Math.random() * 3 + 1); // Float upwards
        this.rotation = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.opacity -= 0.008; // Slower fade for a "dreamy" look
        this.rotation += 0.03;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const s = this.size;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity;
        
        ctx.fillStyle = `hsl(${this.hue}, 100%, 75%)`;
        // ctx.shadowBlur = 5;
        // ctx.shadowColor = `hsl(${this.hue}, 100%, 70%)`;

        // Proper Bezier Heart Shape
        ctx.beginPath();
        ctx.moveTo(0, s); // Start at bottom point

        // Left curve
        ctx.bezierCurveTo(-s, s / 2, -s, -s / 2, 0, -s / 4);
        
        // Right curve
        ctx.bezierCurveTo(s, -s / 2, s, s / 2, 0, s);

        ctx.fill();
        ctx.restore();
    }

    get isDead() { return this.opacity <= 0; }
}