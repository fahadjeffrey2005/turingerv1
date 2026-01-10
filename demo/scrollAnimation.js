/**
 * Scroll Animation Module
 * Modular scroll-triggered animation system for dots particle background
 * 
 * Features:
 * - Particle fade on scroll
 * - Camera zoom into globe
 * - Logo reveal at threshold
 * 
 * Usage:
 * 1. Include THREE.js library
 * 2. Include dots/dots.js
 * 3. Include scrollAnimation.js
 * 4. Add logo overlay HTML element with id="logoOverlay"
 * 5. Call window.initScrollAnimation(config)
 * 
 * Example:
 * window.initScrollAnimation({
 *     particleFadeRate: 1.5,
 *     cameraZStart: 400,
 *     cameraZEnd: 50,
 *     theme: 'black',
 *     initDelay: 500,
 *     logoThreshold: 0.85
 * });
 */

(function() {
    'use strict';

    window.initScrollAnimation = function(config = {}) {
        const {
            particleFadeRate = 1.5,
            cameraZStart = 400,
            cameraZEnd = 50,
            theme = 'black',
            initDelay = 500,
            logoThreshold = 0.85
        } = config;

        let logoShown = false;

        window.addEventListener('load', () => {
            // Initialize dots system
            if (typeof window.initDots === 'function') {
                window.initDots();
            }
            if (typeof window.setDotsTheme === 'function') {
                window.setDotsTheme(theme);
            }

            // Give time for dots to initialize before attaching scroll listener
            setTimeout(() => {
                window.addEventListener('scroll', () => {
                    // Calculate scroll progress (0 to 1)
                    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                    const scrollProgress = window.scrollY / scrollHeight;
                    
                    // Fade out particles: opacity decreases from 1 to 0
                    const particleOpacity = Math.max(0, 1 - scrollProgress * particleFadeRate);
                    
                    // Fade ONLY the particles material, NOT the globe
                    if (window.dotsParticleMaterial) {
                        window.dotsParticleMaterial.opacity = particleOpacity;
                        window.dotsParticleMaterial.needsUpdate = true;
                    }
                    
                    // Move camera closer to make globe appear larger
                    const cameraZRange = cameraZStart - cameraZEnd;
                    const newZ = cameraZStart - (scrollProgress * cameraZRange);
                    if (typeof window.setDynamicCameraZ === 'function') {
                        window.setDynamicCameraZ(newZ);
                    }

                    // Show logo when camera reaches near the end (inside the globe)
                    if (scrollProgress >= logoThreshold && !logoShown) {
                        const logoOverlay = document.getElementById('logoOverlay');
                        if (logoOverlay) {
                            logoOverlay.classList.add('active');
                            logoShown = true;
                        }
                    } else if (scrollProgress < logoThreshold && logoShown) {
                        const logoOverlay = document.getElementById('logoOverlay');
                        if (logoOverlay) {
                            logoOverlay.classList.remove('active');
                            logoShown = false;
                        }
                    }
                }, { passive: true });
            }, initDelay);
        });
    };

})();
