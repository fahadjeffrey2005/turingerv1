/**
 * Infinity Background - Modularized Three.js Particle System
 * Interactive particle grid with mouse interaction and dynamic animation
 * 
 * Usage:
 * const bg = new InfinityBackground({
 *   canvasId: 'canvas',
 *   gridSize: 20,
 *   spacing: 5,
 *   particleColor: { r: 0, g: 0.502, b: 1 }  // Blue
 * });
 * bg.init();
 */

class InfinityBackground {
  constructor(options = {}) {
    // Configuration
    this.config = {
      canvasId: options.canvasId || 'canvas',
      gridSize: options.gridSize || 50,
      spacing: options.spacing || 5,
      backgroundColor: options.backgroundColor || 0x000000,
      lineColor: options.lineColor || 0x0080FE,
      lineOpacity: options.lineOpacity || 0.4,
      particleColor: options.particleColor || { r: 1.0, g: 1.0, b: 1.0 }, // White
      particleSize: options.particleSize || 0.3,
      hoverColor: options.hoverColor || { r: 0, g: 0.502, b: 1 }, // Blue
      hoverDistance: options.hoverDistance || 20,
      hoverLift: options.hoverLift || 8,
      cameraPosZ: options.cameraPosZ || 50,
      cameraPosY: options.cameraPosY || 10,
    };

    // Three.js Objects
    this.canvas = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.geometry = null;
    this.material = null;
    this.points = null;
    this.lines = null;

    // State
    this.particles = [];
    this.time = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.animationId = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the entire system
   */
  init() {
    if (this.isInitialized) return;
    
    this.setupCanvas();
    this.setupScene();
    this.createParticles();
    this.createLines();
    this.setupEventListeners();
    this.animate();
    
    this.isInitialized = true;
  }

  /**
   * Setup canvas and renderer
   */
  setupCanvas() {
    this.canvas = document.getElementById(this.config.canvasId);
    if (!this.canvas) {
      console.error(`Canvas with id "${this.config.canvasId}" not found`);
      return;
    }

    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(this.config.backgroundColor);
  }

  /**
   * Setup Three.js scene and camera
   */
  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    this.camera.position.z = this.config.cameraPosZ;
    this.camera.position.y = this.config.cameraPosY;
    this.camera.lookAt(0, 0, -100);
  }

  /**
   * Create particle grid - extends infinitely with large grid size
   */
  createParticles() {
    const { gridSize, spacing, particleColor, particleSize } = this.config;
    const positions = [];
    const colors = [];

    // Generate large particle grid for infinite-like extension
    // Grid extends further than camera view distance for seamless visual
    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        positions.push(x * spacing, 0, z * spacing);
        colors.push(particleColor.r, particleColor.g, particleColor.b);
        this.particles.push({
          x: x * spacing,
          z: z * spacing,
          currentY: 0
        });
      }
    }

    // Create geometry and material - NO EMISSIVE/GLOW
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', 
      new THREE.BufferAttribute(new Float32Array(positions), 3)
    );
    this.geometry.setAttribute('color', 
      new THREE.BufferAttribute(new Float32Array(colors), 3)
    );

    this.material = new THREE.PointsMaterial({
      size: particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  /**
   * Create grid lines
   */
  createLines() {
    const { gridSize, spacing, lineColor, lineOpacity } = this.config;
    const linePositions = [];

    // Horizontal lines (along x-axis)
    for (let x = -gridSize; x <= gridSize; x++) {
      linePositions.push(x * spacing, 0, -gridSize * spacing);
      linePositions.push(x * spacing, 0, gridSize * spacing);
    }

    // Vertical lines (along z-axis)
    for (let z = -gridSize; z <= gridSize; z++) {
      linePositions.push(-gridSize * spacing, 0, z * spacing);
      linePositions.push(gridSize * spacing, 0, z * spacing);
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', 
      new THREE.BufferAttribute(new Float32Array(linePositions), 3)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: lineOpacity
    });

    this.lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    this.scene.add(this.lines);
  }

  /**
   * Setup event listeners for mouse and window resize
   */
  setupEventListeners() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => {
      this.handleWindowResize();
    });
  }

  /**
   * Handle window resize
   */
  handleWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Update particle positions based on mouse - Enhanced interactions
   */
  updateParticles() {
    const { hoverDistance, hoverLift, particleColor, hoverColor } = this.config;
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;

    this.particles.forEach((particle, index) => {
      // Calculate distance from mouse to particle
      const distance = Math.sqrt(
        (particle.x - this.mouseX * 50) ** 2 + 
        (particle.z - this.mouseY * 50) ** 2
      );

      // Enhanced hover effect with smoother animation
      if (distance < hoverDistance) {
        const influence = 1 - distance / hoverDistance;
        const lift = influence * hoverLift;
        // Faster, more responsive lift animation
        particle.currentY += (lift - particle.currentY) * 0.15;
      } else {
        // Smoother return to base position
        particle.currentY *= 0.92;
      }

      // Update position
      positions[index * 3 + 1] = particle.currentY;

      // Enhanced color transition with smooth interpolation
      if (distance < hoverDistance) {
        const influence = 1 - distance / hoverDistance;
        // Smooth color interpolation instead of sharp switch
        colors[index * 3] = particleColor.r + (hoverColor.r - particleColor.r) * influence;
        colors[index * 3 + 1] = particleColor.g + (hoverColor.g - particleColor.g) * influence;
        colors[index * 3 + 2] = particleColor.b + (hoverColor.b - particleColor.b) * influence;
      } else {
        colors[index * 3] = particleColor.r;
        colors[index * 3 + 1] = particleColor.g;
        colors[index * 3 + 2] = particleColor.b;
      }
    });

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
  }

  /**
   * Update camera position for dynamic effect
   */
  updateCamera() {
    this.time += 0.01;
    this.camera.position.x = Math.sin(this.time * 0.1) * 20;
    this.camera.position.z = this.config.cameraPosZ + Math.cos(this.time * 0.1) * 10;
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * Main animation loop
   */
  animate = () => {
    this.animationId = requestAnimationFrame(this.animate);

    this.updateParticles();
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Stop animation and cleanup
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.isInitialized = false;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration and reinitialize if needed
   */
  setConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }
}

// Export for use in modules or scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InfinityBackground;
}
