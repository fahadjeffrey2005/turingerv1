// Theme control function that delegates to dots system
function setSceneTheme(themeKey) {
    if (window.setDotsTheme) {
        window.setDotsTheme(themeKey);
    }
}

window.setSceneTheme = setSceneTheme;

// Scroll-based Blur & Dim Effect
document.addEventListener('DOMContentLoaded', () => {
    const root = document.documentElement;
    const blurOverlay = document.getElementById('conceptBlurOverlay');
    const unoSection = document.getElementById('concept-uno');
    const registrationCTA = document.getElementById('registration-cta');

    if (!blurOverlay || !unoSection) return;

    const updateGlassEffect = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        
        // Check if Register button is visible - if so, hide blur overlay completely
        if (registrationCTA) {
            const buttonRect = registrationCTA.getBoundingClientRect();
            const isButtonVisible = buttonRect.top < window.innerHeight && buttonRect.bottom > 0;
            if (isButtonVisible) {
                blurOverlay.style.visibility = 'hidden';
                blurOverlay.style.pointerEvents = 'none';
                return;
            } else {
                blurOverlay.style.visibility = 'visible';
                blurOverlay.style.pointerEvents = 'none';
            }
        }
        
        // Get section position
        const sectionTop = unoSection.offsetTop;
        const sectionHeight = unoSection.offsetHeight;
        const fadeOutStart = sectionTop + sectionHeight - window.innerHeight;
        
        // Calculate effect progression
        const scrollStart = 300;
        const scrollEnd = 2000;
        const fadeOutEnd = fadeOutStart + 1700;
        
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
        
        const easeProgress = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        const blurAmount = easeProgress * 8;
        const dimAmount = easeProgress * 0.50;
        
        root.style.setProperty('--background-blur', `${blurAmount.toFixed(2)}px`);
        root.style.setProperty('--background-dim', dimAmount.toFixed(2));
    };

    // Listen to scroll
    window.addEventListener('scroll', updateGlassEffect, { passive: true });
    
    // Initialize on page load
    updateGlassEffect();
});

// Social Content Popup - Dynamic Links
document.addEventListener('DOMContentLoaded', function() {
    // Social platform data - only links change
    const socialLinks = {
        instagram: {
            label: 'INSTAGRAM',
            links: {
                'ACM': 'https://www.instagram.com/acm_mitb/',
                'ACM W': 'https://www.instagram.com/acmw_mitb/',
                'ACM SIG-SOFT': 'https://www.instagram.com/sig.soft_mitb/',
                'ACM SIG-AI': 'https://www.instagram.com/sig.ai_mitb/'
            }
        },
        linkedin: {
            label: 'LINKEDIN',
            links: {
                'ACM': 'https://www.linkedin.com/company/mitb-acm-student-chapter/',
                'ACM W': 'https://www.linkedin.com/company/mitb-acm-w-student-chapter/',
                'ACM SIG-SOFT': 'https://www.linkedin.com/company/mitb-acm-sig-soft/',
                'ACM SIG-AI': 'https://www.linkedin.com/company/mitb-acm-sigai/'
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
// LINEUP DAY SWITCHER - Timeline Version
// ============================================================

function switchLineupDay(index) {
    const contents = document.querySelectorAll('[data-day]');
    
    contents.forEach(content => {
        content.style.display = 'none';
    });
    
    const dayContent = document.querySelector(`[data-variation="original"][data-day="${index + 1}"]`);
    if (dayContent) {
        dayContent.style.display = 'block';
    }
}

// COLOR BAR DAY SELECTOR - Index Page Version
function selectIndexDay(day) {
    // Update color bar
    const barFill = document.getElementById('colorBarFill');
    const fillPercentage = (day / 3) * 100;
    barFill.style.width = fillPercentage + '%';

    // Update day buttons
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById('dayBtn' + i);
        const underline = btn.querySelector('div');
        if (i === day) {
            btn.style.color = '#00D4FF';
            underline.style.width = '100%';
        } else {
            btn.style.color = 'rgba(213, 255, 233, 0.5)';
            underline.style.width = '0%';
        }
    }

    // Update schedule visibility using existing switchLineupDay logic
    switchLineupDay(day - 1);
}

// Initialize with Day 1
document.addEventListener('DOMContentLoaded', () => {
    selectIndexDay(1);
});

// Event pill interactions
document.querySelectorAll('.events-pill').forEach(pill => {
    pill.addEventListener('mouseenter', function() {
        const title = this.dataset.title;
        const description = this.dataset.description;
        const hasPage = this.dataset.hasPage === 'true';
        const eventId = this.dataset.event;
        
        // Update detail card
        document.getElementById('eventTitle').textContent = title;
        document.getElementById('eventDescription').textContent = description;
        
        // Update button based on event type
        const btnContainer = document.getElementById('eventButtonContainer');
        
        if (hasPage) {
            btnContainer.innerHTML = `<button class="events-link" type="button" onclick="window.location.href='${eventId}.html'">Register Now →</button>`;
        } else {
            btnContainer.innerHTML = '';
        }
        
        // Update active pill
        document.querySelectorAll('.events-pill').forEach(p => p.classList.remove('is-active'));
        this.classList.add('is-active');
    });
});

