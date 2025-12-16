# Dots System - Modular Particle Background

A standalone, reusable particle system with an animated globe and theme support. Perfect for adding an interactive blue dot background to any project.

## Features

- **8,500 animated particles** in a spherical field
- **Interactive globe** at the center that rotates with cursor movement
- **Smooth theme transitions** between white and black modes
- **Mouse-responsive** camera movement and rotation
- **Optimized performance** with particle anti-clumping
- **Fully configurable** particle bounds, colors, and animations

## Installation

### 1. Include Required Libraries

Add THREE.js to your HTML:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

### 2. Add Canvas Element

Add this to your HTML `<head>` or at the start of `<body>`:
```html
<canvas id="fluidCanvas"></canvas>
```

### 3. Include Dots System

Add these to your HTML before closing `</body>`:
```html
<link rel="stylesheet" href="path/to/dots/dots.css">
<script src="path/to/dots/dots.js"></script>
```

### 4. Initialize

Add this to your HTML or JavaScript:
```html
<script>
    window.addEventListener('load', initDots);
</script>
```

## Usage

### Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project with Dots</title>
    
    <!-- Dots System -->
    <link rel="stylesheet" href="dots/dots.css">
</head>
<body>
    <!-- Your content here -->
    <h1>Welcome</h1>
    
    <!-- Dots Canvas -->
    <canvas id="fluidCanvas"></canvas>
    
    <!-- Required Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    
    <!-- Dots System -->
    <script src="dots/dots.js"></script>
    
    <!-- Initialize -->
    <script>
        window.addEventListener('load', initDots);
    </script>
</body>
</html>
```

### Change Theme

Switch between white and black themes programmatically:

```javascript
// Switch to black theme
setDotsTheme('black');

// Switch to white theme
setDotsTheme('white');
```

## Configuration

### Particle Bounds

Edit `PARTICLE_BOUNDS` in `dots.js` to adjust the particle field:

```javascript
const PARTICLE_BOUNDS = {
    radiusMin: 420,      // Minimum radius of particle sphere
    radiusMax: 880,      // Maximum radius of particle sphere
    extraRadius: 1050,   // Extended boundary for wrapping
    cameraZ: 400,        // Camera Z position
    minCameraDistance: 220 // Minimum distance from camera
};
```

### Globe Offset

Adjust where the globe appears:

```javascript
const GLOBE_OFFSET = {
    x: 0,
    y: 0,
    z: 0
};
```

### Theme Colors

Customize colors in `SCENE_THEMES`:

```javascript
const SCENE_THEMES = {
    white: {
        clearColor: 0xffffff,        // Background color
        particleSize: 6.5,            // Particle size
        particleOpacity: 1,           // Particle opacity
        globeColor: 0x0018F9,         // Globe color (blue)
        particlePalette: {
            hue: [0.55, 0.62],        // Hue range (blue)
            saturation: 1,            // Color saturation
            lightness: [0.25, 0.45]   // Brightness range
        }
    },
    black: {
        // ...similar structure for black theme
    }
};
```

## Performance Tips

1. **Particle Count**: Change `particleCount` in `createParticles()` to adjust quality vs performance
2. **Animation Speed**: Modify the animation timing in `animateDots()` 
3. **Blur**: The `scene.fog` creates a subtle depth blur effect - adjust `fogDensity`
4. **Mouse Tracking**: Disable mouse movement by commenting out the event listener to reduce CPU usage

## API

### Functions

- `initDots()` - Initialize the particle system
- `setDotsTheme(themeKey)` - Change theme ('white' or 'black')

### Global Objects

- `scene` - THREE.js scene
- `renderer` - THREE.js renderer
- `particles` - Points geometry containing all particles
- `SCENE_THEMES` - Theme configuration object

## Troubleshooting

### Canvas Not Appearing

- Ensure THREE.js library is loaded before dots.js
- Check that canvas element has id="fluidCanvas"
- Verify z-index in CSS doesn't overlap with content

### Performance Issues

- Reduce particle count: change `particleCount` to 4000-6000
- Disable mouse tracking: comment out `document.addEventListener('mousemove', ...)`
- Use lower pixel ratio: modify `renderer.setPixelRatio()`

### Theme Not Changing

- Ensure `setDotsTheme()` is called after `initDots()`
- Check browser console for errors
- Use valid theme keys: 'white' or 'black' only

## Browser Support

- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- Requires WebGL support

## License

This particle system is reusable and can be integrated into any project.

## Credits

Optimized particle system with:
- 8,500 particles in spherical distribution
- Smooth theme transitions (850ms)
- Mouse-responsive camera movement
- Anti-clumping particle spacing
- Animated rotating globe centerpiece

Enjoy the dots! 🌟
