// Three.js Scene Setup
let scene, camera, renderer, particles, particleGeometry, particleMaterial;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let lastMouseMoveTime = 0;
let isMouseActive = false;
let activityLevel = 0.15; // Start at idle level
let dynamicLines; // For the web connections near cursor
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

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
        particleSize: 6.5,
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
        particleSize: 4.5,
        particleOpacity: 0.9,
        particleTransparent: true,
        particlePalette: {
            hue: [0.55, 0.62],
            saturation: 0.95,
            lightness: [0.55, 0.8]
        }
    }
};

let pendingSceneTheme = 'white';
let currentSceneTheme = null;
let sceneReady = false;
let targetSceneTheme = 'white';
let themeTransition = null;

// ============================================================
// FLAG: PERFECT WORKING VERSION - SPATIAL MOVEMENT SETTINGS
// Camera: 0.1 range, 0.015 speed, 0.000375 tracking
// Particle rotation: 0.05x, Globe rotation: 0.075x
// Connection lines: 0.0375x, Globe scale: 0.045
// Anti-clumping: minDistance 40, pushForce 1.2, check 150 particles
// Repel force: 2.0, distance < 200
// ============================================================

// Initialize Three.js Scene
function init() {
    // Create Scene
    scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0xffffff, 0.0004);
    scene.background = new THREE.Color(0xffffff); // White background

    // Create Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.z = PARTICLE_BOUNDS.cameraZ;

    // Create Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('fluidCanvas'),
        antialias: true,
        alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 1); // Ensure solid white background

    // Add solid white background plane
    createBackgroundPlane();

    // Create Particle System
    createParticles();

    // Create Fluid Mesh
    createFluidMesh();

    // Event Listeners
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    sceneReady = true;
    forceSceneTheme(pendingSceneTheme);

    // Start Animation
    animate();
}

// Create Particle System
function createParticles() {
    const particleCount = 8500; // Increased for denser field
    particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    // Track positions to ensure minimum distance between particles
    const minDistance = 24; // Slightly smaller gap to support higher count
    const { radiusMin, radiusMax, extraRadius, cameraZ, minCameraDistance } = PARTICLE_BOUNDS;

    for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        let validPosition = false;
        let attempts = 0;
        let x, y, z;

        // Keep trying until we find a position that's far enough from other particles
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
            
            // Check distance from existing particles (only check some for performance)
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

        // Minimal velocities - almost static
        velocities[idx] = (Math.random() - 0.5) * 0.01;
        velocities[idx + 1] = (Math.random() - 0.5) * 0.01;
        velocities[idx + 2] = (Math.random() - 0.5) * 0.005;

        // All particles are blue with varying brightness
        const color = new THREE.Color();
        const brightness = 0.25 + Math.random() * 0.2; // Darker for white background
        const blueShade = 0.58 + Math.random() * 0.05; // Blue hue range (#0080FE)
        color.setHSL(blueShade, 1.0, brightness);
        
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;

        // Varied sizes like different file sizes - smaller to prevent overlap appearance
        sizes[i] = Math.random() * 5 + 3.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store velocities for animation
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

    // Create dynamic web lines
    createDynamicWebLines();
}

// Solid white background plane to guarantee light mode
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

// Create connection lines between nearby files (optional data streams)
function createFluidMesh() {
    // Create the rotating globe/mesh - light green
    const geometry = new THREE.IcosahedronGeometry(100, 4);
    const material = new THREE.MeshBasicMaterial({
        color: 0x007a2d, // Darker green for white background
        wireframe: true,
        transparent: false,
        opacity: 1
    });

    const fluidMesh = new THREE.Mesh(geometry, material);
    fluidMesh.position.set(GLOBE_OFFSET.x, GLOBE_OFFSET.y, GLOBE_OFFSET.z);
    fluidMesh.userData.baseScale = 1.159; // ~56% total volume (20% + additional 30%)
    fluidMesh.scale.setScalar(fluidMesh.userData.baseScale);
    scene.add(fluidMesh);

    // Slightly thicker outline using edge geometry overlay
    const edgeGeometry = new THREE.EdgesGeometry(geometry, 15);
    const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x00521a,
        linewidth: 1.90,
        transparent: true,
        opacity: 1
    });
    const edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edgeLines.scale.setScalar(1.002); // tiny expansion so edges are visible over mesh
    fluidMesh.add(edgeLines);
    fluidMesh.userData.edgeLines = edgeLines;

    // Store reference for animation
    scene.userData.fluidMesh = fluidMesh;
    scene.userData.globeOffset = { ...GLOBE_OFFSET };

    // Remove background line segments for a cleaner look
    scene.userData.lines = null;
}

