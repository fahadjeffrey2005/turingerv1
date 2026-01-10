/**
 * Dots System - Modular Particle Background
 * A standalone, reusable particle system with theme support
 * 
 * Usage:
 * 1. Include THREE.js library
 * 2. Include dots.css
 * 3. Include this file
 * 4. Add canvas element: <canvas id="fluidCanvas"></canvas>
 * 5. Initialize: window.addEventListener('load', initDots);
 * 6. Change theme: setDotsTheme('black') or setDotsTheme('white')
 */

// ============================================================
// DEVICE DETECTION
// ============================================================
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.matchMedia('(max-width: 768px)').matches;
};

const isLowEndDevice = () => {
    // Detect low-end devices based on memory and CPU
    const cores = navigator.hardwareConcurrency || 1;
    return cores <= 2;
};

// ============================================================
// PARTICLE BOUNDS & CONFIGURATION
// ============================================================
const PARTICLE_BOUNDS = {
    radiusMin: 420,
    radiusMax: 880,
    extraRadius: 1050,
    cameraZ: 400,
    minCameraDistance: 220
};

const GLOBE_OFFSET = {
    x: 0,
    y: 0,
    z: 0
};

const SCENE_THEMES = {
    white: {
        clearColor: 0xffffff,
        fogColor: 0xffffff,
        fogDensity: 0.0004,
        backgroundPlaneColor: 0xffffff,
        globeColor: 0x0018F9,
        globeOpacity: 1,
        globeEdgeColor: 0x0018F9,
        globeEdgeOpacity: 1,
        particleBlending: THREE.NormalBlending,
        particleSize: isMobileDevice() ? 3.5 : 6.5,
        particleOpacity: 1,
        particleTransparent: false,
        particlePalette: {
            hue: [0.55, 0.62],
            saturation: 1,
            lightness: [0.25, 0.45]
        }
    },
    black: {
        clearColor: 0x000000,
        fogColor: 0x000000,
        fogDensity: 0.001,
        backgroundPlaneColor: 0x000000,
        globeColor: 0x0080FE,
        globeOpacity: 0.22,
        globeEdgeColor: 0x0080FE,
        globeEdgeOpacity: 0.72,
        particleBlending: THREE.AdditiveBlending,
        particleSize: isMobileDevice() ? 2.5 : 4.5,
        particleOpacity: 0.9,
        particleTransparent: true,
        particlePalette: {
            hue: [0.55, 0.62],
            saturation: 0.95,
            lightness: [0.55, 0.8]
        }
    }
};

// ============================================================
// STATE VARIABLES
// ============================================================
let scene, camera, renderer, particles, particleGeometry, particleMaterial;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let lastMouseMoveTime = 0;
let isMouseActive = false;
let activityLevel = 0.15;
let dynamicLines;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

let pendingSceneTheme = 'white';
let currentSceneTheme = null;
let sceneReady = false;
let targetSceneTheme = 'white';
let themeTransition = null;

// Dynamic camera Z for scroll animations
let dynamicCameraZ = null;

