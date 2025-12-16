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
        { name: 'ACM', logo: 'https://via.placeholder.com/60' },
        { name: 'ACM W', logo: 'https://via.placeholder.com/60' },
        { name: 'ACM SIG-SOFT', logo: 'https://via.placeholder.com/60' },
        { name: 'ACM SIG-AI', logo: 'https://via.placeholder.com/60' }
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
        const popupItemElements = popupContent.querySelectorAll('.popup-item');
        popupItemElements.forEach((itemElement, index) => {
            const item = popupItems[index];
            const link = data.links[item.name];
            itemElement.href = link;
        });
    }

    function renderPopupItems() {
        popupContent.innerHTML = '';
        popupItems.forEach(item => {
            const itemLink = document.createElement('a');
            itemLink.href = '#';
            itemLink.target = '_blank';
            itemLink.rel = 'noopener';
            itemLink.className = 'popup-item';
            itemLink.innerHTML = `
                <img src="${item.logo}" alt="${item.name}" class="popup-logo">
                <span class="popup-name">${item.name}</span>
            `;
            popupContent.appendChild(itemLink);
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


