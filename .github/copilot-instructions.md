# Copilot Instructions - Turinger '26 Event Portal

## Project Overview

**Turinger '26** is an interactive event portal for the ACM MITB Student Chapter's flagship hackathon. It combines a modular particle system background with a concept showcase framework for displaying event information.

**Key Tech Stack:**
- THREE.js (v128) for 3D particle animations with interactive globe
- Vanilla JavaScript (module-based architecture, no frameworks)
- CSS custom properties for dynamic theming without JS re-renders
- Autonomous component mounting system (registration modal)

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
- `--primary-color` / `--primary-light`: Theme-aware accent colors

**Pattern:** Always update via `element.style.setProperty()`, not inline styles. Example:
```javascript
root.style.setProperty('--background-blur', `${blurAmount}px`);
```

### 2. **Module Initialization Pattern**
All modules use `DOMContentLoaded` + window event listeners:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Safe to access DOM
    const el = document.getElementById('elementId');
    if (!el) return; // Graceful fallback for missing elements
});
```

**Critical:** Do NOT rely on inline script tag execution order. Modules must check for required DOM elements and silently return if missing (see uno.js pattern with `if (!conceptStack) return`).

### 3. **Import Versioning for Cache Control**
HTML imports include cache-busting: `href="style.css?v=54"`
- Increment version number in ALL HTML files when updating CSS/JS
- Use same version across all imports for consistency
- Dots system files (`dots/dots.js`, `dots/dots.css`) use no version—they're modular

When pushing updates: increment `?v=X` in index.html, concepts/uno.html, sponsorship.html, hackathon.html, etc.

### 4. **Theme Consistency Across Rendering**
- **White theme:** Light backgrounds (#ffffff), dark text (#0b1814), blue accents (#0018F9)
- **Black theme:** Dark backgrounds (#000000), light text (#d5ffe9), cyan accents (#0080FE)

**Critical:** Theme applies to THREE PLACES:
1. HTML body class: `body.theme-white` or `body.theme-black`
2. Canvas/THREE.js scene colors (handled by dots.js)
3. CSS variables for styling

Verify theme sync by testing in console: `window.setDotsTheme('black')` and checking DOM reflects change.

### 5. **Component Mounting Pattern** (Registration Modal)
Components expose `mount()` instead of auto-initializing:
```javascript
// In HTML
<button id="registerBtn">Register</button>

// In script.js or page script
const registration = require('components/registration.js');
registration.mount({ triggerSelector: '#registerBtn', parent: document.body });
```

**Benefits:** Better control over when/where components render, avoids DOM pollution until needed.

### 6. **DOM Event & Data Attribute Communication**
uno.js uses `data-*` attributes for card indexing:
```html
<div class="concept-card" data-index="01">
    <!-- Card content -->
</div>
```

State updates via custom events emitted from uno.js module. No central state manager—direct DOM manipulation with jQuery-style selectors.

---

## Integration Points & Dependencies

### External Libraries
- **THREE.js (v128):** CDN link (see index.html or dots/README.md for exact URL)
- **Google Fonts:** BBH Bartle (headings), Zen Dots (decorative), Inter (body text)

### Scripting Order (Critical!)
In HTML, scripts must load in this sequence:
1. **Google Fonts** (preconnect for performance)
2. **CSS files** (with version cache-busting)
3. **THREE.js library** (CDN, required before dots.js)
4. **dots/dots.css** (particle system styling)
5. **dots/dots.js** (exposes `window.initDots()`)
6. **Page-specific JS** (concepts/uno.js, script.js, components/registration.js)
7. **Initialization listeners:** `window.addEventListener('load', initDots)`

**Failure mode:** If THREE.js loads after dots.js, dots system silently fails (no errors in console).

### Page Structure Requirements
All pages using dots background must include:
```html
<canvas id="fluidCanvas"></canvas>
<link rel="stylesheet" href="dots/dots.css?v=54">
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="dots/dots.js"></script>
<script>
  window.addEventListener('load', () => {
    window.initDots();
    // Other initialization
  });
</script>
```

**Example structure:** See [index.html](index.html) or [sponsorship.html](sponsorship.html).

### Cross-Component Communication
- **Main ↔ Dots:** Via `window.setDotsTheme(theme)` global function
- **Main ↔ Concepts:** Via DOM events and `data-index` attributes on `.concept-card` elements
- **Main ↔ Registration:** Via `mount()` function call with trigger selector

**Pattern:** No central state manager. Communication is:
- **Direct:** script.js calls `window.setDotsTheme()`
- **Event-based:** uno.js listens to card click events, updates active index
- **DOM-based:** CSS variables and body classes propagate styling changes

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

1. **Canvas ID Mismatch:** If canvas not named `fluidCanvas`, dots system won't initialize. Check: `document.getElementById('fluidCanvas')`
2. **Missing THREE.js:** Dots system silently fails if THREE.js not loaded BEFORE dots.js. No console errors—verify script order in DevTools
3. **Version Caching:** Browser caches CSS/JS aggressively—always increment `?v=X` when pushing CSS/JS changes to multiple HTML files
4. **Theme Sync Divergence:** Body class and canvas colors can diverge if theme changes via different paths (direct setDotsTheme vs toggle button). Always test: `window.setDotsTheme('black')` in console and verify DOM + canvas both update
5. **Scroll Events:** Use `{ passive: true }` flag on scroll listeners to avoid jank (already done in script.js, but important for new listeners)
6. **Z-Index Conflicts:** 
   - Canvas: z-index -10
   - Center title (#centerTitle): z-index 50
   - Concept overlay: z-index 100
   - Registration modal: ensure higher than 100
7. **Concept Cards Not Found:** uno.js returns silently if no `.concept-card` elements exist. Check console for warning: `[concepts] No concept cards found on page.`
8. **Registration Modal Pollution:** Always mount on demand with selector. If registered twice, previous instance persists (check with `document.getElementById('registrationModal')`)

---

## Common Modification Patterns

### Adding a New Theme Color
1. Edit `SCENE_THEMES` in [dots/dots.js](dots/dots.js#L33) (both 'white' and 'black' entries)
2. Update color values in `:root` CSS variables in affected HTML files
3. Test in console: `window.setDotsTheme('white')` then `window.setDotsTheme('black')`

### Adding a New Concept Card
1. Create `.concept-card` div with required text elements (title, subtitle, blurb, detail content)
2. Add to HTML page in proper section
3. uno.js auto-discovers via `document.querySelectorAll('.concept-card')`
4. No JS changes needed if using standard card structure

### Updating Page Content
- Always increment `?v=X` in HTML imports (style.css, dots.css, etc.) to bust browser cache
- Keep versioning synchronized across all HTML files for consistency
- Test with DevTools cache disabled (Network tab → Disable cache checkbox)

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
