function getSubtitle(tier = null) {
  if (tier) {
    return `Interested in ${tier} sponsorship? Let's connect!`;
  }
  const path = window.location.pathname;
  if (path.includes('symposium')) {
    return 'Experience ideas, innovation, and insights at our Symposium';
  }
  return '24 Hours. One Vision. Unlimited Possibilities.';
}

function getTierColor(tier) {
  const colors = {
    platinum: { border: 'rgba(0, 180, 255, 0.3)', accent: '#00B4FF', label: 'PLATINUM' },
    gold: { border: 'rgba(212, 175, 55, 0.3)', accent: '#D4AF37', label: 'GOLD' },
    silver: { border: 'rgba(192, 192, 192, 0.3)', accent: '#C0C0C0', label: 'SILVER' },
    bronze: { border: 'rgba(205, 127, 50, 0.3)', accent: '#CD7F32', label: 'BRONZE' }
  };
  return colors[tier?.toLowerCase()] || { border: 'rgba(92,179,255,0.32)', accent: '#0080FE', label: 'REGISTRATION' };
}

const template = (tier = null) => {
  const tierColor = getTierColor(tier);
  const tierClass = tier ? `registration-modal-${tier.toLowerCase()}` : '';
  
  return `
<div class="registration-modal ${tierClass}" id="registrationModal" data-tier="${tier || ''}">
  <div class="registration-modal-content" style="border-color: ${tierColor.border}">
    <div class="registration-header">
      <h2>Register</h2>
      ${tier ? `<span class="tier-badge" style="color: ${tierColor.accent}">${tierColor.label}</span>` : ''}
    </div>
    <p class="registration-subtitle">${getSubtitle(tier)}</p>
    <form id="registrationForm">
      <div class="form-group">
        <input type="text" id="fullName" name="fullName" placeholder="Name" required>
        <label for="fullName">Full Name</label>
      </div>
      <div class="form-group">
        <input type="email" id="email" name="email" placeholder="you@email.com" required>
        <label for="email">Email</label>
      </div>
      <div class="form-group">
        <input type="tel" id="phone" name="phone" placeholder="+91 98765 43210" required>
        <label for="phone">Phone</label>
      </div>
      <div class="form-group">
        <input type="text" id="college" name="college" placeholder="Your institution" required>
        <label for="college">College</label>
      </div>
      <div class="registration-actions">
        <button type="submit" class="register-submit" style="border-color: ${tierColor.border}; color: ${tierColor.accent}">Register</button>
        <button type="button" class="register-cancel" id="cancelRegister">Cancel</button>
      </div>
    </form>
  </div>
</div>
`;
};

function mount({ triggerSelector = '#registerBtn', parent = document.body, tier = null } = {}) {
  if (document.getElementById('registrationModal')) {
    // If modal exists, just add click listeners to new triggers
    const triggers = document.querySelectorAll(triggerSelector);
    triggers.forEach(trigger => {
      if (!trigger.dataset.registrationBound) {
        trigger.addEventListener('click', () => {
          const tierName = trigger.closest('.tier-card')?.querySelector('.tier-name')?.textContent || null;
          document.getElementById('registrationModal').classList.add('active');
          if (tierName) {
            document.getElementById('registrationModal').dataset.tier = tierName;
          }
        });
        trigger.dataset.registrationBound = 'true';
      }
    });
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = template(tier);
  parent.appendChild(wrapper.firstElementChild);

  const registrationModal = document.getElementById('registrationModal');
  const registrationForm = document.getElementById('registrationForm');
  const cancelRegister = document.getElementById('cancelRegister');
  const triggers = document.querySelectorAll(triggerSelector);

  triggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      const tierName = this.closest('.tier-card')?.querySelector('.tier-name')?.textContent || null;
      registrationModal.classList.add('active');
      if (tierName) {
        registrationModal.dataset.tier = tierName;
      }
    });
  });

  cancelRegister.addEventListener('click', () => {
    registrationModal.classList.remove('active');
    registrationForm.reset();
  });

  registrationModal.addEventListener('click', (e) => {
    if (e.target === registrationModal) {
      registrationModal.classList.remove('active');
      registrationForm.reset();
    }
  });

  registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form values
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const college = document.getElementById('college').value;

    // Validate using input validator if available
    if (typeof validator !== 'undefined') {
      const validation = validator.validateRegistrationForm({
        fullName,
        email,
        phone,
        college
      });

      if (!validation.valid) {
        alert(`Validation Error:\n${validation.errors.join('\n')}`);
        return;
      }

      // Use sanitized data
      const sanitizedData = validation.sanitizedData;
    } else {
      // Fallback basic validation
      if (!fullName.trim() || !email.trim() || !phone.trim() || !college.trim()) {
        alert('Please fill all required fields');
        return;
      }

      // Basic MAHE email validation fallback
      if (college === 'mahe' && !email.toLowerCase().includes('@learner.manipal.edu')) {
        alert('MAHE students must use @learner.manipal.edu email address');
        return;
      }
    }

    registrationModal.classList.remove('active');
    
    if (window.registrationAnimation) {
      window.registrationAnimation.animate(2000).then(() => {
        registrationForm.reset();
      });
    } else {
      alert('Registration submitted! We will contact you soon.');
      registrationForm.reset();
    }
  });
}

// Auto-mount using default trigger
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mount());
} else {
  mount();
}

export { mount };