// ============================================================
// DEBUGGING - Remove this section in production
// ============================================================
function logDeviceDebugInfo() {
    const isMobile = isMobileDevice();
    const isLowEnd = isLowEndDevice();
    const particleCountDebug = isMobile ? (isLowEnd ? 1500 : 3000) : 8500;
    
    const debugInfo = {
        userAgent: navigator.userAgent.substring(0, 80),
        isMobileDevice: isMobile,
        isLowEndDevice: isLowEnd,
        particleCount: particleCountDebug,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        mediaQuery768: window.matchMedia('(max-width: 768px)').matches,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        deviceMemory: navigator.deviceMemory || 'unknown'
    };
    
    console.log('%c🔍 DOTS DEBUG INFO', 'color: #0080FE; font-weight: bold; font-size: 14px;', debugInfo);
    
    // Debug panel hidden by default - enable by typing in console: window.showDotsDebug = true; location.reload();
    if (window.showDotsDebug && isMobile) {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'dots-debug-panel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.9);
            color: #0080FE;
            padding: 12px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 11px;
            z-index: 9999;
            max-width: 280px;
            line-height: 1.4;
        `;
        debugPanel.innerHTML = `
            <strong>DOTS DEBUG</strong><br>
            Mobile: ${isMobile ? '✓' : '✗'}<br>
            Low-End: ${isLowEnd ? '✓' : '✗'}<br>
            Particles: ${particleCountDebug.toLocaleString()}<br>
            Size: ${window.innerWidth}x${window.innerHeight}<br>
            UA: ${navigator.userAgent.substring(0, 40)}..
        `;
        document.body.appendChild(debugPanel);
    }
    
    return debugInfo;
}

// ============================================================
// INITIALIZATION
// ============================================================
function initDots() {
    // Log device info
    logDeviceDebugInfo();
    
    // Create Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, 0.0004);
    scene.background = new THREE.Color(0xffffff);

    // Create Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.z = PARTICLE_BOUNDS.cameraZ;

    // Create Renderer - optimized for mobile
    const isMobile = isMobileDevice();
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('fluidCanvas'),
        antialias: !isMobile,
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1) : window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 1);

    // Create Background
    createBackgroundPlane();

    // Create Particles
    createParticles();

    // Create Globe
    createFluidMesh();

    // Event Listeners
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('touchmove', onDocumentTouchMove, { passive: true });
    document.addEventListener('touchend', onDocumentTouchEnd, false);
    window.addEventListener('resize', onWindowResize, false);

    sceneReady = true;
    forceSceneTheme(pendingSceneTheme);

    // Start Animation
    animateDots();
}

// ============================================================
// PARTICLE CREATION
// ============================================================
function createParticles() {
    // Dynamic particle count based on device
    let particleCount = 8500;
    if (isMobileDevice()) {
        particleCount = isLowEndDevice() ? 1500 : 3000;
    }
    
    particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    const minDistance = 24;
    const { radiusMin, radiusMax, extraRadius, cameraZ, minCameraDistance } = PARTICLE_BOUNDS;

    for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        let validPosition = false;
        let attempts = 0;
        let x, y, z;

        while (!validPosition && attempts < 80) {
            const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
            const phi = Math.random() * Math.PI * 2;
            const cosTheta = Math.random() * 2 - 1;
            const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));

            x = radius * sinTheta * Math.cos(phi);
            y = radius * sinTheta * Math.sin(phi);
            z = radius * cosTheta;

            const dxCam = x;
            const dyCam = y;
            const dzCam = z - cameraZ;
            const distToCamera = Math.sqrt(dxCam * dxCam + dyCam * dyCam + dzCam * dzCam);
            if (distToCamera < minCameraDistance) {
                attempts++;
                continue;
            }

            validPosition = true;
            
            const checkCount = Math.min(i, 20);
            for (let j = i - checkCount; j < i; j++) {
                if (j < 0) continue;
                const jIdx = j * 3;
                const dx = x - positions[jIdx];
                const dy = y - positions[jIdx + 1];
                const dz = z - positions[jIdx + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < minDistance) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }

        positions[idx] = x;
        positions[idx + 1] = y;
        positions[idx + 2] = z;

        velocities[idx] = (Math.random() - 0.5) * 0.01;
        velocities[idx + 1] = (Math.random() - 0.5) * 0.01;
        velocities[idx + 2] = (Math.random() - 0.5) * 0.005;

        const color = new THREE.Color();
        const brightness = 0.25 + Math.random() * 0.2;
        const blueShade = 0.58 + Math.random() * 0.05;
        color.setHSL(blueShade, 1.0, brightness);
        
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;

        sizes[i] = Math.random() * 5 + 3.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.userData.velocities = velocities;

    particleMaterial = new THREE.PointsMaterial({
        size: 6.5,
        vertexColors: true,
        blending: THREE.NormalBlending,
        transparent: false,
        opacity: 1,
        sizeAttenuation: true
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    createDynamicWebLines();
}

// ============================================================
// BACKGROUND & GLOBE
// ============================================================
function createBackgroundPlane() {
    const geometry = new THREE.PlaneGeometry(8000, 4500);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    material.depthWrite = false;
    material.fog = false;

    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, -2300);
    plane.renderOrder = -10;
    scene.add(plane);
    scene.userData.backgroundPlane = plane;
}

function createFluidMesh() {
    const detail = isMobileDevice() ? 3 : 4;
    const geometry = new THREE.IcosahedronGeometry(100, detail);
    const material = new THREE.MeshBasicMaterial({
        color: 0x007a2d,
        wireframe: true,
        transparent: false,
        opacity: 1
    });

    const fluidMesh = new THREE.Mesh(geometry, material);
    fluidMesh.position.set(GLOBE_OFFSET.x, GLOBE_OFFSET.y, GLOBE_OFFSET.z);
    fluidMesh.userData.baseScale = 1.159;
    fluidMesh.scale.setScalar(fluidMesh.userData.baseScale);
    scene.add(fluidMesh);

    const edgeGeometry = new THREE.EdgesGeometry(geometry, isMobileDevice() ? 20 : 15);
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x00521a,
        linewidth: 1.90,
        transparent: true,
        opacity: 1
    });
    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edgeLines.scale.setScalar(1.002);
    fluidMesh.add(edgeLines);
    fluidMesh.userData.edgeLines = edgeLines;

    scene.userData.fluidMesh = fluidMesh;
    scene.userData.globeOffset = { ...GLOBE_OFFSET };
    scene.userData.lines = null;
}

function createDynamicWebLines() {
    dynamicLines = null;
}

// ============================================================
// EVENT HANDLERS
// ============================================================
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.5;
    mouseY = (event.clientY - windowHalfY) * 0.5;
    lastMouseMoveTime = Date.now();
    isMouseActive = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
}

// ============================================================
// ANIMATION LOOP
// ============================================================
function animateDots() {
    requestAnimationFrame(animateDots);

    const timeSinceLastMove = Date.now() - lastMouseMoveTime;
    if (timeSinceLastMove > 2000) {
        isMouseActive = false;
    }

    const targetActivityLevel = isMouseActive ? 1.0 : 0.15;
    activityLevel += (targetActivityLevel - activityLevel) * 0.02;

    // Disable mouse tracking on mobile devices for better performance
    if (!isMobileDevice()) {
        targetX = mouseX * 0.000375;
        targetY = mouseY * 0.000375;

        camera.position.x += (mouseX * 0.092 - camera.position.x) * 0.0115 * activityLevel;
        camera.position.y += (-mouseY * 0.092 - camera.position.y) * 0.0115 * activityLevel;
    } else {
        // Subtle rotation on mobile
        targetX = Math.sin(Date.now() * 0.0001) * 0.15;
        targetY = Math.cos(Date.now() * 0.00008) * 0.1;
    }
    
    // Use dynamic camera Z if set (for scroll animations), otherwise use default
    camera.position.z = dynamicCameraZ !== null ? dynamicCameraZ : 400;
    camera.lookAt(scene.position);

    // Animate particles
    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.userData.velocities;
        const time = Date.now() * 0.0005;
        const minDistance = 40;

        particles.rotation.y += 0.00025 + targetX * 0.02 * activityLevel;
        particles.rotation.x += 0.00008 + targetY * 0.02 * activityLevel;

        const bounds = PARTICLE_BOUNDS;
        const radiusMin = bounds.radiusMin * 0.85;
        const radiusMax = bounds.extraRadius;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * 0.1;
            positions[i + 1] += velocities[i + 1] * 0.1;
            positions[i + 2] += velocities[i + 2] * 0.1;

            const floatIntensity = 0.002;
            positions[i] += Math.sin(time + i * 0.1) * floatIntensity;
            positions[i + 1] += Math.cos(time + i * 0.15) * floatIntensity;
            positions[i + 2] += Math.sin(time * 0.5 + i * 0.08) * floatIntensity;

            for (let j = i + 3; j < Math.min(i + 150, positions.length); j += 3) {
                const dx = positions[j] - positions[i];
                const dy = positions[j + 1] - positions[i + 1];
                const dz = positions[j + 2] - positions[i + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < minDistance && dist > 0) {
                    const pushForce = (minDistance - dist) / minDistance * 0.05;
                    positions[i] -= (dx / dist) * pushForce;
                    positions[i + 1] -= (dy / dist) * pushForce;
                    positions[i + 2] -= (dz / dist) * pushForce;
                }
            }

            const radialDist = Math.sqrt(
                positions[i] * positions[i] +
                positions[i + 1] * positions[i + 1] +
                positions[i + 2] * positions[i + 2]
            );

            if (radialDist < radiusMin || radialDist > radiusMax) {
                const radius = bounds.radiusMin + Math.random() * (bounds.radiusMax - bounds.radiusMin);
                const phi = Math.random() * Math.PI * 2;
                const cosTheta = Math.random() * 2 - 1;
                const sinTheta = Math.sqrt(Math.max(0, 1 - cosTheta * cosTheta));

                positions[i] = radius * sinTheta * Math.cos(phi);
                positions[i + 1] = radius * sinTheta * Math.sin(phi);
                positions[i + 2] = radius * cosTheta;

                const dxCam = positions[i];
                const dyCam = positions[i + 1];
                const dzCam = positions[i + 2] - bounds.cameraZ;
                const distToCamera = Math.sqrt(dxCam * dxCam + dyCam * dyCam + dzCam * dzCam);
                if (distToCamera < bounds.minCameraDistance) {
                    positions[i + 2] -= bounds.minCameraDistance;
                }
            }
        }

        particles.geometry.attributes.position.needsUpdate = true;
    }

    // Rotate globe
    if (scene.userData.fluidMesh) {
        const baseRotation = 0.3 + activityLevel * 0.7;
        scene.userData.fluidMesh.rotation.x += 0.005 * baseRotation + targetY * 0.06 * activityLevel;
        scene.userData.fluidMesh.rotation.y += 0.007 * baseRotation + targetX * 0.06 * activityLevel;
        
        const scaleMultiplier = 0.02 + activityLevel * 0.045;
        const baseScale = scene.userData.fluidMesh.userData.baseScale || 1;
        const scale = baseScale * (1 + Math.sqrt(targetX * targetX + targetY * targetY) * scaleMultiplier);
        scene.userData.fluidMesh.scale.set(scale, scale, scale);
    }

    updateThemeTransition();

    renderer.render(scene, camera);
}

// ============================================================
// THEME MANAGEMENT
// ============================================================
function recolorParticles(palette) {
    if (!palette || !particleGeometry) {
        return;
    }

    const colorsAttr = particleGeometry.getAttribute('color');
    if (!colorsAttr) {
        return;
    }

    const color = new THREE.Color();
    const hueRange = palette.hue || [0.32, 0.32];
    const lightnessRange = palette.lightness || [0.5, 0.5];
    const saturation = palette.saturation ?? 0.9;
    const [hMin, hMax] = hueRange;
    const [lMin, lMax] = lightnessRange;

    for (let i = 0; i < colorsAttr.count; i++) {
        const hue = hMin + Math.random() * (hMax - hMin);
        const lightness = lMin + Math.random() * (lMax - lMin);
        color.setHSL(hue, saturation, lightness);
        colorsAttr.setXYZ(i, color.r, color.g, color.b);
    }

    colorsAttr.needsUpdate = true;
}

function applyThemeStaticProperties(theme) {
    if (!theme || !particleMaterial) {
        return;
    }

    particleMaterial.blending = theme.particleBlending;
    particleMaterial.size = theme.particleSize;
    particleMaterial.opacity = theme.particleOpacity;
    particleMaterial.transparent = theme.particleTransparent;
    particleMaterial.depthWrite = !theme.particleTransparent;
    particleMaterial.needsUpdate = true;
}

function setThemeColorsImmediate(theme) {
    if (!theme || !renderer) {
        return;
    }

    renderer.setClearColor(theme.clearColor, 1);
    if (scene.background) {
        scene.background.setHex(theme.clearColor);
    }
    if (scene.fog) {
        scene.fog.color.setHex(theme.fogColor);
        scene.fog.density = theme.fogDensity;
    }

    const backgroundPlane = scene.userData.backgroundPlane;
    if (backgroundPlane) {
        backgroundPlane.material.color.setHex(theme.backgroundPlaneColor);
        backgroundPlane.material.needsUpdate = true;
    }

    const fluidMesh = scene.userData.fluidMesh;
    if (fluidMesh) {
        fluidMesh.material.color.setHex(theme.globeColor);
        fluidMesh.material.opacity = theme.globeOpacity;
        fluidMesh.material.needsUpdate = true;

        const edgeLines = fluidMesh.userData.edgeLines;
        if (edgeLines) {
            edgeLines.material.color.setHex(theme.globeEdgeColor);
            if (typeof theme.globeEdgeOpacity === 'number') {
                edgeLines.material.opacity = theme.globeEdgeOpacity;
                edgeLines.material.transparent = theme.globeEdgeOpacity < 1;
            }
            edgeLines.material.needsUpdate = true;
        }
    }
}

function forceSceneTheme(themeKey) {
    const normalized = themeKey === 'black' ? 'black' : 'white';
    targetSceneTheme = normalized;
    currentSceneTheme = normalized;
    themeTransition = null;

    const theme = SCENE_THEMES[normalized] || SCENE_THEMES.white;
    applyThemeStaticProperties(theme);
    setThemeColorsImmediate(theme);
    recolorParticles(theme.particlePalette);
}

function startSceneThemeTransition(themeKey) {
    const normalized = themeKey === 'black' ? 'black' : 'white';
    pendingSceneTheme = normalized;

    if (!sceneReady || !scene || !renderer) {
        return;
    }

    if (themeTransition && themeTransition.toThemeKey === normalized) {
        return;
    }

    const toTheme = SCENE_THEMES[normalized] || SCENE_THEMES.white;

    applyThemeStaticProperties(toTheme);

    const fluidMesh = scene.userData.fluidMesh;
    const edgeLines = fluidMesh ? fluidMesh.userData.edgeLines : null;
    const backgroundPlane = scene.userData.backgroundPlane;

    themeTransition = {
        start: performance.now(),
        duration: 850,
        toThemeKey: normalized,
        backgroundPlane,
        fluidMesh,
        edgeLines,
        fromClearColor: renderer.getClearColor(new THREE.Color()),
        toClearColor: new THREE.Color(toTheme.clearColor),
        fromFogColor: scene.fog ? scene.fog.color.clone() : null,
        toFogColor: new THREE.Color(toTheme.fogColor),
        fromFogDensity: scene.fog ? scene.fog.density : 0,
        toFogDensity: toTheme.fogDensity,
        fromPlaneColor: backgroundPlane ? backgroundPlane.material.color.clone() : null,
        toPlaneColor: backgroundPlane ? new THREE.Color(toTheme.backgroundPlaneColor) : null,
        fromGlobeColor: fluidMesh ? fluidMesh.material.color.clone() : null,
        toGlobeColor: new THREE.Color(toTheme.globeColor),
        fromGlobeOpacity: fluidMesh ? fluidMesh.material.opacity : 1,
        toGlobeOpacity: toTheme.globeOpacity,
        fromEdgeColor: edgeLines ? edgeLines.material.color.clone() : null,
        toEdgeColor: edgeLines ? new THREE.Color(toTheme.globeEdgeColor) : null,
        fromEdgeOpacity: edgeLines ? edgeLines.material.opacity : null,
        toEdgeOpacity: typeof toTheme.globeEdgeOpacity === 'number' ? toTheme.globeEdgeOpacity : null,
        palette: toTheme.particlePalette,
        paletteApplied: false
    };

    currentSceneTheme = normalized;
}

function updateThemeTransition() {
    if (!themeTransition || !scene || !renderer) {
        return;
    }

    const now = performance.now();
    const progress = Math.min((now - themeTransition.start) / themeTransition.duration, 1);
    const eased = progress * progress * (3 - 2 * progress);

    if (themeTransition.fromClearColor && themeTransition.toClearColor) {
        const clearColor = themeTransition.fromClearColor.clone().lerp(themeTransition.toClearColor, eased);
        renderer.setClearColor(clearColor, 1);
        if (scene.background) {
            scene.background.copy(clearColor);
        }
    }

    if (scene.fog && themeTransition.fromFogColor && themeTransition.toFogColor) {
        const fogColor = themeTransition.fromFogColor.clone().lerp(themeTransition.toFogColor, eased);
        scene.fog.color.copy(fogColor);
        scene.fog.density = THREE.MathUtils.lerp(themeTransition.fromFogDensity, themeTransition.toFogDensity, eased);
    }

    if (themeTransition.backgroundPlane && themeTransition.fromPlaneColor && themeTransition.toPlaneColor) {
        const planeColor = themeTransition.fromPlaneColor.clone().lerp(themeTransition.toPlaneColor, eased);
        themeTransition.backgroundPlane.material.color.copy(planeColor);
        themeTransition.backgroundPlane.material.needsUpdate = true;
    }

    if (themeTransition.fluidMesh && themeTransition.fromGlobeColor && themeTransition.toGlobeColor) {
        const globeColor = themeTransition.fromGlobeColor.clone().lerp(themeTransition.toGlobeColor, eased);
        themeTransition.fluidMesh.material.color.copy(globeColor);
        themeTransition.fluidMesh.material.opacity = THREE.MathUtils.lerp(themeTransition.fromGlobeOpacity, themeTransition.toGlobeOpacity, eased);
        themeTransition.fluidMesh.material.needsUpdate = true;
    }

    if (themeTransition.edgeLines && themeTransition.fromEdgeColor && themeTransition.toEdgeColor) {
        const edgeColor = themeTransition.fromEdgeColor.clone().lerp(themeTransition.toEdgeColor, eased);
        themeTransition.edgeLines.material.color.copy(edgeColor);
        if (themeTransition.fromEdgeOpacity != null && themeTransition.toEdgeOpacity != null) {
            themeTransition.edgeLines.material.opacity = THREE.MathUtils.lerp(themeTransition.fromEdgeOpacity, themeTransition.toEdgeOpacity, eased);
            themeTransition.edgeLines.material.transparent = themeTransition.edgeLines.material.opacity < 1;
        }
        themeTransition.edgeLines.material.needsUpdate = true;
    }

    if (progress >= 1) {
        if (!themeTransition.paletteApplied) {
            recolorParticles(themeTransition.palette);
            themeTransition.paletteApplied = true;
        }
        themeTransition = null;
    }
}

function setDotsTheme(themeKey) {
    startSceneThemeTransition(themeKey);
}

function onDocumentTouchMove(event) {
    if (event.touches.length > 0) {
        mouseX = event.touches[0].clientX;
        mouseY = event.touches[0].clientY;
        lastMouseMoveTime = Date.now();
        isMouseActive = true;
    }
}

function onDocumentTouchEnd(event) {
    isMouseActive = false;
}

// ============================================================
// PUBLIC API
// ============================================================
window.initDots = initDots;
window.setDotsTheme = setDotsTheme;
window.dotsParticles = null;
window.dotsParticleMaterial = null;
window.dotsScene = null;
window.dotsCamera = null;
window.dotsRenderer = null;

// Set dynamic camera Z for scroll animations
window.setDynamicCameraZ = function(z) {
    dynamicCameraZ = z;
};

// Update these references after initialization
const originalInitDots = window.initDots;
window.initDots = function() {
    originalInitDots.call(this);
    window.dotsParticles = particles;
    window.dotsParticleMaterial = particleMaterial;
    window.dotsScene = scene;
    window.dotsCamera = camera;
    window.dotsRenderer = renderer;
    console.log('[dots] Exposed: scene, camera, renderer, particles, particleMaterial');
};
