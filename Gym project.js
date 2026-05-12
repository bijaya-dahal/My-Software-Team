var API = 'http://localhost:5000/api/users';

function getToken() {
  return localStorage.getItem('ef_token');
}

function showPage(name) {
  document.getElementById('page-landing').classList.toggle('hidden', name !== 'landing');
  document.getElementById('page-profile').classList.toggle('hidden', name !== 'profile');
  document.getElementById('main-nav').classList.toggle('hidden', name !== 'landing');
  document.getElementById('profile-nav').classList.toggle('hidden', name !== 'profile');
  window.scrollTo(0, 0);
}

// modal
function openModal(tab) {
  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  showTab(tab || 'login');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function overlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// slide menu
function toggleMenu() {
  var open = document.getElementById('slide-menu').classList.contains('open');
  open ? closeMenu() : openMenuPanel();
}

function openMenuPanel() {
  document.getElementById('slide-menu').classList.add('open');
  document.getElementById('burger-btn').classList.add('open');
  document.getElementById('slide-backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  document.getElementById('slide-menu').classList.remove('open');
  document.getElementById('burger-btn').classList.remove('open');
  document.getElementById('slide-backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

// navbar scroll effect
window.addEventListener('scroll', function () {
  document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 50);
});

// alert helpers
function showAlert(id, msg) {
  var el = document.getElementById(id);
  if (msg) el.textContent = msg;
  el.classList.add('show');
}

function hideAlert(id) {
  document.getElementById(id).classList.remove('show');
}

function showFieldErr(errId, inputId) {
  document.getElementById(errId).classList.add('show');
  if (inputId) document.getElementById(inputId).classList.add('error');
}

function clearErrors(sectionId) {
  var section = document.getElementById(sectionId);
  section.querySelectorAll('.field-error').forEach(function (el) {
    el.classList.remove('show');
  });
  section.querySelectorAll('input').forEach(function (el) {
    el.classList.remove('error');
  });
}

function setLoading(btnId, loading, label) {
  var btn = document.getElementById(btnId);
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait...' : label;
}

// tab switching inside modal
function showTab(tab) {
  var isLogin = tab === 'login';
  document.getElementById('login-section').classList.toggle('hidden', !isLogin);
  document.getElementById('register-section').classList.toggle('hidden', isLogin);
  document.getElementById('tab-login').classList.toggle('active', isLogin);
  document.getElementById('tab-register').classList.toggle('active', !isLogin);
  ['login-err-msg', 'reg-err-msg', 'reg-done-msg'].forEach(hideAlert);
}

function togglePw(id, btn) {
  var input = document.getElementById(id);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

// register
async function doRegister() {
  clearErrors('register-section');
  hideAlert('reg-err-msg');

  var fname = document.getElementById('reg-fname').value.trim();
  var lname = document.getElementById('reg-lname').value.trim();
  var email = document.getElementById('reg-email').value.trim().toLowerCase();
  var phone = document.getElementById('reg-phone').value.trim();
  var dob   = document.getElementById('reg-dob').value;
  var pw    = document.getElementById('reg-password').value;
  var pw2   = document.getElementById('reg-password2').value;
  var terms = document.getElementById('reg-terms').checked;

  var bad = false;
  if (!fname) { showFieldErr('reg-fname-err', 'reg-fname'); bad = true; }
  if (!lname) { showFieldErr('reg-lname-err', 'reg-lname'); bad = true; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldErr('reg-email-err', 'reg-email'); bad = true; }
  if (!phone) { showFieldErr('reg-phone-err', 'reg-phone'); bad = true; }
  if (!dob) { showFieldErr('reg-dob-err', 'reg-dob'); bad = true; }
  if (pw.length < 8) { showFieldErr('reg-pw-err', 'reg-password'); bad = true; }
  if (pw !== pw2) { showFieldErr('reg-pw2-err', 'reg-password2'); bad = true; }
  if (!terms) { showFieldErr('reg-terms-err', null); bad = true; }
  if (bad) { showAlert('reg-err-msg', 'Please fix the errors above.'); return; }

  setLoading('reg-btn', true, 'Create Account');
  try {
    var res = await fetch(API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fname + ' ' + lname, email, password: pw, role: document.getElementById('reg-role').value, phone, dateOfBirth: dob })
    });
    var data = await res.json();
    if (!res.ok) { showAlert('reg-err-msg', data.message || 'Registration failed.'); return; }
    showTab('login');
    showAlert('reg-done-msg', 'Account created! You can now log in.');
  } catch (e) {
    showAlert('reg-err-msg', 'Could not connect to the server. Is the backend running?');
  } finally {
    setLoading('reg-btn', false, 'Create Account');
  }
}

// login
async function doLogin() {
  clearErrors('login-section');
  hideAlert('login-err-msg');

  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var pw    = document.getElementById('login-password').value;

  var bad = false;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldErr('login-email-err', 'login-email'); bad = true; }
  if (!pw) { showFieldErr('login-pw-err', 'login-password'); bad = true; }
  if (bad) return;

  setLoading('login-btn', true, 'Log In');
  try {
    var res = await fetch(API + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw })
    });
    var data = await res.json();
    if (!res.ok) { showAlert('login-err-msg', data.message || 'Invalid email or password.'); return; }

    localStorage.setItem('ef_token', data.token);
    localStorage.setItem('ef_user', JSON.stringify(data.user));
    closeModal();
    showPage('profile');
    loadProfile();
  } catch (e) {
    showAlert('login-err-msg', 'Could not connect to the server. Is the backend running?');
  } finally {
    setLoading('login-btn', false, 'Log In');
  }
}

