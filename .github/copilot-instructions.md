# Copilot Instructions - Turinger '26 Event Portal

## Project Overview

**Turinger '26** is an interactive event portal for the ACM MITB Student Chapter's flagship hackathon. It combines a modular particle system background with a concept showcase framework for displaying event information.

**Key Tech Stack:**
- THREE.js for 3D particle animations
- Vanilla JavaScript (module-based architecture)
- CSS custom properties for theming
- Component-based registration system

---

## Architecture & Major Components

### 1. **Dots System** (`/dots/` folder) - CRITICAL ISOLATED MODULE
- **Location:** `dots/dots.js` (623 lines), `dots.css`, `dots/README.md`
- **Purpose:** Standalone 8,500-particle spherical background with interactive globe and smooth theme transitions
- **Key Pattern:** Self-contained, reusable across multiple pages (index.html, concepts/uno.html)
- **Exports:** `window.initDots()`, `window.setDotsTheme(theme: 'white'|'black')`
- **Config:** Edit `PARTICLE_BOUNDS`, `SCENE_THEMES` constants in dots.js to adjust behavior

**Why Isolated?** In December 2025, particle logic was extracted from script.js (856 → 13 lines). This enables:
- Independent testing of particle system
- Reusable component for other projects
- Clear data flow: THREE.js → dots.js → theme management

### 2. **Concept Framework** (`/concepts/` folder)
- **uno.js** (796 lines): Dynamic card stack system
  - Manages concept data (cards array), active index, detail stage reveal
  - Uses `data-index` attributes for card navigation
  - Emits state updates via custom events (see bindCardListeners pattern)
- **uno.css**: Styling for concept overlay and console UI
- **uno.html**: Used as a page template that imports dots background

**Key Workflow:** User clicks "Learn more" → detail stage toggles → card renders in feed

### 3. **Registration Component** (`/components/registration.js`)
- **Pattern:** Web component-style mount function (not a true custom element)
- **Exposes:** `mount({triggerSelector, parent})` function
- **Usage:** Mount on demand to avoid polluting DOM until needed
- **Form Fields:** fullName, email, phone, college (all required)

### 4. **Main Application** (`/index.html`, `script.js`)
- **script.js** (17 lines): Theme wrapper + glass transition effect + social popup logic
- **Role:** Orchestrates page-level interactions, NOT particle management
- **Glass Blur Effect:** Scroll-triggered blur/dim overlay on concept sections (CSS variables: `--background-blur`, `--background-dim`)
- **Social Links:** Platform data object with dynamic link updates

---

## Data Flows & Communication Patterns

### Theme Switching
```
User clicks theme toggle → setSceneTheme(theme) 
  → window.setDotsTheme(theme)
  → Dots system updates THREE.js scene (850ms transition)
  → Body class updated (.theme-black)
  → CSS variables update all styling
```

### Scroll-Based Effects
```
window.scroll event 
  → updateGlassEffect() calculates progress (300px → 2000px range)
  → CSS variables updated (--background-blur, --background-dim)
  → Backdrop styling reactive to scroll position
```

### Concept Navigation
```
Card click or button interaction 
  → uno.js activeIndex updates
  → DOM re-renders with new card data
  → Detail stage toggles visibility
```

---

## Critical Patterns & Conventions

