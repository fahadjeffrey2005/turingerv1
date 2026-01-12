class ParticleSystem {
    constructor(config = {}) {
        this.config = config;
        this.particles = [];
        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.defaultColor = new THREE.Color(0.0627, 0.5176, 1.0); // Blue #010FFF
        this.hoverColor = new THREE.Color(1.0, 1.0, 1.0); // White
    }

    createGrid(scene, gridSize, spacing, colors = {}) {
        const particleCount = gridSize * gridSize;
        
        this.geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors_attr = new Float32Array(particleCount * 3);

        const particleColor = colors.particle || this.defaultColor;
        
        let index = 0;
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                const posX = (x - gridSize / 2) * spacing;
                const posZ = (z - gridSize / 2) * spacing;
                const posY = Math.sin(posX * 0.1) * Math.cos(posZ * 0.1) * 2;

                positions[index * 3] = posX;
                positions[index * 3 + 1] = posY;
                positions[index * 3 + 2] = posZ;

                colors_attr[index * 3] = particleColor.r;
                colors_attr[index * 3 + 1] = particleColor.g;
                colors_attr[index * 3 + 2] = particleColor.b;

                this.particles.push({
                    x: posX,
                    y: posY,
                    z: posZ,
                    originalY: posY,
                    index: index
                });

                index++;
            }
        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.geometry.setAttribute('color', new THREE.BufferAttribute(colors_attr, 3));

        this.material = new THREE.PointsMaterial({
            size: this.config.particleSize || 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.mesh = new THREE.Points(this.geometry, this.material);
        scene.add(this.mesh);
    }

    update(mousePos, config) {
        if (!this.geometry || !this.particles.length) return;

        const positions = this.geometry.attributes.position.array;
        const colors = this.geometry.attributes.color.array;
        const hoverDistance = config.hoverDistance || 20;
        const hoverLift = config.hoverLift || 8;

        this.particles.forEach((particle) => {
            const dx = particle.x - mousePos.x;
            const dz = particle.z - mousePos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < hoverDistance) {
                const influence = 1 - distance / hoverDistance;
                particle.y = particle.originalY + influence * hoverLift;

                // Change color on hover
                colors[particle.index * 3] = this.hoverColor.r;
                colors[particle.index * 3 + 1] = this.hoverColor.g;
                colors[particle.index * 3 + 2] = this.hoverColor.b;
            } else {
                particle.y = particle.originalY;

                // Reset color
                const particleColor = config.particleColor || this.defaultColor;
                colors[particle.index * 3] = particleColor.r;
                colors[particle.index * 3 + 1] = particleColor.g;
                colors[particle.index * 3 + 2] = particleColor.b;
            }

            positions[particle.index * 3 + 1] = particle.y;
        });

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
    }

    getParticleCount() {
        return this.particles.length;
    }

    reset() {
        this.particles.forEach((particle) => {
            particle.y = particle.originalY;
        });
        const positions = this.geometry.attributes.position.array;
        this.particles.forEach((particle) => {
            positions[particle.index * 3 + 1] = particle.originalY;
        });
        this.geometry.attributes.position.needsUpdate = true;
    }
}
