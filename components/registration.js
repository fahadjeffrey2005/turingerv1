const template = `
<div class="registration-modal" id="registrationModal">
  <div class="registration-modal-content">
    <h2>Register</h2>
    <p class="registration-subtitle">Join us for an amazing hackathon</p>
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
        <button type="submit" class="register-submit">Register</button>
        <button type="button" class="register-cancel" id="cancelRegister">Cancel</button>
      </div>
    </form>
  </div>
</div>
`;

function mount({ triggerSelector = '#registerBtn', parent = document.body } = {}) {
  if (document.getElementById('registrationModal')) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = template;
  parent.appendChild(wrapper.firstElementChild);

  const registrationModal = document.getElementById('registrationModal');
  const registrationForm = document.getElementById('registrationForm');
  const cancelRegister = document.getElementById('cancelRegister');
  const trigger = document.querySelector(triggerSelector);

  if (trigger) {
    trigger.addEventListener('click', () => {
      registrationModal.classList.add('active');
    });
  }

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
    // Basic client-side interaction — replace with real submission as needed
    alert('Registration submitted! We will contact you soon.');
    registrationModal.classList.remove('active');
    registrationForm.reset();
  });
}

// Auto-mount using default trigger
mount();

export { mount };
