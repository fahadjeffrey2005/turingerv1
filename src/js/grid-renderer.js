class GridRenderer {
    constructor() {
        this.gridLines = null;
        this.gridMaterial = null;
    }

    createGrid(scene, gridSize, spacing, config = {}) {
        const gridGeometry = new THREE.BufferGeometry();
        const points = [];

        const lineColor = config.lineColor || 0x010FFF;
        const lineOpacity = config.lineOpacity || 0.3;

        // Horizontal lines
        for (let x = 0; x <= gridSize; x++) {
            const posX = (x - gridSize / 2) * spacing;
            points.push(posX, 0, -(gridSize / 2) * spacing);
            points.push(posX, 0, (gridSize / 2) * spacing);
        }

        // Vertical lines
        for (let z = 0; z <= gridSize; z++) {
            const posZ = (z - gridSize / 2) * spacing;
            points.push(-(gridSize / 2) * spacing, 0, posZ);
            points.push((gridSize / 2) * spacing, 0, posZ);
        }

        gridGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

        this.gridMaterial = new THREE.LineBasicMaterial({
            color: lineColor,
            opacity: lineOpacity,
            transparent: true,
            linewidth: 1
        });

        this.gridLines = new THREE.LineSegments(gridGeometry, this.gridMaterial);
        scene.add(this.gridLines);
    }

    setOpacity(opacity) {
        if (this.gridMaterial) {
            this.gridMaterial.opacity = opacity;
        }
    }

    setColor(color) {
        if (this.gridMaterial) {
            this.gridMaterial.color.setHex(color);
        }
    }

    setVisibility(visible) {
        if (this.gridLines) {
            this.gridLines.visible = visible;
        }
    }

    remove(scene) {
        if (this.gridLines) {
            scene.remove(this.gridLines);
            this.gridGeometry?.dispose();
            this.gridMaterial?.dispose();
        }
    }
}
