# Mobile Optimization Guide - Turinger '26

## Overview
This document outlines all mobile optimizations implemented to ensure the website performs well on phones with minimal latency and no graphics degradation.

---

## 1. Particle System Optimization (dots.js)

### Dynamic Particle Count
- **Desktop:** 8,500 particles (full quality)
- **Mobile (standard):** 3,000 particles (balanced performance)
- **Mobile (low-end):** 1,500 particles (maximum performance)

Detection is automatic based on:
- User agent detection (iPhone, iPad, Android, etc.)
- Window width detection (`max-width: 768px`)
- Hardware concurrency (CPU cores) for low-end device detection

### Particle Size Optimization
- **White theme desktop:** 6.5px
- **White theme mobile:** 3.5px
- **Black theme desktop:** 4.5px
- **Black theme mobile:** 2.5px

Smaller particles maintain visual quality while reducing GPU load.

### Interactive Globe Follow
- **Desktop:** Full mouse tracking with smooth camera movement
- **Mobile:** Disabled mouse tracking; uses subtle automatic rotation instead
- Benefits: Eliminates constant position calculations on touch devices

---

## 2. Touch Event Handling (dots.js)

Added native touch event listeners:
```javascript
document.addEventListener('touchmove', onDocumentTouchMove, { passive: true });
document.addEventListener('touchend', onDocumentTouchEnd, false);
```

- `passive: true` flag for better scroll performance
- Disables mouse tracking on touch devices to prevent redundant calculations
- Provides subtle auto-rotation instead of following user input

---

## 3. CSS Responsive Design (style.css)

### Breakpoint: 768px and below (tablets & phones)
- Reduces heading sizes (h1, h2, h3)
- Increases touch target sizes to minimum 48px (accessibility standard)
- Optimized button/form padding
- Reduces animation duration to 0.3s for perceived snappiness
- Removes expensive backdrop filters (from blur(8px) to blur(2px))

### Breakpoint: 480px and below (small phones)
- Further reduces font sizes
- Optimizes landing section height (60vh instead of full)
- Stacks modal buttons vertically for easier interaction
- Minimal padding/margins to maximize content area

### Touch Device Optimization
```css
@media (hover: none) {
    button:hover { transform: none; }
}
```
Removes hover effects on touch devices where they don't exist, reducing unnecessary CSS calculations.

---

## 4. Modal & Form Optimization (registration.css)

### Desktop
- Modal width: up to 1000px
- Buttons in row layout (side-by-side)

### Mobile (768px)
- Modal width: 95% of viewport (max 90vw)
- Buttons stack vertically
- Reduced padding: 16px instead of 22px
- Optimized shadows (lighter, faster rendering)

### Small Phones (480px)
- Ultra-compact: padding 14px
- Minimum button heights (48px)
- Full-width button layout

---

## 5. Performance Optimizations

### Rendering Optimizations
1. **Reduced particle count** on mobile = fewer GPU calculations
2. **Lower resolution textures** implicitly through particle size reduction
3. **Disabled expensive effects:**
   - Mouse tracking on mobile
   - Complex backdrop filters
   - Hover transform animations on touch

### Animation Performance
- Scroll behavior: `auto` on mobile (no smooth scroll overhead)
- Animation duration: 0.3s (faster perceived performance)
- Theme transition: 850ms (unchanged, smooth enough)

### Network Performance (Netlify)
- All CSS is gzipped by default
- Fonts are preconnected (faster loading)
- No additional assets loaded on mobile
- Cache busting works across all files

---

## 6. Testing Checklist

### Mobile Devices to Test
- iPhone (latest)
- Android phone (Samsung/Pixel)
- Tablet (iPad, Android tablet)
- Low-end Android phone

### Testing Points
- [ ] Load time on 4G (use DevTools throttling)
- [ ] Particle animation smoothness (60fps target)
- [ ] Button responsiveness and tap targets
- [ ] Modal opening/closing on mobile
- [ ] Theme switching on mobile
- [ ] No visual jank during scroll
- [ ] Touch interactions work smoothly
- [ ] Fonts render correctly at all sizes

### DevTools Performance Check
1. Open DevTools → Performance tab
2. Record 3-second session while interacting
3. Check for:
   - Frame rate drops below 30fps
   - Long tasks blocking main thread
   - GPU memory issues
4. Lighthouse score should be 80+

---

## 7. Future Optimizations

If performance issues arise:

### Level 1: Reduce particle count further
```javascript
// In dots.js, adjust thresholds
if (isMobileDevice()) {
    particleCount = isLowEndDevice() ? 1000 : 2000; // Further reduction
}
```

### Level 2: Disable particles entirely on low-end
```javascript
if (isMobileDevice() && isLowEndDevice()) {
    // Show static background instead
}
```

### Level 3: Lazy-load heavy assets
```javascript
// Load animations only when user scrolls to them
IntersectionObserver for concept sections
```

---

## 8. Known Limitations

- Particles will be less dense on mobile (intentional trade-off for performance)
- Theme transitions will be visible on very slow devices (unavoidable)
- Netlify builds may take slightly longer due to additional optimizations

---

## 9. Browser Support

All optimizations are compatible with:
- iOS Safari 12+
- Chrome Android 90+
- Samsung Internet 14+
- Firefox Android 88+

---

## Deployment Notes

When deploying on Netlify:
1. All optimizations are automatic
2. No server-side changes needed
3. CSS/JS compression is automatic
4. Monitor performance metrics in Netlify Analytics
5. Use WebPageTest for real-world performance testing

---

## Contact & Questions

If mobile performance issues arise after deployment:
1. Check browser DevTools Performance tab
2. Review Netlify Analytics for loading times
3. Test on actual devices (not emulator)
4. Adjust particle count thresholds if needed
