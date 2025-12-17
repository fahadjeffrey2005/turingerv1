(() => {
const root = document.documentElement;
let cards = [];
const titleEl = document.getElementById('conceptTitle');
const subtitleEl = document.getElementById('conceptSubtitle');
const blurbEl = document.getElementById('conceptBlurb');
const badgeEl = document.getElementById('conceptBadge');
const indexEl = document.getElementById('conceptIndex');
const progressBar = document.getElementById('conceptProgressBar');
const progressFill = document.getElementById('conceptProgressFill');
const detailStage = document.getElementById('conceptDetailStage');
const detailFeed = document.getElementById('conceptDetailFeed');
const learnMoreButton = document.getElementById('conceptLearnMoreButton');
const conceptStack = document.querySelector('.concept-stack');

if (!conceptStack) {
    console.warn('[concepts] No concept stack container found on page.');
    return;
}

const accentDefault = '#4ab8ff';
root.style.setProperty('--concept-accent', accentDefault);
let activeIndex = 0;
let stageRevealed = false;
let pendingDetailCard = null;
let warnedNoCards = false;

if (detailStage) {
    detailStage.setAttribute('aria-hidden', 'true');
}

if (learnMoreButton) {
    learnMoreButton.setAttribute('aria-expanded', 'false');
}

const clampProgress = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
        return 0;
    }
    return Math.max(0, Math.min(100, numeric));
};

const bindCardListeners = (card, index) => {
    if (!card) {
        return;
    }

    if (!card.dataset.index) {
        card.dataset.index = String(index + 1).padStart(2, '0');
    }

    if (card.dataset.conceptsBound === 'true') {
        return;
    }

    const activate = () => {
        activateCard(card);
    };

    card.addEventListener('mouseenter', activate);
    card.addEventListener('focus', activate);
    card.addEventListener('click', activate);

    card.dataset.conceptsBound = 'true';
};

const refreshCardCollection = () => {
    cards = Array.from(document.querySelectorAll('.concept-card'));

    if (!cards.length) {
        if (!warnedNoCards) {
            console.warn('[concepts] No concept cards found on page.');
            warnedNoCards = true;
        }
        return false;
    }

    warnedNoCards = false;

    cards.forEach((card, idx) => {
        bindCardListeners(card, idx);
    });

    if (!cards.includes(pendingDetailCard)) {
        pendingDetailCard = null;
    }

    if (activeIndex >= cards.length) {
        activeIndex = Math.max(0, cards.length - 1);
    }

    if (!pendingDetailCard && cards.length) {
        pendingDetailCard = cards[activeIndex] || cards[0];
    }

    return true;
};

