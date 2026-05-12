var API = 'http://localhost:5000/api/memberships';

var currentPlanId = '';
var currentPlan   = '';
var currentPrice  = 0;

function getToken() {
  return localStorage.getItem('ef_token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('ef_user') || '{}'); } catch(e) { return {}; }
}

function durationLabel(days) {
  if (days <= 31)  return '1 Month';
  if (days <= 62)  return '2 Months';
  if (days <= 93)  return '3 Months';
  if (days <= 186) return '6 Months';
  if (days <= 366) return '1 Year';
  return days + ' days';
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ── Plan loading ─────────────────────────────────────────── */

async function loadPlans() {
  var grid = document.getElementById('plans-grid');
  grid.innerHTML = '<div class="plans-loading"><i class="fas fa-spinner fa-spin"></i> Loading plans&hellip;</div>';

  try {
    var res  = await fetch(API + '/plans');
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

  if (!plans.length) {
    grid.innerHTML = '<div class="plans-error"><i class="fas fa-info-circle"></i> No plans available at this time.</div>';
    return;
  }

  grid.innerHTML = '';
  dropdown.innerHTML = '<option value="">&#8212; Select a plan &#8212;</option>';

  plans.forEach(function(plan) {
    var featHtml = '';
    (plan.features || []).forEach(function(f) {
      featHtml += '<li><i class="fas fa-check-circle"></i> ' + esc(f) + '</li>';
    });

    var card = document.createElement('div');
    card.className = 'plan-card';
    card.dataset.planId = plan._id;
    card.dataset.plan   = plan.name.toLowerCase();
    card.innerHTML =
      '<div class="plan-name">' + esc(plan.name) + '</div>' +
      '<div class="plan-price"><sup>NPR</sup>' + plan.price.toLocaleString() + '<sub>/mo</sub></div>' +
      '<div class="plan-duration"><i class="fas fa-calendar-alt"></i> ' + durationLabel(plan.duration) + '</div>' +
      (plan.description ? '<div class="plan-description">' + esc(plan.description) + '</div>' : '') +
      '<hr>' +
      (featHtml ? '<ul class="plan-features">' + featHtml + '</ul>' : '') +
      '<button type="button" class="btn-plan" ' +
        'onclick="selectPlan(\'' + plan._id + '\',\'' + esc(plan.name) + '\',' + plan.price + ',' + plan.duration + ')">' +
        'Get Started</button>';

    grid.appendChild(card);

    var opt = document.createElement('option');
    opt.value = plan._id + '|' + plan.name + '|' + plan.price + '|' + plan.duration;
    opt.textContent = plan.name + ' — NPR ' + plan.price.toLocaleString() + '/mo (' + durationLabel(plan.duration) + ')';
    dropdown.appendChild(opt);
  });
}

/* ── Active subscription check ────────────────────────────── */

async function checkActiveSubscription() {
  var token = getToken();
  if (!token) return;

  try {
    var res  = await fetch(API + '/my-subscription', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return;
    var data = await res.json();
    if (data.subscription) showSubBanner(data.subscription);
  } catch(e) { /* silent — user may not have a subscription yet */ }
}

function showSubBanner(sub) {
  var endDate = new Date(sub.endDate).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  document.getElementById('active-plan-name').textContent = sub.plan ? sub.plan.name : 'Active';
  document.getElementById('active-end-date').textContent  = endDate;
  document.getElementById('active-sub-banner').classList.remove('hidden');
}

/* ── Auth guard & pre-fill ────────────────────────────────── */

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

/* ── Plan selection ───────────────────────────────────────── */

function selectPlan(planId, planName, price, duration) {
  currentPlanId = planId;
  currentPlan   = planName;
  currentPrice  = price;

  document.querySelectorAll('.plan-card').forEach(function(c) {
    c.classList.toggle('selected', c.dataset.planId === planId);
  });

  document.getElementById('summary-plan').textContent     = planName + ' Plan';
  document.getElementById('summary-duration').textContent = durationLabel(duration || 30);
  document.getElementById('summary-total').textContent    = 'NPR ' + price.toLocaleString();

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
    document.getElementById('summary-total').textContent = 'NPR 0';
    document.querySelectorAll('.plan-card').forEach(function(c) { c.classList.remove('selected'); });
    return;
  }
  var p = val.split('|');
  selectPlan(p[0], p[1], parseInt(p[2]), parseInt(p[3]));
}

/* ── Form validation helpers ──────────────────────────────── */

function showFieldErr(errId, inputId) {
  document.getElementById(errId).classList.add('show');
  if (inputId) document.getElementById(inputId).classList.add('error');
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(function(el) { el.classList.remove('show'); });
  document.querySelectorAll('input, select').forEach(function(el) { el.classList.remove('error'); });
}

function showAlert(id, msg) {
  var el = document.getElementById(id);
  if (msg) el.textContent = msg;
  el.classList.add('show');
}

function hideAlert(id) {
  document.getElementById(id).classList.remove('show');
}

/* ── Submit subscription ──────────────────────────────────── */

async function submitPayment() {
  clearErrors();
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
  if (!token) {
    showAlert('pay-error', 'You must be logged in to subscribe. Please log in first.');
    return;
  }

  var btn = document.getElementById('pay-btn');
  btn.disabled    = true;
  btn.textContent = 'Processing…';

  var parts     = plan.split('|');
  var planId    = parts[0];
  var planName  = parts[1];
  var planPrice = parseInt(parts[2]);

  try {
    var res  = await fetch(API + '/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ planId: planId, paymentMethod: method })
    });
    var data = await res.json();

    if (!res.ok) {
      showAlert('pay-error', data.message || 'Subscription failed. Please try again.');
      return;
    }

    addToHistory(planName, planPrice, method, data.subscription);
    showAlert('pay-success', 'Subscription activated! Welcome to the ' + planName + ' Plan.');
    if (data.subscription) showSubBanner(data.subscription);

  } catch(e) {
    showAlert('pay-error', 'Could not connect to the server. Is the backend running?');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Confirm & Subscribe';
  }
}

/* ── Billing history ──────────────────────────────────────── */

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
    '<td>' + planName + '</td>' +
    '<td>NPR ' + price.toLocaleString() + '</td>' +
    '<td>' + methodLabel + '</td>' +
    '<td><span class="status-badge active">Active</span></td>';

  tbody.prepend(row);
  document.getElementById('history').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Init ─────────────────────────────────────────────────── */

window.addEventListener('DOMContentLoaded', function() {
  loadPlans();
  checkActiveSubscription();
  initBillingSection();
});
