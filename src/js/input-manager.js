class InputManager {
    constructor() {
        this.mousePos = { x: 0, y: 0 };
        this.normalizedPos = { x: 0, y: 0 };
        this.isMoving = false;
        this.lastMoveTime = 0;
        this.moveTimeout = null;
        this.callbacks = {};
    }

    init(callbacks = {}) {
        this.callbacks = callbacks;

        document.addEventListener('mousemove', (e) => {
            this.onMouseMove(e);
        }, false);

        window.addEventListener('resize', () => {
            if (this.callbacks.onResize) {
                this.callbacks.onResize({
                    width: window.innerWidth,
                    height: window.innerHeight
                });
            }
        }, false);
    }

    onMouseMove(event) {
        this.mousePos.x = event.clientX;
        this.mousePos.y = event.clientY;

        this.normalizedPos.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.normalizedPos.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.isMoving = true;
        this.lastMoveTime = Date.now();

        clearTimeout(this.moveTimeout);
        this.moveTimeout = setTimeout(() => {
            this.isMoving = false;
        }, 1000);

        if (this.callbacks.onMouseMove) {
            this.callbacks.onMouseMove({
                x: this.normalizedPos.x * 30,
                y: this.normalizedPos.y * 30
            });
        }
    }

    getMousePosition() {
        return { ...this.mousePos };
    }

    getNormalizedPosition() {
        return { ...this.normalizedPos };
    }

    isMovingNow() {
        return this.isMoving;
    }
}
