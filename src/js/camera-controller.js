class CameraController {
    constructor(camera, config = {}) {
        this.camera = camera;
        this.config = config;
        this.isAnimating = false;
        this.animationTime = 0;
        this.defaultPosition = {
            x: config.cameraPosX || 0,
            y: config.cameraPosY || 10,
            z: config.cameraPosZ || 50
        };
    }

    init() {
        this.setPosition(this.defaultPosition.x, this.defaultPosition.y, this.defaultPosition.z);
        this.camera.lookAt(0, 0, 0);
    }

    update(deltaTime = 0.016) {
        if (!this.isAnimating) return;

        this.animationTime += deltaTime;
        const speed = this.config.cameraSpeed || 0.1;

        // Gentle rotation animation
        const angle = this.animationTime * speed;
        const radius = 50;

        this.camera.position.x = Math.sin(angle) * radius;
        this.camera.position.z = Math.cos(angle) * radius;
        this.camera.position.y = 15 + Math.sin(angle * 0.5) * 5;

        this.camera.lookAt(0, 0, 0);
    }

    setAnimating(animate) {
        this.isAnimating = animate;
        if (!animate) {
            this.animationTime = 0;
        }
    }

    setPosition(x, y, z) {
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
    }

    getPosition() {
        return {
            x: this.camera.position.x,
            y: this.camera.position.y,
            z: this.camera.position.z
        };
    }

    updateAspect(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    reset() {
        this.animationTime = 0;
        this.setPosition(this.defaultPosition.x, this.defaultPosition.y, this.defaultPosition.z);
    }
}