// logout
function logout() {
  localStorage.removeItem('ef_token');
  localStorage.removeItem('ef_user');
  showPage('landing');
}

// profile helpers
function getInitials(name) {
  var parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatDate(str) {
  if (!str) return 'Not set';
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// load profile from API
async function loadProfile() {
  try {
    var res = await fetch(API + '/profile', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });

    if (res.status === 401) { logout(); return; }

    var data = await res.json();
    var u = data.user || data;

    document.getElementById('nav-username').textContent    = u.name;
    document.getElementById('profile-avatar').textContent  = getInitials(u.name);
    document.getElementById('profile-name').textContent    = u.name;
    document.getElementById('profile-email').textContent   = u.email;
    document.getElementById('profile-role').textContent    = u.role ? (u.role[0].toUpperCase() + u.role.slice(1)) : 'Member';

    document.getElementById('view-name').textContent    = u.name    || '-';
    document.getElementById('view-email').textContent   = u.email   || '-';
    document.getElementById('view-phone').textContent   = u.phone   || 'Not set';
    document.getElementById('view-dob').textContent     = formatDate(u.dateOfBirth);
    document.getElementById('view-address').textContent = u.address || 'Not set';
    document.getElementById('view-joined').textContent  = formatDate(u.createdAt);

    document.getElementById('edit-name').value    = u.name    || '';
    document.getElementById('edit-email').value   = u.email   || '';
    document.getElementById('edit-phone').value   = u.phone   || '';
    document.getElementById('edit-address').value = u.address || '';
    if (u.dateOfBirth) document.getElementById('edit-dob').value = u.dateOfBirth.split('T')[0];

  } catch (e) {
    showAlert('error-msg', 'Failed to load profile. Please refresh the page.');
  }
}

function showEditMode() {
  document.getElementById('view-mode').classList.add('hidden');
  document.getElementById('edit-mode').classList.remove('hidden');
  hideAlert('success-msg');
  hideAlert('error-msg');
}

function cancelEdit() {
  document.getElementById('edit-mode').classList.add('hidden');
  document.getElementById('view-mode').classList.remove('hidden');
  document.getElementById('edit-name-err').classList.remove('show');
}

async function saveProfile() {
  hideAlert('error-msg');
  hideAlert('success-msg');
  document.getElementById('edit-name-err').classList.remove('show');

  var name    = document.getElementById('edit-name').value.trim();
  var phone   = document.getElementById('edit-phone').value.trim();
  var dob     = document.getElementById('edit-dob').value;
  var address = document.getElementById('edit-address').value.trim();

  if (!name) { document.getElementById('edit-name-err').classList.add('show'); return; }

  var btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    var body = { name };
    if (phone)   body.phone = phone;
    if (dob)     body.dateOfBirth = dob;
    if (address) body.address = address;

    var res = await fetch(API + '/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      },
      body: JSON.stringify(body)
    });
    var data = await res.json();
    if (!res.ok) { showAlert('error-msg', data.message || 'Update failed.'); return; }

    var stored = JSON.parse(localStorage.getItem('ef_user') || '{}');
    stored.name = name;
    localStorage.setItem('ef_user', JSON.stringify(stored));

    await loadProfile();
    cancelEdit();
    showAlert('success-msg', 'Profile updated successfully!');
    setTimeout(function () { hideAlert('success-msg'); }, 4000);

  } catch (e) {
    showAlert('error-msg', 'Could not connect to the server. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

// keyboard support
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeModal(); closeMenu(); }
  if (e.key !== 'Enter') return;
  if (!document.getElementById('modal-overlay').classList.contains('open')) return;
  if (document.getElementById('login-section').classList.contains('hidden')) doRegister();
  else doLogin();
});

// init — route to the right page on load
if (getToken()) {
  showPage('profile');
  loadProfile();
} else {
  showPage('landing');
}
