// Three.js Scene Setup
let scene, camera, renderer, particles, particleGeometry, particleMaterial;
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;
let lastMouseMoveTime = 0;
let isMouseActive = false;
let activityLevel = 0.15; // Start at idle level
let dynamicLines; // For the web connections near cursor
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

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
    scene.fog = new THREE.FogExp2(0x000000, 0.001);
    scene.background = new THREE.Color(0x000000); // Pure black background

    // Create Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.z = 400;

    // Create Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('fluidCanvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create Particle System
    createParticles();

    // Create Fluid Mesh
    createFluidMesh();

    // Event Listeners
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    // Start Animation
    animate();
}

// Create Particle System
function createParticles() {
    const particleCount = 5000; // Increased from 3500
    particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    // Track positions to ensure minimum distance between particles
    const minDistance = 30; // Minimum distance between particles

    for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        let validPosition = false;
        let attempts = 0;
        let x, y, z;

        // Keep trying until we find a position that's far enough from other particles
        while (!validPosition && attempts < 50) {
            x = (Math.random() - 0.5) * 2000;
            y = (Math.random() - 0.5) * 2000;
            z = (Math.random() - 0.5) * 1500;

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

        // Random velocities for floating effect - slower to prevent clustering
        velocities[idx] = (Math.random() - 0.5) * 0.3;
        velocities[idx + 1] = (Math.random() - 0.5) * 0.3;
        velocities[idx + 2] = (Math.random() - 0.5) * 0.2;

        // All particles are green with varying brightness
        const color = new THREE.Color();
        const brightness = 0.4 + Math.random() * 0.4; // Vary brightness
        const greenShade = 0.25 + Math.random() * 0.15; // Green hue range
        color.setHSL(greenShade, 0.9, brightness);
        
        colors[idx] = color.r;
        colors[idx + 1] = color.g;
        colors[idx + 2] = color.b;

        // Varied sizes like different file sizes - smaller to prevent overlap appearance
        sizes[i] = Math.random() * 3 + 1.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Store velocities for animation
    particleGeometry.userData.velocities = velocities;

    particleMaterial = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Create dynamic web lines
    createDynamicWebLines();
}

// Create connection lines between nearby files (optional data streams)
function createFluidMesh() {
    // Create the rotating globe/mesh - light green
    const geometry = new THREE.IcosahedronGeometry(100, 4);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff88, // Light green
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });

    const fluidMesh = new THREE.Mesh(geometry, material);
    fluidMesh.position.set(0, 0, 0);
    scene.add(fluidMesh);

    // Store reference for animation
    scene.userData.fluidMesh = fluidMesh;

    // Create subtle connection lines - dark green
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00cc44, // Dark green
        transparent: true,
        opacity: 0.05,
        blending: THREE.AdditiveBlending
    });

    const linePositions = [];
    for (let i = 0; i < 50; i++) {
        linePositions.push(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 800
        );
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);
    
    scene.userData.lines = lines;
}

// Create dynamic web lines that connect particles near cursor
function createDynamicWebLines() {
    const maxConnections = 400; // Increased from 200 for much denser web
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxConnections * 6); // 2 points per line * 3 coords
    
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff44,
        transparent: true,
        opacity: 0.35,
        linewidth: 1
    });
    
    dynamicLines = new THREE.LineSegments(lineGeometry, lineMaterial);
    dynamicLines.frustumCulled = false;
    dynamicLines.userData.targetOpacity = 0;
    dynamicLines.userData.currentOpacity = 0;
    scene.add(dynamicLines);
}