const renderDetailCard = (card, options = {}) => {
    if (!detailStage || !detailFeed || !card) {
        return null;
    }

    const animate = options.animate !== false;

    const index = card.dataset.index ? card.dataset.index.padStart(2, '0') : String(cards.indexOf(card) + 1).padStart(2, '0');
    const label = card.dataset.detailLabel || card.dataset.badge || 'Detail Feed';
    const detailHeading = card.dataset.detailTitle || card.dataset.title || 'Concept';
    const body = card.dataset.detailBody || card.dataset.blurb || '';
    const demosSource = card.dataset.demoCards || card.dataset.detailPoints || '';
    const linkHref = (card.dataset.detailLink || '').trim();
    const linkText = (card.dataset.detailLinkText || '').trim();
    const accent = card.dataset.accent || accentDefault;
    const gradient = card.dataset.mediaGradient || '';

    const detailCard = document.createElement('article');
    detailCard.className = 'detail-card';
    detailCard.dataset.detailIndex = index;
    detailCard.style.setProperty('--detail-card-accent', accent);
    detailCard.setAttribute('tabindex', '-1');

    const visual = document.createElement('div');
    visual.className = 'detail-visual';
    visual.setAttribute('aria-hidden', 'true');
    if (gradient) {
        visual.style.setProperty('--detail-visual-background', gradient);
    } else {
        visual.style.removeProperty('--detail-visual-background');
    }

    const content = document.createElement('div');
    content.className = 'detail-content';

    const labelEl = document.createElement('p');
    labelEl.className = 'detail-label';
    labelEl.textContent = label;

    const titleEl = document.createElement('h3');
    titleEl.className = 'detail-title';
    titleEl.textContent = detailHeading;

    const bodyEl = document.createElement('p');
    bodyEl.className = 'detail-body';
    bodyEl.textContent = body;

    content.appendChild(labelEl);
    content.appendChild(titleEl);
    content.appendChild(bodyEl);

    const demos = demosSource
        .split('|')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);

    if (demos.length) {
        const demosWrapper = document.createElement('div');
        demosWrapper.className = 'detail-demos';

        demos.forEach((entry) => {
            const [demoTitle, demoBody = ''] = entry.split('::').map((token) => token.trim());
            const demoCard = document.createElement('article');
            demoCard.className = 'demo-card';

            const demoTitleNode = document.createElement('h4');
            demoTitleNode.className = 'demo-card-title';
            demoTitleNode.textContent = demoTitle || 'Demo';

            const demoBodyNode = document.createElement('p');
            demoBodyNode.className = 'demo-card-body';
            demoBodyNode.textContent = demoBody || '';

            demoCard.appendChild(demoTitleNode);
            demoCard.appendChild(demoBodyNode);
            demosWrapper.appendChild(demoCard);
        });

        content.appendChild(demosWrapper);
    }

    if (linkHref || linkText) {
        const cta = document.createElement('a');
        cta.className = 'detail-cta';
        cta.textContent = linkText ? `${linkText} →` : 'Explore →';
        cta.setAttribute('href', linkHref || '#');

        const target = card.dataset.detailLinkTarget;
        if (target) {
            cta.setAttribute('target', target);
            cta.setAttribute('rel', target === '_blank' ? 'noopener noreferrer' : 'noopener');
        } else {
            cta.setAttribute('rel', 'noopener');
        }

        content.appendChild(cta);
    }

    detailCard.appendChild(visual);
    detailCard.appendChild(content);

    const existing = detailFeed.querySelector(`[data-detail-index="${index}"]`);
    if (existing) {
        detailFeed.replaceChild(detailCard, existing);
    } else {
        let inserted = false;
        const indexValue = Number(index);
        for (const child of detailFeed.children) {
            const childIndex = Number(child.dataset.detailIndex || Number.POSITIVE_INFINITY);
            if (indexValue < childIndex) {
                detailFeed.insertBefore(detailCard, child);
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            detailFeed.appendChild(detailCard);
        }
    }

    if (animate) {
        requestAnimationFrame(() => {
            detailCard.classList.add('is-animating');
            detailCard.addEventListener('animationend', () => {
                detailCard.classList.remove('is-animating');
            }, { once: true });
        });
    }

    return detailCard;
};

const revealDetailStage = () => {
    if (!detailStage || !detailFeed) {
        return;
    }

    const targetCard = pendingDetailCard || cards[activeIndex] || cards[0];
    if (!targetCard) {
        return;
    }

    pendingDetailCard = targetCard;

    const insertedCard = renderDetailCard(targetCard);
    if (!insertedCard) {
        return;
    }

    if (!stageRevealed) {
        stageRevealed = true;
        detailStage.classList.add('is-ready');
    }

    detailStage.setAttribute('aria-hidden', 'false');
    detailStage.classList.add('is-visible');

    if (learnMoreButton) {
        learnMoreButton.setAttribute('aria-expanded', 'true');
    }

    window.requestAnimationFrame(() => {
        insertedCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(() => {
            insertedCard.focus({ preventScroll: true });
        }, 650);
    });
};
function activateCard(card) {
    if (!card) {
        return;
    }

    const nextIndex = cards.indexOf(card);
    if (nextIndex === -1) {
        return;
    }

    activeIndex = nextIndex;

    cards.forEach((entry) => {
        const isActive = entry === card;
        entry.classList.toggle('active', isActive);
        entry.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const accent = card.dataset.accent || accentDefault;
    root.style.setProperty('--concept-accent', accent);

    const title = card.dataset.title || card.querySelector('.card-title')?.textContent || 'Section';
    const subtitle = card.dataset.subtitle || card.querySelector('.card-subtitle')?.textContent || '';
    const blurb = card.dataset.blurb || '';
    const badge = card.dataset.badge || 'SIGNAL';
    const index = card.dataset.index ? card.dataset.index.padStart(2, '0') : String(activeIndex + 1).padStart(2, '0');
    const progress = clampProgress(card.dataset.progress);

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    if (blurbEl) blurbEl.textContent = blurb;
    if (badgeEl) badgeEl.textContent = badge;
    if (indexEl) indexEl.textContent = index;

    if (progressBar) {
        progressBar.setAttribute('aria-valuenow', String(progress));
    }

    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }

    pendingDetailCard = card;

    if (learnMoreButton) {
        learnMoreButton.setAttribute('aria-label', `Learn more about ${title}`);
        learnMoreButton.setAttribute('aria-expanded', stageRevealed ? 'true' : 'false');
    }

    if (stageRevealed) {
        renderDetailCard(card, { animate: false });
    }
}

const initCards = () => {
    if (!refreshCardCollection()) {
        return;
    }

    if (cards.length) {
        activateCard(cards[0]);
    }
};

if ('MutationObserver' in window) {
    const observer = new MutationObserver((records) => {
        let changed = false;
        for (const record of records) {
            if (record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length)) {
                changed = true;
                break;
            }
        }

        if (!changed) {
            return;
        }

        const hadCards = cards.length > 0;
        const refreshed = refreshCardCollection();

        if (!refreshed) {
            return;
        }

        const currentCard = cards[activeIndex] || null;
        if (!hadCards || !currentCard) {
            if (cards.length) {
                activateCard(cards[0]);
            }
            return;
        }

        activateCard(currentCard);
    });

    observer.observe(conceptStack, { childList: true });
}

