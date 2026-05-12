var CLASS_API   = 'http://localhost:5000/api/classes';
var TRAINER_API = 'http://localhost:5000/api/trainers';

var allClasses     = [];
var myClassIds     = new Set();   // IDs of classes the member has booked
var allAssignments = [];

/* ── Auth helpers ────────────────────────────────── */
function getToken() {
  return localStorage.getItem('ef_token');
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('ef_user') || '{}'); } catch (e) { return {}; }
}

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() };
}

/* ── Utility helpers ─────────────────────────────── */
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(str) {
  if (!str) return '-';
  return new Date(str).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function showAlert(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function () { el.classList.remove('show'); }, 6000);
}

function hideAlert(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

function showFieldErr(errId, inputId) {
  var err = document.getElementById(errId);
  if (err) err.classList.add('show');
  if (inputId) {
    var inp = document.getElementById(inputId);
    if (inp) inp.classList.add('error');
  }
}

function clearFieldErrs() {
  document.querySelectorAll('.field-error').forEach(function (el) { el.classList.remove('show'); });
  document.querySelectorAll('input.error, select.error').forEach(function (el) { el.classList.remove('error'); });
}

/* ── Tab navigation ──────────────────────────────── */
function showTab(name) {
  var tabs = ['schedule', 'bookings', 'assign', 'hours'];
  tabs.forEach(function (t) {
    var section = document.getElementById('section-' + t);
    var btn     = document.getElementById('tab-' + t);
    if (section) section.classList.toggle('hidden', t !== name);
    if (btn)     btn.classList.toggle('active',   t === name);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════════════════
   USER STORY 2 — View Class Schedules
   GET /api/classes  (public)
   ═══════════════════════════════════════════════════ */
async function loadClasses() {
  var grid = document.getElementById('classes-grid');
  if (!grid) return;

  try {
    var res  = await fetch(CLASS_API);
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Server error');
    allClasses = data.classes || [];
    renderClasses(allClasses);
    populateClassDropdown(allClasses);   // also fills the assign-trainer dropdown
  } catch (e) {
    grid.innerHTML =
      '<div class="state-box error-state"><i class="fas fa-exclamation-triangle"></i> ' +
      'Could not load classes. Please ensure the server is running.</div>';
  }
}

function renderClasses(classes) {
  var grid = document.getElementById('classes-grid');
  var role = getUser().role || '';

  if (!classes.length) {
    grid.innerHTML =
      '<div class="state-box empty-state"><i class="fas fa-calendar-times"></i> No upcoming classes found.</div>';
    return;
  }

  grid.innerHTML = '';
  classes.forEach(function (cls) {
    var registered = cls.registeredMembers ? cls.registeredMembers.length : 0;
    var spotsLeft  = cls.capacity - registered;
    var isFull     = spotsLeft <= 0;
    var isBooked   = myClassIds.has(cls._id);

    var topBadge = isFull
      ? '<span class="full-badge">FULL</span>'
      : '<span class="spots-badge">' + spotsLeft + ' spot' + (spotsLeft !== 1 ? 's' : '') + ' left</span>';

    var bookBtn = '';
    if (role === 'member') {
      if (isBooked) {
        bookBtn = '<button type="button" class="btn-book btn-booked" disabled><i class="fas fa-check"></i> Booked</button>';
      } else if (isFull) {
        bookBtn = '<button type="button" class="btn-book btn-full" disabled>Class Full</button>';
      } else {
        bookBtn = '<button type="button" class="btn-book" onclick="bookClass(\'' + cls._id + '\', this)">Book Now</button>';
      }
    }

    var card = document.createElement('div');
    card.className       = 'class-card';
    card.dataset.classId = cls._id;
    card.dataset.category = cls.category || 'Other';
    card.innerHTML =
      '<div class="class-card-top">' +
        '<span class="cat-badge cat-' + esc((cls.category || 'Other').toLowerCase()) + '">' + esc(cls.category || 'Other') + '</span>' +
        topBadge +
      '</div>' +
      '<h3 class="class-name">' + esc(cls.name) + '</h3>' +
      (cls.description ? '<p class="class-desc">' + esc(cls.description) + '</p>' : '') +
      '<div class="class-meta">' +
        '<div class="meta-row"><i class="fas fa-calendar-day"></i> ' + fmtDate(cls.date) + '</div>' +
        '<div class="meta-row"><i class="fas fa-clock"></i> ' + esc(cls.startTime) + ' &ndash; ' + esc(cls.endTime) + '</div>' +
        '<div class="meta-row"><i class="fas fa-user-tie"></i> ' + esc(cls.instructor) + '</div>' +
        '<div class="meta-row"><i class="fas fa-map-marker-alt"></i> ' + esc(cls.location || 'Main Hall') + '</div>' +
        '<div class="meta-row"><i class="fas fa-users"></i> ' + registered + ' / ' + cls.capacity + ' registered</div>' +
      '</div>' +
      bookBtn;

    grid.appendChild(card);
  });
}

// Filter class cards by category without a re-fetch
function filterClasses() {
  var cat      = document.getElementById('filter-category').value;
  var filtered = cat ? allClasses.filter(function (c) { return c.category === cat; }) : allClasses;
  renderClasses(filtered);
}

/* ═══════════════════════════════════════════════════
   USER STORY 1 — Book a Class
   POST /api/classes/:id/register  (member)
   ═══════════════════════════════════════════════════ */
async function bookClass(classId, btn) {
  btn.disabled    = true;
  btn.textContent = 'Booking…';

  try {
    var res  = await fetch(CLASS_API + '/' + classId + '/register', {
      method:  'POST',
      headers: authHeaders()
    });
    var data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Could not book this class.');
      btn.disabled    = false;
      btn.textContent = 'Book Now';
      return;
    }

    // Mark as booked in local state and update button immediately
    myClassIds.add(classId);
    btn.innerHTML  = '<i class="fas fa-check"></i> Booked';
    btn.className  = 'btn-book btn-booked';
    btn.disabled   = true;
    btn.onclick    = null;

    // Update spots-left badge on the same card
    var card = btn.closest('.class-card');
    if (card) {
      var badgeEl = card.querySelector('.spots-badge');
      if (badgeEl) {
        var current = allClasses.find(function (c) { return c._id === classId; });
        if (current) {
          current.registeredMembers = current.registeredMembers || [];
          current.registeredMembers.push('me');
          var left = current.capacity - current.registeredMembers.length;
          if (left <= 0) {
            badgeEl.className   = 'full-badge';
            badgeEl.textContent = 'FULL';
          } else {
            badgeEl.textContent = left + ' spot' + (left !== 1 ? 's' : '') + ' left';
          }
        }
      }
    }

    // Refresh my-bookings list silently
    loadMyClasses();

  } catch (e) {
    alert('Could not connect to the server. Is the backend running?');
    btn.disabled    = false;
    btn.textContent = 'Book Now';
  }
}

/* ═══════════════════════════════════════════════════
   USER STORY 1 — My Bookings
   GET /api/classes/my-classes  (member)
   ═══════════════════════════════════════════════════ */
async function loadMyClasses() {
  var list = document.getElementById('bookings-list');
  if (!list) return;

  try {
    var res  = await fetch(CLASS_API + '/my-classes', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    var data = await res.json();

    if (!res.ok) {
      list.innerHTML =
        '<div class="state-box error-state"><i class="fas fa-exclamation-triangle"></i> ' +
        esc(data.message || 'Could not load bookings.') + '</div>';
      return;
    }

    var classes = data.classes || [];

    // Update local booking set for accurate "Booked" buttons in the schedule view
    myClassIds = new Set(classes.map(function (c) { return c._id; }));

    if (!classes.length) {
      list.innerHTML =
        '<div class="state-box empty-state"><i class="fas fa-calendar-times"></i> ' +
        'You have not booked any classes yet. Browse the Class Schedule tab to get started.</div>';
      return;
    }

    list.innerHTML = '';
    classes.forEach(function (cls) {
      var row = document.createElement('div');
      row.className = 'booking-row';
      row.innerHTML =
        '<div class="booking-info">' +
          '<span class="cat-badge cat-' + esc((cls.category || 'other').toLowerCase()) + '">' + esc(cls.category || 'Other') + '</span>' +
          '<strong>' + esc(cls.name) + '</strong>' +
          '<span class="booking-detail"><i class="fas fa-calendar-day"></i> ' + fmtDate(cls.date) + '</span>' +
          '<span class="booking-detail"><i class="fas fa-clock"></i> ' + esc(cls.startTime) + ' &ndash; ' + esc(cls.endTime) + '</span>' +
          '<span class="booking-detail"><i class="fas fa-user-tie"></i> ' + esc(cls.instructor) + '</span>' +
          '<span class="booking-detail"><i class="fas fa-map-marker-alt"></i> ' + esc(cls.location || 'Main Hall') + '</span>' +
        '</div>' +
        '<span class="status-badge active">Confirmed</span>';
      list.appendChild(row);
    });

  } catch (e) {
    list.innerHTML =
      '<div class="state-box error-state"><i class="fas fa-exclamation-triangle"></i> Could not connect to server.</div>';
  }
}

/* ═══════════════════════════════════════════════════
   USER STORY 3 — Assign Trainer
   GET /api/trainers            (staff — populate dropdown)
   POST /api/trainers/assign    (staff)
   GET /api/trainers/assignments (staff)
   DELETE /api/trainers/assignments/:id (staff)
   ═══════════════════════════════════════════════════ */

// Populate the trainer dropdown in the assign form
async function loadTrainers() {
  var sel = document.getElementById('sel-trainer');
  if (!sel) return;

  try {
    var res  = await fetch(TRAINER_API, { headers: authHeaders() });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Server error');

    var trainers = data.trainers || [];
    sel.innerHTML = '<option value="">&#8212; Select a trainer &#8212;</option>';
    if (!trainers.length) {
      sel.innerHTML = '<option value="">No trainers found</option>';
      return;
    }
    trainers.forEach(function (t) {
      var opt = document.createElement('option');
      opt.value       = t._id;
      opt.textContent = t.name + (t.email ? ' (' + t.email + ')' : '');
      sel.appendChild(opt);
    });
  } catch (e) {
    sel.innerHTML = '<option value="">Could not load trainers</option>';
  }
}

// Populate the class dropdown in the assign form (called after loadClasses)
function populateClassDropdown(classes) {
  var sel = document.getElementById('sel-class');
  if (!sel) return;

  sel.innerHTML = '<option value="">&#8212; Select a class &#8212;</option>';
  if (!classes.length) {
    sel.innerHTML = '<option value="">No classes available</option>';
    return;
  }
  classes.forEach(function (cls) {
    var opt = document.createElement('option');
    opt.value       = cls._id;
    opt.textContent = cls.name + ' — ' + fmtDate(cls.date) + ' ' + cls.startTime;
    sel.appendChild(opt);
  });
}

// Submit the assign-trainer form
async function submitAssignment() {
  clearFieldErrs();
  hideAlert('assign-success');
  hideAlert('assign-error');

  var trainerId = document.getElementById('sel-trainer').value;
  var classId   = document.getElementById('sel-class').value;
  var notes     = document.getElementById('assign-notes').value.trim();

  var bad = false;
  if (!trainerId) { showFieldErr('sel-trainer-err', 'sel-trainer'); bad = true; }
  if (!classId)   { showFieldErr('sel-class-err',   'sel-class');   bad = true; }
  if (bad) return;

  var btn = document.getElementById('assign-btn');
  btn.disabled    = true;
  btn.textContent = 'Assigning…';

  try {
    var res  = await fetch(TRAINER_API + '/assign', {
      method:  'POST',
      headers: authHeaders(),
      body:    JSON.stringify({ trainerId: trainerId, classId: classId, notes: notes })
    });
    var data = await res.json();

    if (!res.ok) {
      showAlert('assign-error', data.message || 'Assignment failed. Please try again.');
      return;
    }

    // Reset form
    document.getElementById('sel-trainer').value  = '';
    document.getElementById('sel-class').value    = '';
    document.getElementById('assign-notes').value = '';

    showAlert('assign-success', 'Trainer assigned successfully!');
    loadAssignments();   // refresh both assignments table and hours table

  } catch (e) {
    showAlert('assign-error', 'Could not connect to the server. Is the backend running?');
  } finally {
    btn.disabled   = false;
    btn.innerHTML  = '<i class="fas fa-check"></i> Assign Trainer';
  }
}

// Load and render all assignments
async function loadAssignments() {
  var tbody = document.getElementById('assignments-body');
  if (tbody) tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Loading assignments&hellip;</td></tr>';

  try {
    var res  = await fetch(TRAINER_API + '/assignments', { headers: authHeaders() });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Server error');

    allAssignments = data.assignments || [];
    renderAssignments(allAssignments);
    renderHoursTable(allAssignments);   // keep hours tab in sync
  } catch (e) {
    if (tbody)
      tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Could not load assignments.</td></tr>';
  }
}

function renderAssignments(assignments) {
  var tbody = document.getElementById('assignments-body');
  if (!tbody) return;

  if (!assignments.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No assignments yet.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  assignments.forEach(function (a) {
    var badgeClass = a.status === 'assigned'   ? 'assigned'  :
                     a.status === 'completed'  ? 'completed' : 'cancelled';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><strong>' + esc(a.trainer ? a.trainer.name : '—') + '</strong>' +
           '<br><small>' + esc(a.trainer ? a.trainer.email : '') + '</small></td>' +
      '<td>' + esc(a.class ? a.class.name : '—') + '</td>' +
      '<td>' + (a.class ? fmtDate(a.class.date) : '—') + '</td>' +
      '<td>' + (a.class ? esc(a.class.startTime) + ' – ' + esc(a.class.endTime) : '—') + '</td>' +
      '<td>' + esc(a.assignedBy ? a.assignedBy.name : '—') + '</td>' +
      '<td><span class="status-badge ' + badgeClass + '">' + esc(a.status) + '</span></td>' +
      '<td>' +
        (a.status === 'assigned'
          ? '<button class="btn-danger" onclick="cancelAssign(\'' + a._id + '\', this)">Cancel</button>'
          : '&#8212;') +
      '</td>';
    tbody.appendChild(tr);
  });
}

// Cancel an assignment
async function cancelAssign(assignmentId, btn) {
  if (!confirm('Cancel this trainer assignment?')) return;

  btn.disabled    = true;
  btn.textContent = '…';

  try {
    var res  = await fetch(TRAINER_API + '/assignments/' + assignmentId, {
      method:  'DELETE',
      headers: authHeaders()
    });
    var data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Could not cancel assignment.');
      btn.disabled    = false;
      btn.textContent = 'Cancel';
      return;
    }

    loadAssignments();   // re-render both tables
  } catch (e) {
    alert('Could not connect to the server.');
    btn.disabled    = false;
    btn.textContent = 'Cancel';
  }
}

/* ═══════════════════════════════════════════════════
   USER STORY 4 — Track Trainer Hours
   PUT /api/trainers/assignments/:id/hours  (staff)
   GET /api/trainers/hours                  (staff — summary)
   ═══════════════════════════════════════════════════ */

// Render the per-assignment hours recording table
function renderHoursTable(assignments) {
  var tbody = document.getElementById('hours-body');
  if (!tbody) return;

  if (!assignments.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No assignment data yet.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  assignments.forEach(function (a) {
    var isCompleted  = a.status === 'completed';
    var isCancelled  = a.status === 'cancelled';
    var badgeClass   = a.status === 'assigned'  ? 'assigned'  :
                       a.status === 'completed' ? 'completed' : 'cancelled';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><strong>' + esc(a.trainer ? a.trainer.name : '—') + '</strong></td>' +
      '<td>' + esc(a.class ? a.class.name : '—') + '</td>' +
      '<td>' + (a.class ? fmtDate(a.class.date) : '—') + '</td>' +
      '<td><span class="status-badge ' + badgeClass + '">' + esc(a.status) + '</span></td>' +
      '<td>' +
        '<input type="number" class="hours-input" id="hours-' + a._id + '" ' +
               'value="' + (a.hoursWorked || 0) + '" min="0" max="24" step="0.5"' +
               ((isCompleted || isCancelled) ? ' disabled' : '') + '>' +
      '</td>' +
      '<td>' +
        (!isCompleted && !isCancelled
          ? '<button class="btn-save-hours" onclick="saveHours(\'' + a._id + '\')">Save</button>'
          : (isCompleted ? '<i class="fas fa-check-circle" style="color:#34d399" title="Completed"></i>' : '&#8212;')) +
      '</td>';
    tbody.appendChild(tr);
  });
}

// Save hours for one assignment
async function saveHours(assignmentId) {
  var input = document.getElementById('hours-' + assignmentId);
  var hours = parseFloat(input.value);

  if (isNaN(hours) || hours < 0) {
    alert('Please enter a valid number of hours (0 or more).');
    return;
  }

  input.disabled = true;
  var btn = input.closest('tr').querySelector('.btn-save-hours');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  try {
    var res  = await fetch(TRAINER_API + '/assignments/' + assignmentId + '/hours', {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify({ hoursWorked: hours })
    });
    var data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Could not save hours.');
      input.disabled  = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
      return;
    }

    // Refresh both tables and the summary to stay in sync
    loadAssignments();
    loadTrainerHours();

  } catch (e) {
    alert('Could not connect to the server.');
    input.disabled  = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
  }
}

// Load aggregate hours summary per trainer
async function loadTrainerHours() {
  var tbody = document.getElementById('summary-body');
  if (!tbody) return;

  try {
    var res  = await fetch(TRAINER_API + '/hours', { headers: authHeaders() });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Server error');

    var trainers = data.trainers || [];
    if (!trainers.length) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No hours recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    trainers.forEach(function (t) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td><strong>' + esc(t.trainerName || '—') + '</strong></td>' +
        '<td>' + esc(t.trainerEmail || '—') + '</td>' +
        '<td>' + (t.totalClasses || 0) + '</td>' +
        '<td><strong>' + (t.totalHours || 0) + ' hrs</strong></td>';
      tbody.appendChild(tr);
    });

  } catch (e) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Could not load summary.</td></tr>';
  }
}

/* ═══════════════════════════════════════════════════
   Init — runs on page load
   Shows role-appropriate tabs and loads data
   ═══════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', function () {
  var token = getToken();
  var user  = getUser();
  var role  = user.role || '';

  // If not logged in, show the auth wall and stop
  if (!token) {
    document.getElementById('auth-wall').classList.remove('hidden');
    return;
  }

  // Show main content and display user info
  document.getElementById('main-content').classList.remove('hidden');
  var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  document.getElementById('nav-user-info').textContent = user.name + ' — ' + roleLabel;

  var isStaff  = (role === 'staff' || role === 'admin');
  var isMember = (role === 'member');

  // Reveal role-appropriate tabs
  if (isMember) document.getElementById('tab-bookings').classList.remove('hidden');
  if (isStaff)  document.getElementById('tab-assign').classList.remove('hidden');
  if (isStaff)  document.getElementById('tab-hours').classList.remove('hidden');

  // Load class schedule — all roles see this
  loadClasses();

  // Member: pre-load my bookings so "Booked" buttons render correctly on the schedule
  if (isMember) loadMyClasses();

  // Staff / Admin: load trainer and assignment data
  if (isStaff) {
    loadTrainers();
    loadAssignments();
    loadTrainerHours();
  }
});