// Create dynamic web lines that connect particles near cursor
function createDynamicWebLines() {
    // Dynamic web lines disabled for cleaner background
    dynamicLines = null;
}

// Update web connections near cursor
function updateDynamicWebLines() {
    if (!particles || !dynamicLines) {
        return;
    }
    
    // Smooth fade based on activity level
    const targetOpacity = activityLevel < 0.45 ? 0 : 0.2;
    
    // Smooth opacity transition
    if (!dynamicLines.userData.currentOpacity) {
        dynamicLines.userData.currentOpacity = 0;
    }
    dynamicLines.userData.currentOpacity += (targetOpacity - dynamicLines.userData.currentOpacity) * 0.08;
    dynamicLines.material.opacity = dynamicLines.userData.currentOpacity;
    
    // Hide lines when completely faded
    if (dynamicLines.userData.currentOpacity < 0.01) {
        dynamicLines.visible = false;
        return;
    }
    
    dynamicLines.visible = true;
    const positions = particles.geometry.attributes.position.array;
    const linePositions = dynamicLines.geometry.attributes.position.array;
    
    const connectionRadius = 160; // Lower radius for less constant webbing
    const pathToGlobe = 8; // Reduced from 12 (30% reduction)
    
    // Convert mouse position to 3D space with better corner coverage
    const mouseX3D = mouseX * 0.7; // Increased from 0.6 for better right edge reach
    const mouseY3D = -mouseY * 0.7; // Increased from 0.6 for better top edge reach
    const mouseZ3D = 0; // Mouse at center Z
    
    // Globe is at origin
    const globeOffset = scene?.userData?.globeOffset || GLOBE_OFFSET;
    const globeX = globeOffset.x;
    const globeY = globeOffset.y;
    const globeZ = globeOffset.z;
    
    // Find particles near cursor and calculate their distances to both cursor and globe
    const nearbyParticles = [];
    for (let i = 0; i < positions.length; i += 3) {
        const dx = positions[i] - mouseX3D;
        const dy = positions[i + 1] - mouseY3D;
        const dz = positions[i + 2] - mouseZ3D;
        const distanceToCursor = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        const dgx = positions[i] - globeX;
        const dgy = positions[i + 1] - globeY;
        const dgz = positions[i + 2] - globeZ;
        const distanceToGlobe = Math.sqrt(dgx * dgx + dgy * dgy + dgz * dgz);
        
        if (distanceToCursor < connectionRadius) {
            nearbyParticles.push({
                index: i,
                x: positions[i],
                y: positions[i + 1],
                z: positions[i + 2],
                distanceToCursor: distanceToCursor,
                distanceToGlobe: distanceToGlobe,
                score: distanceToCursor * 0.3 + distanceToGlobe * 0.7 // Prefer particles between cursor and globe
            });
        }
    }
    
    // Sort by score to find best path particles
    nearbyParticles.sort((a, b) => a.score - b.score);
    
    let lineIndex = 0;
    
    // Create web structure:
    // 1. Lines from cursor to nearby particles - CREATE POINTY TIP EFFECT
    const cursorConnections = Math.min(7, nearbyParticles.length); // Reduced from 10 (30% reduction)
    
    // Calculate tip point direction (towards globe)
    const dirX = globeX - mouseX3D;
    const dirY = globeY - mouseY3D;
    const dirZ = globeZ - mouseZ3D;
    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    const normalizedDirX = dirX / dirLength;
    const normalizedDirY = dirY / dirLength;
    const normalizedDirZ = dirZ / dirLength;
    
    // Create tip point slightly ahead of cursor
    const tipDistance = 35;
    const tipX = mouseX3D + normalizedDirX * tipDistance;
    const tipY = mouseY3D + normalizedDirY * tipDistance;
    const tipZ = mouseZ3D + normalizedDirZ * tipDistance;
    
    // Connect particles to the tip point (creates pointed effect)
    for (let i = 0; i < cursorConnections && lineIndex < 2400; i++) {
        const p = nearbyParticles[i];
        linePositions[lineIndex++] = tipX;
        linePositions[lineIndex++] = tipY;
        linePositions[lineIndex++] = tipZ;
        linePositions[lineIndex++] = p.x;
        linePositions[lineIndex++] = p.y;
        linePositions[lineIndex++] = p.z;
    }
    
    // 2. Create path from cursor area toward globe through particles
    const pathParticles = nearbyParticles.slice(0, pathToGlobe);
    
    // Connect particles in sequence (forming a path)
    for (let i = 0; i < pathParticles.length - 1 && lineIndex < 2400; i++) {
        const p1 = pathParticles[i];
        const p2 = pathParticles[i + 1];
        
        linePositions[lineIndex++] = p1.x;
        linePositions[lineIndex++] = p1.y;
        linePositions[lineIndex++] = p1.z;
        linePositions[lineIndex++] = p2.x;
        linePositions[lineIndex++] = p2.y;
        linePositions[lineIndex++] = p2.z;
    }
    
    // 3. Connect nearby particles to each other (web structure) - MUCH DENSER
    const webParticles = nearbyParticles.slice(0, 21); // Reduced from 30 (30% reduction)
    for (let i = 0; i < webParticles.length && lineIndex < 2400; i++) {
        for (let j = i + 1; j < webParticles.length && lineIndex < 2400; j++) {
            const p1 = webParticles[i];
            const p2 = webParticles[j];
            
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dz = p1.z - p2.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < 100) { // Increased from 80 for more connections
                linePositions[lineIndex++] = p1.x;
                linePositions[lineIndex++] = p1.y;
                linePositions[lineIndex++] = p1.z;
                linePositions[lineIndex++] = p2.x;
                linePositions[lineIndex++] = p2.y;
                linePositions[lineIndex++] = p2.z;
            }
        }
    }
    
    // 4. Connect multiple particles in path to globe - MAINTAIN 3-6 CONNECTIONS
    let globeConnectionCount = 0;
    
    if (pathParticles.length > 0 && lineIndex < 2400) {
        // Connect last 3 particles in the path to the globe - MINIMUM 3
        const globeConnections = Math.min(3, pathParticles.length);
        for (let i = pathParticles.length - globeConnections; i < pathParticles.length && lineIndex < 2400; i++) {
            if (i >= 0) {
                const p = pathParticles[i];
                linePositions[lineIndex++] = p.x;
                linePositions[lineIndex++] = p.y;
                linePositions[lineIndex++] = p.z;
                linePositions[lineIndex++] = globeX;
                linePositions[lineIndex++] = globeY;
                linePositions[lineIndex++] = globeZ;
                globeConnectionCount++;
            }
        }
    }
    
    // 5. Additional globe connections from web particles closest to globe
    // Add up to 3 more to reach max of 6 total
    const additionalNeeded = Math.max(0, Math.min(3, 6 - globeConnectionCount));
    const globeAreaParticles = [...nearbyParticles]
        .sort((a, b) => a.distanceToGlobe - b.distanceToGlobe)
        .slice(0, additionalNeeded);
    
    for (let i = 0; i < globeAreaParticles.length && lineIndex < 2400 && globeConnectionCount < 6; i++) {
        const p = globeAreaParticles[i];
        if (p.distanceToGlobe < 200) {
            linePositions[lineIndex++] = p.x;
            linePositions[lineIndex++] = p.y;
            linePositions[lineIndex++] = p.z;
            linePositions[lineIndex++] = globeX;
            linePositions[lineIndex++] = globeY;
            linePositions[lineIndex++] = globeZ;
            globeConnectionCount++;
        }
    }
    
    // 6. If we still don't have minimum 3 connections, add more from nearby particles
    if (globeConnectionCount < 3 && nearbyParticles.length > 0) {
        const fallbackParticles = [...nearbyParticles]
            .sort((a, b) => a.distanceToGlobe - b.distanceToGlobe)
            .slice(0, 3 - globeConnectionCount);
        
        for (let i = 0; i < fallbackParticles.length && lineIndex < 2400 && globeConnectionCount < 3; i++) {
            const p = fallbackParticles[i];
            linePositions[lineIndex++] = p.x;
            linePositions[lineIndex++] = p.y;
            linePositions[lineIndex++] = p.z;
            linePositions[lineIndex++] = globeX;
            linePositions[lineIndex++] = globeY;
            linePositions[lineIndex++] = globeZ;
            globeConnectionCount++;
        }
    }
    
    // Fill remaining with zeros (invisible lines - prevents rogue strands)
    for (let i = lineIndex; i < linePositions.length; i++) {
        linePositions[i] = 0;
    }
    
    dynamicLines.geometry.attributes.position.needsUpdate = true;
}