document.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(event.key)) {
        return;
    }

    const activeElement = document.activeElement;
    if (!cards.includes(activeElement)) {
        return;
    }

    event.preventDefault();

    const direction = (event.key === 'ArrowDown' || event.key === 'ArrowRight') ? 1 : -1;
    activeIndex = (activeIndex + direction + cards.length) % cards.length;

    const nextCard = cards[activeIndex];
    nextCard.focus();
    activateCard(nextCard);
});

if (learnMoreButton) {
    learnMoreButton.addEventListener('click', () => {
        revealDetailStage();
    });
}

initCards();

// Scroll-triggered dimming and blur effect
const conceptOverlay = document.querySelector('.concept-overlay');
let landingSection = null;

// Find the landing section (the main page section before concept overlay)
const findLandingSection = () => {
    const mainElement = document.querySelector('main.concept-overlay');
    if (mainElement) {
        // For concept pages, the landing is above this overlay
        const scrollContainer = document.body.parentElement;
        return scrollContainer;
    }
    return null;
};

const updateScrollEffect = () => {
    if (!conceptOverlay) return;

    // Get scroll position
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Get the uno-section to determine when to stop the effect
    const unoSection = document.getElementById('concept-uno');
    let fadeOutStart = 2000; // Default fallback
    
    if (unoSection) {
        const sectionTop = unoSection.offsetTop;
        const sectionHeight = unoSection.offsetHeight;
        fadeOutStart = sectionTop + sectionHeight - window.innerHeight;
    }
    
    // Calculate blur and dim based on scroll distance
    // Start effect after ~300px scroll, reach max at ~2000px, fade out at end of section
    const scrollStart = 300;
    const scrollEnd = 2000;
    const fadeOutEnd = fadeOutStart + 800; // Fade out over 800px (longer for smoother fade)
    
    let scrollProgress = 0;
    
    if (scrollY < scrollStart) {
        scrollProgress = 0;
    } else if (scrollY < scrollEnd) {
        scrollProgress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
    } else if (scrollY < fadeOutEnd) {
        // Fade out phase
        scrollProgress = 1 - ((scrollY - scrollEnd) / (fadeOutEnd - scrollEnd));
    } else {
        scrollProgress = 0;
    }
    
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));

    // Smooth cubic easing for ultra-smooth transitions
    // easeInOutCubic: smoother than easeInQuad
    const easeProgress = scrollProgress < 0.5 
        ? 4 * scrollProgress * scrollProgress * scrollProgress 
        : 1 - Math.pow(-2 * scrollProgress + 2, 3) / 2;
    
    const blurAmount = easeProgress * 8;
    const dimAmount = easeProgress * 0.35;

    // Update CSS variables
    root.style.setProperty('--background-blur', `${blurAmount.toFixed(2)}px`);
    root.style.setProperty('--background-dim', dimAmount.toFixed(2));
};

// Add scroll listener
window.addEventListener('scroll', updateScrollEffect, { passive: true });

window.conceptsUno = Object.assign({}, window.conceptsUno, {
    refresh: () => {
        if (refreshCardCollection() && cards.length) {
            activateCard(cards[Math.min(activeIndex, cards.length - 1)] || cards[0]);
        }
    },
    reveal: revealDetailStage,
});

})();
