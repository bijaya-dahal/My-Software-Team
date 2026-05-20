const USER_API = 'http://localhost:5000/api/users';
const MEMBERSHIP_API = 'http://localhost:5000/api/memberships';


// Get token from local storage
function getToken() {
  return localStorage.getItem('ef_token');
}

let plansLoaded = false;

// Show the right page section
function showPage(page) {
  document.getElementById('page-landing').classList.toggle('hidden', page !== 'landing');
  document.getElementById('page-profile').classList.toggle('hidden', page !== 'profile');
  document.getElementById('page-plans').classList.toggle('hidden',   page !== 'plans');
  document.getElementById('page-classes').classList.toggle('hidden', page !== 'classes');
  document.getElementById('page-trainer').classList.toggle('hidden', page !== 'trainer');
  if (page === 'classes') loadClasses();
  document.getElementById('main-nav').classList.toggle('hidden',     page !== 'landing');
  document.getElementById('profile-nav').classList.toggle('hidden',  page === 'landing');
  window.scrollTo(0, 0);
  // Only load plans once
  if (page === 'plans' && !plansLoaded) {
    plansLoaded = true;
    loadPlans();
    checkActiveSubscription();

    initBillingSection();
    loadPaymentHistory();
  }
}


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

window.addEventListener('scroll', function () {
  document.getElementById('main-nav').classList.toggle('scrolled', window.scrollY > 50);
});

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