// Mouse Move Handler
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) * 0.5;
    mouseY = (event.clientY - windowHalfY) * 0.5;
    lastMouseMoveTime = Date.now();
    isMouseActive = true;
}

// Window Resize Handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Check if mouse has been idle for more than 2 seconds
    const timeSinceLastMove = Date.now() - lastMouseMoveTime;
    if (timeSinceLastMove > 2000) {
        isMouseActive = false;
    }

    // Smooth transition between active and idle states (relaxation effect)
    const targetActivityLevel = isMouseActive ? 1.0 : 0.15;
    activityLevel += (targetActivityLevel - activityLevel) * 0.02; // Slow smooth transition

    // Smooth camera movement - subtle sensitivity
    targetX = mouseX * 0.000375; // 75% reduction from 0.0015
    targetY = mouseY * 0.000375; // 75% reduction from 0.0015

    // Very subtle camera movement - only for 3D effect
    camera.position.x += (mouseX * 0.092 - camera.position.x) * 0.0115 * activityLevel;
    camera.position.y += (-mouseY * 0.092 - camera.position.y) * 0.0115 * activityLevel;
    
    // Keep camera at consistent distance
    camera.position.z = 400;
    camera.lookAt(scene.position);

    // Animate particles like floating files
    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.userData.velocities;
        const time = Date.now() * 0.0005;
        const minDistance = 40; // Increased minimum distance to prevent clumping

        // Rotate entire particle system for spatial movement - very minimal
        particles.rotation.y += 0.00025 + targetX * 0.02 * activityLevel;
        particles.rotation.x += 0.00008 + targetY * 0.02 * activityLevel;

        const bounds = PARTICLE_BOUNDS;
        const radiusMin = bounds.radiusMin * 0.85;
        const radiusMax = bounds.extraRadius;

        for (let i = 0; i < positions.length; i += 3) {
            // Apply minimal velocity for barely visible drift
            positions[i] += velocities[i] * 0.1;
            positions[i + 1] += velocities[i + 1] * 0.1;
            positions[i + 2] += velocities[i + 2] * 0.1;

            // Almost no floating motion - just a hint
            const floatIntensity = 0.002;
            positions[i] += Math.sin(time + i * 0.1) * floatIntensity;
            positions[i + 1] += Math.cos(time + i * 0.15) * floatIntensity;
            positions[i + 2] += Math.sin(time * 0.5 + i * 0.08) * floatIntensity;

            // Minimal anti-clumping: check nearby particles
            // Check more particles to ensure better spacing
            for (let j = i + 3; j < Math.min(i + 150, positions.length); j += 3) {
                const dx = positions[j] - positions[i];
                const dy = positions[j + 1] - positions[i + 1];
                const dz = positions[j + 2] - positions[i + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < minDistance && dist > 0) {
                    // Very gentle push force
                    const pushForce = (minDistance - dist) / minDistance * 0.05;
                    positions[i] -= (dx / dist) * pushForce;
                    positions[i + 1] -= (dy / dist) * pushForce;
                    positions[i + 2] -= (dz / dist) * pushForce;
                }
            }

            // Wrap around boundaries (files cycling through the space)
            const radialDist = Math.sqrt(
                positions[i] * positions[i] +
                positions[i + 1] * positions[i + 1] +
                positions[i + 2] * positions[i + 2]
            );

            if (radialDist < radiusMin || radialDist > radiusMax) {
                // Reposition particle in shell when it drifts out of range
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

            // NO mouse interaction - particles stay static relative to mouse movement
            // The 3D effect comes purely from camera movement and particle rotation
        }

        particles.geometry.attributes.position.needsUpdate = true;
    }

    // Update dynamic web connections near cursor
    updateDynamicWebLines();

    // Rotate connection lines - subtle mouse influence
    if (scene.userData.lines) {
        const rotationSpeed = 0.0001 + activityLevel * 0.0002;
        scene.userData.lines.rotation.y += rotationSpeed + targetX * 0.03 * activityLevel; // Reduced from 0.0375 (20% reduction)
        scene.userData.lines.rotation.x += rotationSpeed * 0.67 + targetY * 0.03 * activityLevel; // Reduced from 0.0375 (20% reduction)
    }

    // Rotate the globe mesh - subtle sensitivity
    if (scene.userData.fluidMesh) {
        const baseRotation = 0.3 + activityLevel * 0.7;
        scene.userData.fluidMesh.rotation.x += 0.005 * baseRotation + targetY * 0.06 * activityLevel;
        scene.userData.fluidMesh.rotation.y += 0.007 * baseRotation + targetX * 0.06 * activityLevel;
        
        // Subtle scale with mouse distance
        const scaleMultiplier = 0.02 + activityLevel * 0.045; // 75% reduction from 0.18
        const baseScale = scene.userData.fluidMesh.userData.baseScale || 1;
        const scale = baseScale * (1 + Math.sqrt(targetX * targetX + targetY * targetY) * scaleMultiplier);
        scene.userData.fluidMesh.scale.set(scale, scale, scale);
    }

    updateThemeTransition();

    renderer.render(scene, camera);
}

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

    if (!sceneReady) {
        return;
    }

    if (!scene || !renderer) {
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
    const eased = progress * progress * (3 - 2 * progress); // smoothstep easing

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

function setSceneTheme(themeKey) {
    startSceneThemeTransition(themeKey);
}

window.setSceneTheme = setSceneTheme;

// Initialize on Load
window.addEventListener('load', init);