### 1. **CSS Custom Properties (Variables)**
Used for dynamic theming without JS re-renders:
- `--background-blur`: Scroll-triggered effect (0-8px range)
- `--background-dim`: Overlay darkness (0-0.5 opacity)
- `--concept-accent`: Dynamic concept color (default #4ab8ff)

**Pattern:** Always update via `element.style.setProperty()`, not inline styles

### 2. **Module Initialization Pattern**
All modules use DOMContentLoaded + window event listeners:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Safe to access DOM
});
```

Do NOT rely on inline script tags executing in order—use this pattern instead.

### 3. **Import Versioning**
Files include cache-busting: `href="style.css?v=54"`, `href="dots/dots.js"` (no version for modular system)

When updating CSS/JS, increment the version number to force client refresh.

### 4. **Theme Consistency**
- **White theme:** Light backgrounds (#ffffff), dark text (#0b1814), blue accents (#0018F9)
- **Black theme:** Dark backgrounds (#000000), light text (#d5ffe9)
- Theme applies to: body class, canvas background, particle colors, globe color

Update both HTML body class AND canvas rendering to maintain sync.

### 5. **Component Mounting Pattern** (Registration)
```javascript
const registration = require('components/registration.js');
registration.mount({ triggerSelector: '#registerBtn', parent: document.body });
```

Components expose `mount()` instead of auto-initializing → better control over when/where they render.

---

## Integration Points & Dependencies

### External Libraries
- **THREE.js (v128):** CDN link in dots/README.md and index.html
- **Google Fonts:** BBH Bartle, Zen Dots (used for headings)

### Page Structure Requirements
All pages using dots system must include:
1. `<canvas id="fluidCanvas"></canvas>` in HTML
2. THREE.js library before dots.js
3. `dots/dots.css` and `dots/dots.js` imports
4. `window.addEventListener('load', initDots)` call

**Example:** See [concepts/uno.html](concepts/uno.html) for reference structure.

### Cross-File Communication
- **Main ↔ Dots:** Via `window.setDotsTheme()` global function
- **Main ↔ Concepts:** Via DOM events and data-* attributes
- **Main ↔ Registration:** Via `mount()` function call

No central state manager—communication is direct (script.js) or event-based (uno.js).

---

## Developer Workflows & Commands

### **Testing Particle Background**
1. Open browser DevTools → Console
2. Test: `window.setDotsTheme('black')` then `setDotsTheme('white')`
3. Verify smooth 850ms transitions, no visual artifacts

### **Testing Concept Navigation**
1. Scroll to concept section
2. Click card → Verify detail stage appears
3. Click "Learn more" → Verify stage reveals with animation

### **Performance Tuning**
Edit in `dots/dots.js`:
- `PARTICLE_COUNT = 8500` (reduce for low-end devices)
- `PARTICLE_BOUNDS.radiusMax = 880` (adjust sphere size)
- `particleSize: 6.5` (in SCENE_THEMES) for visual impact

### **Adding New Pages**
1. Copy dots imports from index.html (3 lines)
2. Add `<canvas id="fluidCanvas"></canvas>`
3. Call `window.addEventListener('load', initDots)`
4. Reference [dots/README.md](dots/README.md) for full setup

---

## Common Pitfalls & Gotchas

1. **Canvas ID Mismatch:** If canvas not named `fluidCanvas`, dots system won't find it
2. **Missing THREE.js:** Dots system silently fails if THREE.js not loaded first
3. **Version Caching:** Browser caches CSS/JS—always increment `?v=X` when pushing updates
4. **Theme Sync:** Body class and canvas rendering can diverge if theme changes via different paths
5. **Scroll Events:** Use `{ passive: true }` flag to avoid jank on scroll listener
6. **Z-Index Conflicts:** Canvas is at z-index -10, center title at z-50, concept overlay at z-100

---

## Key Files & Their Roles

| File | Lines | Purpose |
|------|-------|---------|
| [dots/dots.js](dots/dots.js) | 623 | Particle system, THREE.js scene, theme mgmt |
| [script.js](script.js) | 17 | Page orchestration, glass effect, social links |
| [concepts/uno.js](concepts/uno.js) | 796 | Concept card navigation & detail reveal |
| [index.html](index.html) | 523 | Main landing page + entry point |
| [style.css](style.css) | 1259 | Global layout & theming (no particle styling) |
| [components/registration.js](components/registration.js) | 75 | Registration modal component |

---

## Questions for Refinement

- Should the registration component move to a dedicated `/modules` folder structure?
- Any specific analytics or tracking needs for concept navigation?
- Performance targets for particle count on mobile devices?
