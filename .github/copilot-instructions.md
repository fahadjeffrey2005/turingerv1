# AI Coding Agent Instructions - Turinger '26 Portal

## Project Overview
This is a modern event portal for **Turinger '26** (a hackathon/symposium event) built with vanilla JavaScript, THREE.js for 3D graphics, and Firebase Firestore for data persistence. The site is multi-page with shared component architecture and dynamic theming.

## Architecture Essentials

### Frontend Stack (No Build Tool)
- **Vanilla JavaScript ES modules** - Import/export used in components
- **THREE.js** for 3D particle systems and advanced graphics
- **Firebase Firestore** (emulator in dev via `firebase.json`)
- **CSS Variables** for theming (--background-blur, --background-dim, --concept-accent)
- **No bundler** - files served directly; use query params for cache busting (e.g., `?v=54`)

### Multi-Page Structure
- **index.html** - Main portal with timeline, concepts, event cards
- **registration.html, payment.html, sponsorship.html, hackathon.html, symposium.html** - Event-specific pages
- Shared styles in `style.css`; component-specific CSS in subdirectories

### Key Component Architecture
- **dots/dots.js** - Modular particle background system. Theme-aware via `window.setDotsTheme()`. Handles device detection (mobile, low-end) and responsive particle counts
- **components/registration.js** - Modal registration component. Exported as `mount()` function. Supports tier-based styling (platinum/gold/silver/bronze)
- **concepts/uno.js** - Card stack carousel with scroll-triggered animations and accent color management
- **src/js/** - Advanced 3D modules: `particle-system.js`, `camera-controller.js`, `input-manager.js`, `grid-renderer.js`, `infinity-background.js`

## Critical Patterns & Conventions

### Theme Management
- **Global theme function**: `window.setSceneTheme(themeKey)` delegates to `window.setDotsTheme()`
- Apply CSS class `theme-black` to body for dark mode (inverts `--background-dim` and `--background-blur`)
- Tier colors defined in `getTierColor()` (registration.js) with border and accent properties

### Component Mounting Pattern
Components use functional mount pattern:
```javascript
mount({ triggerSelector, parent, tier }) // registration.js pattern
// Check if already mounted before creating duplicate modals
// Attach event listeners to triggers with `data-registrationBound` flag
```

### Scroll-Based Effects
- CSS vars updated by script.js `updateGlassEffect()` for blur/dim as user scrolls
- Easing uses cubic easing: `4 * progress³` for acceleration
- Check if register button visible to disable effect (prevent conflicts)

### Data Flow: Firebase
- **Firestore rules** in `firestore.rules` - registrations collection allows `create` (no auth required, `|| true`), read/list open, update/delete blocked
- **Indexes** in `firestore.indexes.json` - composite indexes for queries
- Emulator runs on `localhost:8000` during development

### Form Handling
- Registration form fields: fullName, email, phone, college
- Forms emit custom events or use `.closest()` to find parent tier card context
- Modal shows different subtitle based on page path (symposium.html vs default)
- **Input Validation**: Use `validator.validateRegistrationForm()` and `validator.validateEnquiryForm()` from `src/js/input-validator.js`
- **Security**: All user inputs are sanitized against XSS, NoSQL injection, CSRF, and malicious scripts before Firestore submission

## Developer Workflows

### Local Development
1. No build step required - serve files directly (Python `http.server` or similar)
2. Firebase emulator: `firebase emulators:start` (configured in firebase.json)
3. Update cache-busting version in HTML link tags when modifying JS/CSS

### Debugging
- Enable dots debug panel: `window.showDotsDebug = true; location.reload()` (console)
- Performance: check `isMobileDevice()` and `isLowEndDevice()` logic in dots.js
- THREE.js scene inspection available in WebGL renderer props

### File Organization Rules
- Component styles live in component directories (e.g., `components/registration.css`)
- Global styles in `style.css`; only override with component-scoped selectors
- THREE.js modules in `src/js/` are self-contained utility classes

## Integration Points

### Cross-Component Communication
- **Theme switching**: dots.js exposes `window.setDotsTheme()`, called by script.js `setSceneTheme()`
- **Registration animation**: components reference `window.registrationAnimation` if present
- **Event navigation**: inline `onclick="window.location.href='/${eventId}.html'"` in script.js

### External Data
- Social links hardcoded in `script.js` with ACM, ACM W, SIG-SOFT, SIG-AI accounts
- Logos in `logos/` directory referenced by social popup and concept cards
- Emulator-only Firebase (no production config visible)

## Code Style Notes
- **Modal/overlay patterns**: CSS classes for states (`.active`), data attributes for context (`data-tier`)
- **Color system**: Use RGBA for transparency in glass effects; hex for accent colors
- **Mobile-first**: Use `matchMedia('(max-width: 768px)')` for responsive queries
- **PassiveEventListener**: Scroll events use `{ passive: true }` for perf

## Security & Input Validation

### Input Validator (`src/js/input-validator.js`)
Comprehensive validation against common web threats:
- **XSS Prevention**: Strips HTML tags, script tags, event handlers, and javascript: protocols
- **NoSQL Injection**: Removes MongoDB operators (`$where`, `$ne`, `$regex`, etc.)
- **CSRF**: Basic token validation available via `validateCSRFToken()`
- **Data Type Enforcement**: Each field type has strict regex patterns and length limits

### Usage Examples
```javascript
// Registration form validation
const validation = validator.validateRegistrationForm({
  fullName, email, phone, college, events
});
if (!validation.valid) {
  showError(validation.errors.join(', '));
  return;
}
const sanitized = validation.sanitizedData;

// Individual field validation
validator.validateEmail(email);      // Returns { valid, error?, value? }
validator.validateName(name);        // Whitelist: letters, spaces, hyphens, apostrophes
validator.validatePhone(phone);      // 7-15 digits
validator.validateMessage(text);     // Up to 5000 chars, sanitized
validator.validateTier(tier);        // Only platinum|gold|silver|bronze
```

### Field Type Constraints
- **Name**: 2-100 chars, letters only + spaces/hyphens/apostrophes
- **Email**: RFC 5322 simplified format, max 254 chars
- **Phone**: 7-15 numeric digits (all punctuation removed)
- **College**: 2-150 chars, alphanumeric + spaces/punctuation
- **Message**: 0-5000 chars, all XSS patterns removed
- **Events**: Whitelisted array values only (hardcoded valid event IDs)

### Integration Points
1. Include validator: `<script src="src/js/input-validator.js"></script>`
2. Validate before form submission or Firestore write
3. Always display error messages to user on validation failure
4. Use sanitized data for database writes (prevents injection)