// Update web connections near cursor
function updateDynamicWebLines() {
    if (!particles || !dynamicLines) {
        return;
    }
    
    // Smooth fade based on activity level
    const targetOpacity = activityLevel < 0.3 ? 0 : 0.35;
    
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
    
    const connectionRadius = 200; // Increased from 180 for better corner coverage
    const pathToGlobe = 8; // Reduced from 12 (30% reduction)
    
    // Convert mouse position to 3D space with better corner coverage
    const mouseX3D = mouseX * 0.7; // Increased from 0.6 for better right edge reach
    const mouseY3D = -mouseY * 0.7; // Increased from 0.6 for better top edge reach
    const mouseZ3D = 0; // Mouse at center Z
    
    // Globe is at origin
    const globeX = 0;
    const globeY = 0;
    const globeZ = 0;
    
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
    const globeAreaParticles = nearbyParticles
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
        const fallbackParticles = nearbyParticles
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

    // Subtle camera movement
    camera.position.x += (mouseX * 0.1 - camera.position.x) * 0.015 * activityLevel; // 75% reduction from 0.4 and 0.06
    camera.position.y += (-mouseY * 0.1 - camera.position.y) * 0.015 * activityLevel; // 75% reduction from 0.4 and 0.06
    
    // Keep camera at consistent distance
    camera.position.z = 400;
    camera.lookAt(scene.position);

    // Animate particles like floating files
    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.userData.velocities;
        const time = Date.now() * 0.0005;
        const minDistance = 40; // Increased minimum distance to prevent clumping

        // Rotate entire particle system for spatial movement - subtle
        particles.rotation.y += targetX * 0.04 * activityLevel; // Reduced from 0.05 (20% reduction)
        particles.rotation.x += targetY * 0.04 * activityLevel; // Reduced from 0.05 (20% reduction)

        for (let i = 0; i < positions.length; i += 3) {
            // Apply velocity for constant drift - scales with activity
            positions[i] += velocities[i] * (0.2 + activityLevel * 0.8);
            positions[i + 1] += velocities[i + 1] * (0.2 + activityLevel * 0.8);
            positions[i + 2] += velocities[i + 2] * (0.2 + activityLevel * 0.8);

            // Add subtle floating motion - scales with activity
            const floatIntensity = 0.05 + activityLevel * 0.15;
            positions[i] += Math.sin(time + i * 0.1) * floatIntensity;
            positions[i + 1] += Math.cos(time + i * 0.15) * floatIntensity;
            positions[i + 2] += Math.sin(time * 0.5 + i * 0.08) * floatIntensity;

            // Strong anti-clumping: check nearby particles and push away if too close
            // Check more particles to ensure better spacing
            for (let j = i + 3; j < Math.min(i + 150, positions.length); j += 3) {
                const dx = positions[j] - positions[i];
                const dy = positions[j + 1] - positions[i + 1];
                const dz = positions[j + 2] - positions[i + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                if (dist < minDistance && dist > 0) {
                    // Stronger push force to prevent clumping
                    const pushForce = (minDistance - dist) / minDistance * 1.2;
                    positions[i] -= (dx / dist) * pushForce;
                    positions[i + 1] -= (dy / dist) * pushForce;
                    positions[i + 2] -= (dz / dist) * pushForce;
                }
            }

            // Wrap around boundaries (files cycling through the space)
            if (positions[i] > 1000) positions[i] = -1000;
            if (positions[i] < -1000) positions[i] = 1000;
            if (positions[i + 1] > 1000) positions[i + 1] = -1000;
            if (positions[i + 1] < -1000) positions[i + 1] = 1000;
            if (positions[i + 2] > 750) positions[i + 2] = -750;
            if (positions[i + 2] < -750) positions[i + 2] = 750;

            // Mouse interaction - REPEL particles instead of attract (prevents clumping)
            if (activityLevel > 0.3) { // Only when somewhat active
                const dx = positions[i] - mouseX * 0.6;
                const dy = positions[i + 1] + mouseY * 0.6;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Push particles away from mouse to prevent clumping
                if (distance < 200) {
                    const repelForce = (200 - distance) / 200 * activityLevel;
                    positions[i] += (dx / distance) * repelForce * 2.0;
                    positions[i + 1] += (dy / distance) * repelForce * 2.0;
                }
            }
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
        scene.userData.fluidMesh.rotation.x += 0.004 * baseRotation + targetY * 0.06 * activityLevel; // Reduced from 0.005 and 0.075 (20% reduction)
        scene.userData.fluidMesh.rotation.y += 0.0056 * baseRotation + targetX * 0.06 * activityLevel; // Reduced from 0.007 and 0.075 (20% reduction)
        
        // Subtle scale with mouse distance
        const scaleMultiplier = 0.02 + activityLevel * 0.045; // 75% reduction from 0.18
        const scale = 1 + Math.sqrt(targetX * targetX + targetY * targetY) * scaleMultiplier;
        scene.userData.fluidMesh.scale.set(scale, scale, scale);
    }

    renderer.render(scene, camera);
}

// Initialize on Load
window.addEventListener('load', init);
