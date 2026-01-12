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

// Helper function to create schedule tabs for Lineup card
const createScheduleTabs = (card) => {
    const container = document.createElement('div');
    
    // Check if this card has schedule data
    const day1Data = card.dataset.scheduleDay1;
    const day2Data = card.dataset.scheduleDay2;
    const day3Data = card.dataset.scheduleDay3;
    
    console.log('🎯 CREATING SCHEDULE TABS:', card.dataset.title);
    console.log('   Day1:', day1Data ? day1Data.substring(0, 50) + '...' : 'NONE');
    console.log('   Day2:', day2Data ? day2Data.substring(0, 50) + '...' : 'NONE');
    console.log('   Day3:', day3Data ? day3Data.substring(0, 50) + '...' : 'NONE');
    
    if (!day1Data && !day2Data && !day3Data) {
        console.log('❌ No schedule data found, returning null');
        return null; // No schedule data
    }
    
    // Create tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'schedule-tabs';
    
    // Parse schedule data
    const parseDay = (dayData) => {
        if (!dayData) return [];
        return dayData.split(',').map(activity => {
            const [title, time] = activity.split('::').map(s => s.trim());
            return { title, time };
        });
    };
    
    const scheduleDay1 = parseDay(day1Data);
    const scheduleDay2 = parseDay(day2Data);
    const scheduleDay3 = parseDay(day3Data);
    const allDays = [scheduleDay1, scheduleDay2, scheduleDay3];
    
    // Create day buttons
    for (let i = 0; i < 3; i++) {
        const btn = document.createElement('button');
        btn.className = `schedule-tab-btn ${i === 0 ? 'active' : ''}`;
        btn.setAttribute('type', 'button');
        btn.dataset.dayIndex = i;
        
        btn.addEventListener('click', () => {
            // Remove active from all buttons and contents
            tabsContainer.querySelectorAll('.schedule-tab-btn').forEach(b => b.classList.remove('active'));
            container.querySelectorAll('.schedule-content').forEach(c => c.classList.remove('active'));
            
            // Add active to clicked button and corresponding content
            btn.classList.add('active');
            container.querySelector(`.schedule-content[data-day="${i}"]`).classList.add('active');
            
            // Update label
            const label = container.querySelector('.schedule-label');
            if (label) label.textContent = `Day ${i + 1}`;
        });
        
        tabsContainer.appendChild(btn);
    }
    
    container.appendChild(tabsContainer);
    
    // Create label
    const label = document.createElement('div');
    label.className = 'schedule-label';
    label.textContent = 'Day 1';
    container.appendChild(label);
    
    // Create content containers for each day
    for (let i = 0; i < 3; i++) {
        const dayContent = document.createElement('div');
        dayContent.className = `schedule-content ${i === 0 ? 'active' : ''}`;
        dayContent.dataset.day = i;
        
        const activities = allDays[i];
        activities.forEach(activity => {
            const actEl = document.createElement('div');
            actEl.className = 'schedule-activity';
            
            const titleEl = document.createElement('div');
            titleEl.className = 'schedule-activity-title';
            titleEl.textContent = activity.title;
            
            const timeEl = document.createElement('div');
            timeEl.className = 'schedule-activity-time';
            timeEl.textContent = activity.time;
            
            actEl.appendChild(titleEl);
            actEl.appendChild(timeEl);
            dayContent.appendChild(actEl);
        });
        
        container.appendChild(dayContent);
    }
    
    return container;
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

    // Create detail stack with all available cards as options
    const stack = document.createElement('div');
    stack.className = 'detail-stack';

    // Function to update content based on selected card
    const updateDetailContent = (selectedCard) => {
        const selectedLabel = selectedCard.dataset.detailLabel || selectedCard.dataset.badge || 'Detail';
        const selectedHeading = selectedCard.dataset.detailTitle || selectedCard.dataset.title || 'Concept';
        const selectedBody = selectedCard.dataset.detailBody || selectedCard.dataset.blurb || '';
        const selectedDemosSource = selectedCard.dataset.demoCards || selectedCard.dataset.detailPoints || '';
        const selectedLink = (selectedCard.dataset.detailLink || '').trim();
        const selectedLinkText = (selectedCard.dataset.detailLinkText || '').trim();
        const selectedGradient = selectedCard.dataset.mediaGradient || '';
        const selectedAccent = selectedCard.dataset.accent || accentDefault;

        // Update visual background
        visualEl.style.setProperty('--detail-visual-background', selectedGradient || 'linear-gradient(135deg, rgba(6, 22, 34, 0.9) 0%, rgba(10, 60, 120, 0.8) 60%, rgba(0, 128, 254, 0.65) 100%)');

        // Update accent color
        detailCard.style.setProperty('--detail-card-accent', selectedAccent);

        // Update content
        labelEl.textContent = selectedLabel;
        titleEl.textContent = selectedHeading;
        bodyEl.textContent = selectedBody;

        // Update demos
        const oldDemos = contentWrapper.querySelector('.detail-demos');
        if (oldDemos) {
            oldDemos.remove();
        }

        // Update schedule tabs if present
        const oldScheduleContainer = contentWrapper.querySelector('.schedule-container');
        if (oldScheduleContainer) {
            oldScheduleContainer.remove();
            console.log('🗑️  Old schedule container removed');
        }

        // Re-add schedule tabs for the new card if it has schedule data
        const newScheduleTabs = createScheduleTabs(selectedCard);
        if (newScheduleTabs) {
            const scheduleContainer = document.createElement('div');
            scheduleContainer.className = 'schedule-container';
            scheduleContainer.appendChild(newScheduleTabs);
            contentWrapper.appendChild(scheduleContainer);
            console.log('✅ Updated schedule container for new card');
        }

        const selectedDemos = selectedDemosSource
            .split('|')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);

        if (selectedDemos.length) {
            const demosWrapper = document.createElement('div');
            demosWrapper.className = 'detail-demos';

            selectedDemos.forEach((entry) => {
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

            contentWrapper.appendChild(demosWrapper);
        }

        // Update CTA
        const oldCta = contentWrapper.querySelector('.detail-cta');
        if (oldCta) {
            oldCta.remove();
        }

        if (selectedLink || selectedLinkText) {
            const cta = document.createElement('a');
            cta.className = 'detail-cta';
            cta.textContent = selectedLinkText ? `${selectedLinkText} →` : 'Explore →';
            cta.setAttribute('href', selectedLink || '#');

            const target = selectedCard.dataset.detailLinkTarget;
            if (target) {
                cta.setAttribute('target', target);
                cta.setAttribute('rel', target === '_blank' ? 'noopener noreferrer' : 'noopener');
            } else {
                cta.setAttribute('rel', 'noopener');
            }

            contentWrapper.appendChild(cta);
        }

        // Update active state in stack
        Array.from(stack.querySelectorAll('.detail-stack-option')).forEach(option => {
            if (option.dataset.cardIndex === selectedCard.dataset.index) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    };

    // Create stack options from all available cards
    cards.forEach((card) => {
        const cardIndex = card.dataset.index ? card.dataset.index.padStart(2, '0') : String(cards.indexOf(card) + 1).padStart(2, '0');
        const cardLabel = card.dataset.detailLabel || card.dataset.badge || 'Option';

        const option = document.createElement('button');
        option.className = 'detail-stack-option';
        option.dataset.cardIndex = card.dataset.index;
        option.textContent = cardLabel;
        option.type = 'button';

        // Add active class to first option
        if (card === card) {
            option.classList.add('active');
        }

        option.addEventListener('hover', () => updateDetailContent(card));
        option.addEventListener('mouseover', () => updateDetailContent(card));
        option.addEventListener('mouseenter', () => updateDetailContent(card));

        stack.appendChild(option);
    });

    // Create inner wrapper for visual and content
    const innerWrapper = document.createElement('div');
    innerWrapper.className = 'detail-card-inner';

    const visual = document.createElement('div');
    visual.className = 'detail-visual';
    visual.setAttribute('aria-hidden', 'true');
    const visualEl = visual; // Store reference for updating

    if (gradient) {
        visual.style.setProperty('--detail-visual-background', gradient);
    } else {
        visual.style.removeProperty('--detail-visual-background');
    }

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'detail-content';

    const labelEl = document.createElement('p');
    labelEl.className = 'detail-label';
    labelEl.textContent = label;

    const titleEl = document.createElement('h3');
    titleEl.className = 'detail-title';
    titleEl.textContent = detailHeading;

    const bodyEl = document.createElement('p');
    bodyEl.className = 'detail-body';
    bodyEl.textContent = body;

    contentWrapper.appendChild(labelEl);
    contentWrapper.appendChild(titleEl);
    contentWrapper.appendChild(bodyEl);

    // Add schedule tabs if this is the Lineup card
    const scheduleTabs = createScheduleTabs(card);
    if (scheduleTabs) {
        const scheduleContainer = document.createElement('div');
        scheduleContainer.className = 'schedule-container';
        scheduleContainer.appendChild(scheduleTabs);
        contentWrapper.appendChild(scheduleContainer);
        console.log('✅ Schedule container appended to detail card');
    } else {
        console.log('⚠️  No schedule tabs created for this card');
    }

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

        contentWrapper.appendChild(demosWrapper);
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

        contentWrapper.appendChild(cta);
    }

    innerWrapper.appendChild(visual);
    innerWrapper.appendChild(contentWrapper);

    detailCard.appendChild(stack);
    detailCard.appendChild(innerWrapper);

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
    // update top stack active state if present
    if (typeof updateTopStackActive === 'function') {
        updateTopStackActive();
    }

    if (learnMoreButton) {
        learnMoreButton.setAttribute('aria-label', `Learn more about ${title}`);
        learnMoreButton.setAttribute('aria-expanded', stageRevealed ? 'true' : 'false');
    }

    if (stageRevealed) {
        renderDetailCard(card, { animate: false });
    }
}

// Create a top-level option stack (in the red-box region) and populate it from available cards
const createTopStack = () => {
    const overlay = document.querySelector('.concept-overlay');
    if (!overlay) return;

    let topStack = document.querySelector('.concept-top-stack');
    if (!topStack) {
        topStack = document.createElement('div');
        topStack.className = 'concept-top-stack';
        // insert at the very top of the overlay so it sits in the red-box region
        overlay.insertBefore(topStack, overlay.firstChild);
    } else {
        topStack.innerHTML = '';
    }

    cards.forEach((card, idx) => {
        const label = card.dataset.badge || card.dataset.detailLabel || card.dataset.title || `Option ${idx + 1}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'concept-top-option';
        btn.dataset.cardIndex = card.dataset.index || String(idx + 1).padStart(2, '0');
        btn.textContent = label;

        btn.addEventListener('mouseenter', () => {
            activateCard(card);
        });
        btn.addEventListener('focus', () => {
            activateCard(card);
        });
        // on click reveal detail stage for accessibility
        btn.addEventListener('click', () => {
            activateCard(card);
            revealDetailStage();
        });

        topStack.appendChild(btn);
    });

    // mark active
    if (typeof updateTopStackActive === 'function') updateTopStackActive();
};

const updateTopStackActive = () => {
    const topStack = document.querySelector('.concept-top-stack');
    if (!topStack) return;
    Array.from(topStack.children).forEach((btn) => {
        const idx = btn.dataset.cardIndex;
        btn.classList.toggle('active', idx === (cards[activeIndex] && cards[activeIndex].dataset.index));
    });
};

const initCards = () => {
    if (!refreshCardCollection()) {
        return;
    }

    if (cards.length) {
        activateCard(cards[0]);
        // create/populate the top menu bar
        createTopStack();
        
        // CRITICAL: Make the overlay visible by adding is-visible class
        if (conceptOverlay) {
            conceptOverlay.classList.add('is-visible');
        }
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
                if (typeof createTopStack === 'function') createTopStack();
            }
            return;
        }

        activateCard(currentCard);
        if (typeof createTopStack === 'function') createTopStack();
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
    const fadeOutEnd = fadeOutStart + 1700; // Fade out over 1700px (same duration as fade-in for smooth gradient)
    
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
    const dimAmount = easeProgress * 0.50;

    // Update CSS variables
    root.style.setProperty('--background-blur', `${blurAmount.toFixed(2)}px`);
    root.style.setProperty('--background-dim', dimAmount.toFixed(2));
};

// Add scroll listener
window.addEventListener('scroll', updateScrollEffect, { passive: true });

// Initialize scroll effect on page load
updateScrollEffect();

window.conceptsUno = Object.assign({}, window.conceptsUno, {
    refresh: () => {
        if (refreshCardCollection() && cards.length) {
            activateCard(cards[Math.min(activeIndex, cards.length - 1)] || cards[0]);
        }
    },
    reveal: revealDetailStage,
});

})();
