class AdvancedInfinityBackground {
    constructor(config = {}) {
        this.config = {
            canvasId: config.canvasId || 'canvas',
            gridSize: config.gridSize || 20,
            spacing: config.spacing || 5,
            backgroundColor: config.backgroundColor || 0x000000,
            lineColor: config.lineColor || 0x010FFF,
            lineOpacity: config.lineOpacity || 0.3,
            particleColor: config.particleColor || { r: 0.0627, g: 0.5176, b: 1.0 },
            particleSize: config.particleSize || 0.3,
            hoverColor: config.hoverColor || { r: 1.0, g: 1.0, b: 1.0 },
            hoverDistance: config.hoverDistance || 20,
            hoverLift: config.hoverLift || 8,
            cameraPosX: config.cameraPosX || 0,
            cameraPosY: config.cameraPosY || 10,
            cameraPosZ: config.cameraPosZ || 50,
            cameraSpeed: config.cameraSpeed || 0.1
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.animationFrameId = null;

        this.particleSystem = null;
        this.gridRenderer = null;
        this.inputManager = null;
        this.cameraController = null;
    }

    init() {
        this.canvas = document.getElementById(this.config.canvasId);
        if (!this.canvas) {
            console.error(`Canvas with ID "${this.config.canvasId}" not found`);
            return;
        }

        // Initialize Three.js components
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initModules();
        this.setupEventListeners();

        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.backgroundColor);
        this.scene.fog = new THREE.Fog(this.config.backgroundColor, 100, 1000);
    }

    initCamera() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        this.camera.position.set(this.config.cameraPosX, this.config.cameraPosY, this.config.cameraPosZ);
        this.camera.lookAt(0, 0, 0);
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(this.config.backgroundColor, 1);
    }

    initModules() {
        // Initialize particle system
        this.particleSystem = new ParticleSystem(this.config);
        this.particleSystem.createGrid(this.scene, this.config.gridSize, this.config.spacing, {
            particle: new THREE.Color(this.config.particleColor.r, this.config.particleColor.g, this.config.particleColor.b)
        });

        // Initialize grid renderer
        this.gridRenderer = new GridRenderer();
        this.gridRenderer.createGrid(this.scene, this.config.gridSize, this.config.spacing, {
            lineColor: this.config.lineColor,
            lineOpacity: this.config.lineOpacity
        });

        // Initialize input manager
        this.inputManager = new InputManager();
        this.inputManager.init({
            onMouseMove: (pos) => this.onMouseMove(pos),
            onResize: (size) => this.onResize(size)
        });

        // Initialize camera controller
        this.cameraController = new CameraController(this.camera, this.config);
        this.cameraController.init();
        this.cameraController.setAnimating(false);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize(), false);
    }

    onMouseMove(pos) {
        this.particleSystem.update(pos, this.config);
    }

    onResize() {
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());

        // Update modules
        this.cameraController.update(0.016);
        this.renderer.render(this.scene, this.camera);
    }

    toggleGrid(visible) {
        this.gridRenderer.setVisibility(visible);
    }

    setGridOpacity(opacity) {
        this.gridRenderer.setOpacity(opacity);
    }

    toggleCameraAnimation(animate) {
        this.cameraController.setAnimating(animate);
    }

    getParticleCount() {
        return this.particleSystem.getParticleCount();
    }

    destroy() {
        cancelAnimationFrame(this.animationFrameId);
        this.renderer.dispose();
        this.particleSystem.geometry?.dispose();
        this.particleSystem.material?.dispose();
        this.gridRenderer.remove(this.scene);
    }
}
