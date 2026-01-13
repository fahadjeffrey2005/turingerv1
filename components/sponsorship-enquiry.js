const tierConfigs = {
  platinum: {
    accent: '#00B4FF',
    border: 'rgba(0, 180, 255, 0.3)',
    gradient: 'linear-gradient(135deg, rgba(0, 180, 255, 0.15), rgba(0, 128, 254, 0.1))',
    label: 'PLATINUM',
    heading: 'Premium Partnership',
    subtitle: 'Let\'s discuss premium sponsorship opportunities for your brand',
    buttonText: 'Submit Inquiry'
  },
  gold: {
    accent: '#D4AF37',
    border: 'rgba(212, 175, 55, 0.3)',
    gradient: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.08))',
    label: 'GOLD',
    heading: 'Strategic Partnership',
    subtitle: 'Explore impactful sponsorship opportunities with us',
    buttonText: 'Submit Inquiry'
  },
  silver: {
    accent: '#C0C0C0',
    border: 'rgba(192, 192, 192, 0.3)',
    gradient: 'linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(192, 192, 192, 0.08))',
    label: 'SILVER',
    heading: 'Connect With Us',
    subtitle: 'Connect with us about our sponsorship offerings',
    buttonText: 'Submit Inquiry'
  },
  bronze: {
    accent: '#CD7F32',
    border: 'rgba(205, 127, 50, 0.3)',
    gradient: 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(205, 127, 50, 0.08))',
    label: 'BRONZE',
    heading: 'Join Our Community',
    subtitle: 'Get in touch and support Turinger \'26',
    buttonText: 'Submit Inquiry'
  }
};

const createModalTemplate = (tier, config) => {
  return `
<div class="enquiry-modal enquiry-modal-${tier}" id="enquiryModal-${tier}" data-tier="${tier}">
  <div class="enquiry-modal-overlay"></div>
  <div class="enquiry-modal-content" style="border-color: ${config.border}; background: ${config.gradient}">
    <div class="enquiry-header">
      <h2>${config.heading}</h2>
      <span class="tier-badge" style="color: ${config.accent}; border-color: ${config.border}">${config.label}</span>
    </div>
    
    <p class="enquiry-subtitle" style="color: ${config.accent}">${config.subtitle}</p>
    
    <form id="enquiryForm-${tier}" class="enquiry-form">
      <div class="form-group">
        <input type="email" id="enquiryEmail-${tier}" name="email" required>
        <label for="enquiryEmail-${tier}">Email Address</label>
        <span class="input-underline" style="background: ${config.accent}"></span>
      </div>
      
      <div class="form-group">
        <textarea id="enquiryMessage-${tier}" name="message" placeholder="Optional" class="enquiry-textarea"></textarea>
        <label for="enquiryMessage-${tier}">Tell Us About Your Company</label>
        <span class="textarea-underline" style="background: ${config.accent}"></span>
      </div>
      
      <div class="enquiry-actions">
        <button type="submit" class="enquiry-submit" style="border-color: ${config.border}; color: ${config.accent}; background: ${config.gradient}">${config.buttonText}</button>
        <button type="button" class="enquiry-cancel" onclick="closeEnquiry('${tier}')">Cancel</button>
      </div>
    </form>
  </div>
</div>
`;
};

function closeEnquiry(tier) {
  const modal = document.getElementById(`enquiryModal-${tier}`);
  if (modal) {
    modal.classList.remove('active');
    const form = document.getElementById(`enquiryForm-${tier}`);
    if (form) form.reset();
  }
}

function openEnquiry(tier) {
  const modal = document.getElementById(`enquiryModal-${tier}`);
  if (modal) {
    modal.classList.add('active');
  }
}

function mountEnquiry({ triggerSelector = '.tier-cta', parent = document.body } = {}) {
  // Create all 4 modals
  const tiers = ['platinum', 'gold', 'silver', 'bronze'];
  
  tiers.forEach(tier => {
    if (!document.getElementById(`enquiryModal-${tier}`)) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = createModalTemplate(tier, tierConfigs[tier]);
      parent.appendChild(wrapper.firstElementChild);
      
      const modal = document.getElementById(`enquiryModal-${tier}`);
      const form = document.getElementById(`enquiryForm-${tier}`);
      const overlay = modal.querySelector('.enquiry-modal-overlay');
      
      // Close on overlay click
      overlay.addEventListener('click', () => closeEnquiry(tier));
      
      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
          closeEnquiry(tier);
        }
      });
      
      // Handle form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById(`enquiryEmail-${tier}`).value;
        const message = document.getElementById(`enquiryMessage-${tier}`).value;
        
        // Validate using input validator if available
        if (typeof validator !== 'undefined') {
          const validation = validator.validateEnquiryForm({
            email,
            message,
            tier
          });

          if (!validation.valid) {
            alert(`Validation Error:\n${validation.errors.join('\n')}`);
            return;
          }

          const sanitizedData = validation.sanitizedData;
          console.log(`${tier.toUpperCase()} enquiry submitted:`, sanitizedData);
        } else {
          // Fallback basic validation
          if (!email.trim()) {
            alert('Email is required');
            return;
          }
          console.log(`${tier.toUpperCase()} enquiry submitted:`, { email, message });
        }
        
        closeEnquiry(tier);
        alert(`Thank you for your interest in ${tier.charAt(0).toUpperCase() + tier.slice(1)} sponsorship!\n\nWe'll contact you soon.`);
      });
    }
  });
  
  // Wire up all tier buttons to their respective modals
  const triggers = document.querySelectorAll(triggerSelector);
  triggers.forEach(trigger => {
    if (!trigger.dataset.enquiryBound) {
      trigger.addEventListener('click', function() {
        const tierCard = this.closest('.tier-card');
        if (tierCard.classList.contains('platinum')) {
          openEnquiry('platinum');
        } else if (tierCard.classList.contains('gold')) {
          openEnquiry('gold');
        } else if (tierCard.classList.contains('silver')) {
          openEnquiry('silver');
        } else if (tierCard.classList.contains('bronze')) {
          openEnquiry('bronze');
        }
      });
      trigger.dataset.enquiryBound = 'true';
    }
  });
}
