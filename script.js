// ============================================================
// DOTS SYSTEM - Now handled by dots/dots.js
// The particle background, globe, and all animations
// have been moved to a standalone modular system.
// See /dots folder for complete documentation.
// ============================================================

// Theme control function that delegates to dots system
function setSceneTheme(themeKey) {
    if (window.setDotsTheme) {
        window.setDotsTheme(themeKey);
    }
}

// Make it available globally
window.setSceneTheme = setSceneTheme;

// ============================================================
// GLASS TRANSITION EFFECT - Scroll-based Blur & Dim
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const blurOverlay = document.getElementById('conceptBlurOverlay');
    const unoSection = document.getElementById('concept-uno');

    if (!blurOverlay || !unoSection) return;

    const updateGlassEffect = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Get section position
        const sectionTop = unoSection.offsetTop;
        const sectionHeight = unoSection.offsetHeight;
        const fadeOutStart = sectionTop + sectionHeight - window.innerHeight;
        
        // Calculate effect progression
        const scrollStart = 300;           // Start effect after 300px
        const scrollEnd = 2000;            // Reach max at 2000px
        const fadeOutEnd = fadeOutStart + 1700; // Fade out over 1700px
        
        let progress = 0;
        
        if (scrollY < scrollStart) {
            progress = 0;
        } else if (scrollY < scrollEnd) {
            progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
        } else if (scrollY < fadeOutEnd) {
            progress = 1 - ((scrollY - scrollEnd) / (fadeOutEnd - scrollEnd));
        } else {
            progress = 0;
        }
        
        progress = Math.max(0, Math.min(1, progress));
        
        // Smooth cubic easing
        const easeProgress = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const blurAmount = easeProgress * 8;
        const dimAmount = easeProgress * 0.50;
        
        // Update CSS variables
        root.style.setProperty('--background-blur', `${blurAmount.toFixed(2)}px`);
        root.style.setProperty('--background-dim', dimAmount.toFixed(2));
    };

    // Listen to scroll
    window.addEventListener('scroll', updateGlassEffect, { passive: true });
    
    // Initialize on page load
    updateGlassEffect();
});

// ============================================================
// SOCIAL CONTENT POPUP - Dynamic Links Only
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Social platform data - only links change
    const socialLinks = {
        instagram: {
            label: 'INSTAGRAM',
            links: {
                'ACM': 'https://instagram.com/acm',
                'ACM W': 'https://instagram.com/acm_w',
                'ACM SIG-SOFT': 'https://instagram.com/acm_sigsft',
                'ACM SIG-AI': 'https://instagram.com/acm_sigai'
            }
        },
        x: {
            label: 'X',
            links: {
                'ACM': 'https://x.com/acm',
                'ACM W': 'https://x.com/acm_w',
                'ACM SIG-SOFT': 'https://x.com/acm_sigsft',
                'ACM SIG-AI': 'https://x.com/acm_sigai'
            }
        },
        youtube: {
            label: 'YOUTUBE',
            links: {
                'ACM': 'https://youtube.com/@acm',
                'ACM W': 'https://youtube.com/@acm_w',
                'ACM SIG-SOFT': 'https://youtube.com/@acm_sigsft',
                'ACM SIG-AI': 'https://youtube.com/@acm_sigai'
            }
        },
        linkedin: {
            label: 'LINKEDIN',
            links: {
                'ACM': 'https://linkedin.com/company/acm',
                'ACM W': 'https://linkedin.com/company/acm_w',
                'ACM SIG-SOFT': 'https://linkedin.com/company/acm_sigsft',
                'ACM SIG-AI': 'https://linkedin.com/company/acm_sigai'
            }
        }
    };

    const popupItems = [
        { name: 'ACM', logo: 'logos/ACM.png' },
        { name: 'ACM W', logo: 'logos/ACM W New.png' },
        { name: 'ACM SIG-SOFT', logo: 'logos/SIG SOFT.png' },
        { name: 'ACM SIG-AI', logo: 'logos/SIG AI.png' }
    ];

    const triggers = document.querySelectorAll('.social-trigger');
    const popupHeader = document.getElementById('popupHeader');
    const popupContent = document.getElementById('popupContent');

    function updatePopupLinks(network) {
        const data = socialLinks[network];
        if (!data) return;

        // Update header
        popupHeader.textContent = data.label;
        
        // Update links only, keep items the same
        const popupItemElements = popupContent.querySelectorAll('.social-logo-item');
        popupItemElements.forEach((itemElement, index) => {
            const item = popupItems[index];
            const link = data.links[item.name];
            itemElement.href = link;
        });
    }

    function renderPopupItems() {
        popupContent.innerHTML = '<div class="social-logos-grid"></div>';
        const grid = popupContent.querySelector('.social-logos-grid');
        popupItems.forEach(item => {
            const itemLink = document.createElement('a');
            itemLink.href = '#';
            itemLink.target = '_blank';
            itemLink.rel = 'noopener';
            itemLink.className = 'social-logo-item';
            itemLink.innerHTML = `
                <img src="${item.logo}" alt="${item.name}" class="social-logo">
                <span class="social-logo-label">${item.name}</span>
            `;
            grid.appendChild(itemLink);
        });
    }

    // Initial render with Instagram links
    renderPopupItems();
    updatePopupLinks('instagram');

    // Add hover listeners to all social triggers
    triggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', function() {
            const network = this.dataset.network;
            updatePopupLinks(network);
        });
    });
});

// ============================================================
// LINEUP DAY SWITCHER - Model 5 Dots with Glow Ring
// ============================================================

function switchLineupDay(index) {
    const buttons = document.querySelectorAll('.schedule-btn');
    const contents = document.querySelectorAll('[id^="schedule-day-"]');
    const label = document.getElementById('lineup-day-label');

    buttons.forEach(btn => btn.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    buttons[index].classList.add('active');
    contents[index].classList.add('active');

    if (label) {
        label.textContent = `Day ${index + 1}`;
    }

    // Reset all card flips when switching days
    const cards = document.querySelectorAll('.event-flip-inner');
    cards.forEach(card => {
        card.style.transform = 'rotateY(0deg)';
    });
}