async function doRegister() {
  clearErrors('register-section');
  hideAlert('reg-err-msg');

  var fname = document.getElementById('reg-fname').value.trim();
  var lname = document.getElementById('reg-lname').value.trim();
  var email = document.getElementById('reg-email').value.trim().toLowerCase();
  var phone = document.getElementById('reg-phone').value.trim();
  var dob   = document.getElementById('reg-dob').value;
  var city  = document.getElementById('reg-city').value.trim();
  var pw    = document.getElementById('reg-password').value;
  var pw2   = document.getElementById('reg-password2').value;
  var terms = document.getElementById('reg-terms').checked;

  var bad = false;
  if (!fname) { showFieldErr('reg-fname-err', 'reg-fname'); bad = true; }
  if (!lname) { showFieldErr('reg-lname-err', 'reg-lname'); bad = true; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showFieldErr('reg-email-err', 'reg-email'); bad = true; }
  if (!phone) { showFieldErr('reg-phone-err', 'reg-phone'); bad = true; }
  if (!dob)   { showFieldErr('reg-dob-err',   'reg-dob');   bad = true; }
  if (!city)  { showFieldErr('reg-city-err',  'reg-city');  bad = true; }
  if (pw.length < 8) { showFieldErr('reg-pw-err',  'reg-password');  bad = true; }
  if (pw !== pw2)    { showFieldErr('reg-pw2-err', 'reg-password2'); bad = true; }
  if (!terms) { showFieldErr('reg-terms-err', null); bad = true; }
  if (bad) { showAlert('reg-err-msg', 'Please fix the errors above.'); return; }

  setLoading('reg-btn', true, 'Create Account');
  try {
    var res = await fetch(USER_API + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: fname + ' ' + lname, email, password: pw, role: document.getElementById('reg-role').value, phone, dateOfBirth: dob, address: city })
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
    var res = await fetch(USER_API + '/login', {
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

function logout() {
  localStorage.removeItem('ef_token');
  localStorage.removeItem('ef_user');
  showPage('landing');
}

function getInitials(name) {
  var parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

function formatDate(str) {
  if (!str) return 'Not set';
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function loadProfile() {
  try {
    var res = await fetch(USER_API + '/profile', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });

    if (res.status === 401) { logout(); return; }

    var data = await res.json();
    var u = data.user || data;

    document.getElementById('nav-username').textContent    = u.name;
    document.getElementById('nav-avatar-sm').textContent   = getInitials(u.name);
    document.getElementById('profile-avatar').textContent  = getInitials(u.name);
    document.getElementById('profile-name').textContent    = u.name;
    document.getElementById('profile-email').textContent   = u.email;
    var storedUser = getUser();
    var displayRole = (storedUser.role || u.role || 'member');
    document.getElementById('profile-role').textContent = displayRole[0].toUpperCase() + displayRole.slice(1);

    document.getElementById('view-name').textContent    = u.name    || '-';
    document.getElementById('view-email').textContent   = u.email   || '-';
    document.getElementById('view-phone').textContent   = u.phone   || 'Not set';
    document.getElementById('view-dob').textContent     = formatDate(u.dateOfBirth);
    document.getElementById('view-address').textContent = u.address || 'Not set';
    document.getElementById('view-joined').textContent  = formatDate(u.createdAt);

    document.getElementById('edit-name').value    = u.name    || '';
    document.getElementById('edit-email').value   = u.email   || '';
    document.getElementById('edit-role').value    = u.role    || 'member';
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
  var role    = document.getElementById('edit-role').value;
  var phone   = document.getElementById('edit-phone').value.trim();
  var dob     = document.getElementById('edit-dob').value;
  var address = document.getElementById('edit-address').value.trim();

  if (!name) { document.getElementById('edit-name-err').classList.add('show'); return; }

  var btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    var body = { name };
    if (role)    body.role = role;
    if (phone)   body.phone = phone;
    if (dob)     body.dateOfBirth = dob;
    if (address) body.address = address;

    var res = await fetch(USER_API + '/profile', {
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
    if (role) stored.role = role;
    localStorage.setItem('ef_user', JSON.stringify(stored));

    await loadProfile();

    // Force role badge to the selected value — backend may not persist role changes
    if (role) {
      var roleLabel = role[0].toUpperCase() + role.slice(1);
      document.getElementById('profile-role').textContent = roleLabel;
    }

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

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeModal(); closeMenu(); }
  if (e.key !== 'Enter') return;
  if (!document.getElementById('modal-overlay').classList.contains('open')) return;
  if (document.getElementById('login-section').classList.contains('hidden')) doRegister();
  else doLogin();
});

if (getToken()) {
  showPage('profile');
  loadProfile();
} else {
  showPage('landing');
}

var currentPlanId  = '';
var currentPlan    = '';
var currentPrice   = 0;

var renewalPlanId   = '';
var renewalPlanName = '';
var renewalPrice    = 0;
var currentSubId    = '';

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function durationLabel(days) {
  if (days <= 31)  return '1 Month';
  if (days <= 62)  return '2 Months';
  if (days <= 93)  return '3 Months';
  if (days <= 186) return '6 Months';
  if (days <= 366) return '1 Year';
  return days + ' days';
}

function clearBillingErrors() {
  document.querySelectorAll('#page-plans .field-error').forEach(function(el) { el.classList.remove('show'); });
  document.querySelectorAll('#page-plans input, #page-plans select').forEach(function(el) { el.classList.remove('error'); });
}

async function loadPlans() {
  var grid = document.getElementById('plans-grid');
  grid.innerHTML = '<div class="plans-loading"><i class="fas fa-spinner fa-spin"></i> Loading plans&hellip;</div>';
  try {
    var res  = await fetch(MEMBERSHIP_API + '/plans');
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Server error');
    renderPlans(data.plans || []);
  } catch(e) {
    grid.innerHTML =
      '<div class="plans-error"><i class="fas fa-exclamation-triangle"></i> ' +
      'Could not load plans. Please ensure the server is running.</div>';
  }
}

function renderPlans(plans) {
  var grid     = document.getElementById('plans-grid');
  var dropdown = document.getElementById('pay-plan');
  var renewDrop = document.getElementById('renew-plan');

  if (!plans.length) {
    grid.innerHTML = '<div class="plans-error"><i class="fas fa-info-circle"></i> No plans available at this time.</div>';
    return;
  }

  grid.innerHTML = '';
  dropdown.innerHTML  = '<option value="">&#8212; Select a plan &#8212;</option>';
  renewDrop.innerHTML = '<option value="">&#8212; Same as current plan &#8212;</option>';

  plans.forEach(function(plan) {
    var featHtml = '';
    (plan.features || []).forEach(function(f) {
      featHtml += '<li><i class="fas fa-check-circle"></i> ' + esc(f) + '</li>';
    });

    var card = document.createElement('div');
    card.className = 'plan-card';
    card.dataset.planId = plan._id;
    card.innerHTML =
      '<div class="plan-name">' + esc(plan.name) + '</div>' +
      '<div class="plan-price"><sup>£</sup>' + plan.price.toLocaleString() + '<sub>/mo</sub></div>' +
      '<div class="plan-duration"><i class="fas fa-calendar-alt"></i> ' + durationLabel(plan.duration) + '</div>' +
      (plan.description ? '<div class="plan-description">' + esc(plan.description) + '</div>' : '') +
      '<hr>' +
      (featHtml ? '<ul class="plan-features">' + featHtml + '</ul>' : '') +
      '<button type="button" class="btn-plan" ' +
        'onclick="selectPlan(\'' + plan._id + '\',\'' + esc(plan.name) + '\',' + plan.price + ',' + plan.duration + ')">' +
        'Get Started</button>';
    grid.appendChild(card);

    var optVal  = plan._id + '|' + plan.name + '|' + plan.price + '|' + plan.duration;
    var optText = plan.name + ' — £' + plan.price.toLocaleString() + '/mo (' + durationLabel(plan.duration) + ')';

    var opt = document.createElement('option');
    opt.value = optVal; opt.textContent = optText;
    dropdown.appendChild(opt);

    var renewOpt = document.createElement('option');
    renewOpt.value = optVal; renewOpt.textContent = optText;
    renewDrop.appendChild(renewOpt);
  });
}

async function checkActiveSubscription() {
  var token = getToken();
  if (!token) return;
  try {
    var res  = await fetch(MEMBERSHIP_API + '/my-subscription', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    var data = await res.json();
    if (data.subscription) showSubBanner(data.subscription);
  } catch(e) {}
}

function showSubBanner(sub) {
  var endDate = new Date(sub.endDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('active-plan-name').textContent = sub.plan ? sub.plan.name : 'Active';
  document.getElementById('active-end-date').textContent  = endDate;
  document.getElementById('active-sub-banner').classList.remove('hidden');
  showRenewalSection(sub);
}

function initBillingSection() {
  var token  = getToken();
  var notice = document.getElementById('auth-notice');
  var inner  = document.getElementById('billing-form-inner');
  if (!token) {
    notice.classList.remove('hidden');
    inner.classList.add('hidden');
    return;
  }
  notice.classList.add('hidden');
  inner.classList.remove('hidden');
  var user = getUser();
  if (user.name)  document.getElementById('pay-name').value  = user.name;
  if (user.email) document.getElementById('pay-email').value = user.email;
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('ef_user') || '{}'); } catch(e) { return {}; }
}

function selectPlan(planId, planName, price, duration) {
  currentPlanId = planId;
  currentPlan   = planName;
  currentPrice  = price;

  document.querySelectorAll('.plan-card').forEach(function(c) {
    c.classList.toggle('selected', c.dataset.planId === planId);
  });

  document.getElementById('summary-plan').textContent     = planName + ' Plan';
  document.getElementById('summary-duration').textContent = durationLabel(duration || 30);
  document.getElementById('summary-total').textContent    = '£' + price.toLocaleString();

  var dd = document.getElementById('pay-plan');
  for (var i = 0; i < dd.options.length; i++) {
    if (dd.options[i].value.startsWith(planId + '|')) { dd.selectedIndex = i; break; }
  }
  document.getElementById('billing').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onPlanDropdownChange() {
  var val = document.getElementById('pay-plan').value;
  if (!val) {
    currentPlanId = ''; currentPlan = ''; currentPrice = 0;
    document.getElementById('summary-plan').textContent  = '— No plan selected —';
    document.getElementById('summary-total').textContent = '£0';
    document.querySelectorAll('.plan-card').forEach(function(c) { c.classList.remove('selected'); });
    return;
  }
  var p = val.split('|');
  selectPlan(p[0], p[1], parseInt(p[2]), parseInt(p[3]));
}

async function submitPayment() {
  clearBillingErrors();
  hideAlert('pay-success');
  hideAlert('pay-error');

  var name   = document.getElementById('pay-name').value.trim();
  var email  = document.getElementById('pay-email').value.trim().toLowerCase();
  var plan   = document.getElementById('pay-plan').value;
  var method = document.getElementById('pay-method').value;

  var bad = false;
  if (!name)  { showFieldErr('pay-name-err',   'pay-name');   bad = true; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
              { showFieldErr('pay-email-err',  'pay-email');  bad = true; }
  if (!plan)  { showFieldErr('pay-plan-err',   'pay-plan');   bad = true; }
  if (!method){ showFieldErr('pay-method-err', 'pay-method'); bad = true; }
  if (bad)    { showAlert('pay-error', 'Please fix the errors below.'); return; }

  var token = getToken();
  if (!token) { showAlert('pay-error', 'You must be logged in to subscribe.'); return; }

  var btn = document.getElementById('pay-btn');
  btn.disabled = true; btn.textContent = 'Processing…';

  var parts    = plan.split('|');
  var planId   = parts[0];
  var planName = parts[1];
  var planPrice = parseInt(parts[2]);

  try {
    var res = await fetch(MEMBERSHIP_API + '/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ planId: planId, paymentMethod: method })
    });
    var data = await res.json();
    if (!res.ok) { showAlert('pay-error', data.message || 'Subscription failed. Please try again.'); return; }
    addToHistory(planName, planPrice, method, data.subscription);
    showAlert('pay-success', 'Subscription activated! Welcome to the ' + planName + ' Plan.');
    if (data.subscription) showSubBanner(data.subscription);
  } catch(e) {
    showAlert('pay-error', 'Could not connect to the server. Is the backend running?');
  } finally {
    btn.disabled = false; btn.textContent = 'Confirm & Subscribe';
  }
}

function addToHistory(planName, price, method, subscription) {
  var tbody    = document.getElementById('history-body');
  var emptyRow = tbody.querySelector('.empty-row');
  if (emptyRow) emptyRow.remove();

  var d       = subscription && subscription.startDate ? new Date(subscription.startDate) : new Date();
  var dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  var methodLabel = { cash: 'Pay at Counter', card: 'Credit/Debit Card', online: 'Online Transfer' }[method] || method;

  var row = document.createElement('tr');
  row.innerHTML =
    '<td>' + dateStr + '</td>' +
    '<td>' + esc(planName) + '</td>' +
    '<td>£' + price.toLocaleString() + '</td>' +
    '<td>' + esc(methodLabel) + '</td>' +
    '<td><span class="status-badge active">Active</span></td>';
  tbody.prepend(row);
  document.getElementById('history').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadPaymentHistory() {
  var token = getToken();
  if (!token) return;
  try {
    var res  = await fetch(MEMBERSHIP_API + '/payment-history', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    var data = await res.json();
    if (data.payments && data.payments.length) renderPaymentHistory(data.payments);
  } catch(e) {}
}

function renderPaymentHistory(payments) {
  var tbody    = document.getElementById('history-body');
  var emptyRow = tbody.querySelector('.empty-row');
  if (emptyRow) emptyRow.remove();
  tbody.innerHTML = '';

  var methodLabels  = { cash: 'Pay at Counter', card: 'Credit/Debit Card', online: 'Online Transfer' };
  var statusClasses = { paid: 'paid', active: 'active', pending: 'pending', failed: 'failed' };

  payments.forEach(function(p) {
    var d        = new Date(p.date || p.createdAt || p.startDate);
    var dateStr  = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    var status   = (p.status || 'paid').toLowerCase();
    var method   = methodLabels[p.paymentMethod] || p.paymentMethod || '—';
    var planName = p.plan ? (p.plan.name || p.planName || '—') : (p.planName || '—');

    var row = document.createElement('tr');
    row.innerHTML =
      '<td>' + dateStr + '</td>' +
      '<td>' + esc(planName) + '</td>' +
      '<td>£' + (p.amount || p.price || 0).toLocaleString() + '</td>' +
      '<td>' + esc(method) + '</td>' +
      '<td><span class="status-badge ' + (statusClasses[status] || 'paid') + '">' + esc(status) + '</span></td>';
    tbody.appendChild(row);
  });
}

function showRenewalSection(sub) {
  document.getElementById('renewal-section').classList.remove('hidden');
  currentSubId    = sub._id || '';
  renewalPlanId   = sub.plan ? (sub.plan._id || '') : '';
  renewalPlanName = sub.plan ? (sub.plan.name || 'Current Plan') : 'Current Plan';
  renewalPrice    = sub.plan ? (sub.plan.price || 0) : 0;

  var endDate = new Date(sub.endDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('renew-current-plan').textContent = renewalPlanName;
  document.getElementById('renew-expiry').textContent       = endDate;
  document.getElementById('renew-new-plan').textContent     = renewalPlanName;
  document.getElementById('renew-total').textContent        = '£' + renewalPrice.toLocaleString();
}

function scrollToRenewal() {
  document.getElementById('renewal-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onRenewPlanChange() {
  var val = document.getElementById('renew-plan').value;
  if (!val) {
    document.getElementById('renew-new-plan').textContent = renewalPlanName || 'Same Plan';
    document.getElementById('renew-total').textContent    = '£' + renewalPrice.toLocaleString();
    return;
  }
  var p = val.split('|');
  document.getElementById('renew-new-plan').textContent = p[1] + ' Plan';
  document.getElementById('renew-total').textContent    = '£' + parseInt(p[2]).toLocaleString();
}

async function submitRenewal() {
  hideAlert('renew-success');
  hideAlert('renew-error');
  document.getElementById('renew-method-err').classList.remove('show');
  document.getElementById('renew-method').classList.remove('error');

  var planVal = document.getElementById('renew-plan').value;
  var method  = document.getElementById('renew-method').value;

  if (!method) {
    document.getElementById('renew-method-err').classList.add('show');
    document.getElementById('renew-method').classList.add('error');
    showAlert('renew-error', 'Please select a payment method.');
    return;
  }

  var token = getToken();
  if (!token) { showAlert('renew-error', 'You must be logged in to renew.'); return; }

  var selectedPlanId = planVal ? planVal.split('|')[0] : renewalPlanId;
  var chosenPlanName = planVal ? planVal.split('|')[1] : renewalPlanName;
  var chosenPrice    = planVal ? parseInt(planVal.split('|')[2]) : renewalPrice;

  var btn = document.getElementById('renew-btn');
  btn.disabled = true; btn.textContent = 'Processing…';

  try {
    var res = await fetch(MEMBERSHIP_API + '/renew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ planId: selectedPlanId, paymentMethod: method, subscriptionId: currentSubId })
    });
    var data = await res.json();
    if (!res.ok) { showAlert('renew-error', data.message || 'Renewal failed. Please try again.'); return; }
    addToHistory(chosenPlanName, chosenPrice, method, data.subscription);
    showAlert('renew-success', 'Membership renewed! Your ' + chosenPlanName + ' plan has been extended.');
    if (data.subscription) showSubBanner(data.subscription);
  } catch(e) {
    showAlert('renew-error', 'Could not connect to the server. Is the backend running?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sync-alt"></i>&nbsp; Confirm Renewal';
  }
}

// — Classes page —

var classesLoaded = false;

async function loadClasses() {
  if (classesLoaded) return;
  var grid = document.getElementById('classes-grid');
  try {
    var res  = await fetch('http://localhost:5000/api/classes');
    var data = await res.json();
    var list = data.classes || [];
    if (!list.length) {
      grid.innerHTML = '<div class="plans-loading">No classes available at the moment.</div>';
      return;
    }
    grid.innerHTML = '';
    list.forEach(function(c) {
      var date = new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      var card = document.createElement('div');
      card.className = 'feat-card';
      card.innerHTML =
        '<div class="feat-icon"><i class="fas fa-calendar-check"></i></div>' +
        '<h3>' + esc(c.name) + '</h3>' +
        '<p>' + esc(c.category || 'General') + ' &mdash; ' + esc(c.instructor) + '</p>' +
        '<p style="margin-top:8px;font-size:0.8rem;color:rgba(255,255,255,0.45)">' +
          '<i class="fas fa-clock" style="margin-right:5px;color:var(--orange)"></i>' + esc(c.startTime) + ' &ndash; ' + esc(c.endTime) +
          '&ensp;<i class="fas fa-calendar" style="margin-right:5px;color:var(--orange)"></i>' + date +
          '&ensp;<i class="fas fa-users" style="margin-right:5px;color:var(--orange)"></i>' + (c.registeredMembers ? c.registeredMembers.length : 0) + ' / ' + c.capacity +
        '</p>';
      grid.appendChild(card);
    });
    classesLoaded = true;
  } catch(e) {
    grid.innerHTML = '<div class="plans-error"><i class="fas fa-exclamation-triangle"></i> Could not load classes. Please ensure the server is running.</div>';
  }
}

// — Trainer Assignment (merged from assign_trainer) —

var totalHours = 0;

function clearTrainerForm() {
  document.getElementById('trainerName').value  = '';
  document.getElementById('classType').value    = '';
  document.getElementById('sessionDate').value  = '';
  document.getElementById('sessionHours').value = '';
  document.getElementById('notes').value        = '';
}

function createAssignmentRow(data) {
  var tbody = document.getElementById('assignmentBody');
  var row   = document.createElement('tr');
  row.innerHTML =
    '<td>' + data.trainerName  + '</td>' +
    '<td>' + data.classType    + '</td>' +
    '<td>' + data.sessionDate  + '</td>' +
    '<td>' + data.sessionHours + '</td>' +
    '<td>' + data.notes        + '</td>' +
    '<td><button class="delete-btn" type="button">Delete</button></td>';

  row.querySelector('.delete-btn').addEventListener('click', function() {
    row.remove();
    totalHours -= Number(data.sessionHours);
    document.getElementById('totalHours').textContent = totalHours;
  });

  tbody.appendChild(row);
}

document.addEventListener('DOMContentLoaded', function() {
  var assignBtn = document.getElementById('assignButton');
  var resetBtn  = document.getElementById('resetButton');
  if (!assignBtn) return;

  assignBtn.addEventListener('click', function() {
    var trainerName  = document.getElementById('trainerName').value.trim();
    var classType    = document.getElementById('classType').value;
    var sessionDate  = document.getElementById('sessionDate').value;
    var sessionHours = document.getElementById('sessionHours').value;
    var notes        = document.getElementById('notes').value.trim() || '—';

    if (!trainerName || !classType || !sessionDate || !sessionHours) {
      alert('Please complete all required fields.');
      return;
    }

    createAssignmentRow({ trainerName, classType, sessionDate, sessionHours, notes });
    totalHours += Number(sessionHours);
    document.getElementById('totalHours').textContent = totalHours;
    clearTrainerForm();
  });

  resetBtn.addEventListener('click', clearTrainerForm);
});
