/* ============================================
   STACKLY — Dashboard Scripts
   Shared by Admin & User dashboards
   ============================================ */
(function () {
  'use strict';

  var body = document.body;

  /* --- Sidebar toggle (mobile) ---
     The top bar no longer has a hamburger, so the page title toggles the
     off-canvas sidebar on tablets and phones. */
  function initSidebar() {
    var toggle = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('dashSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;

    if (!toggle) toggle = document.querySelector('.dash-topbar .topbar-title');
    if (!toggle) return;

    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
    }
    function open() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function () {
      if (window.innerWidth >= 992) return;
      sidebar.classList.contains('open') ? close() : open();
    });
    overlay.addEventListener('click', close);
    document.querySelectorAll('.sidebar-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth < 992) close();
      });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) close();
    });
  }

  /* --- Dropdown panels (notifications / profile) --- */
  function initDropdowns() {
    var toggles = document.querySelectorAll('[data-dropdown-toggle]');
    toggles.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var parent = btn.closest('.dash-dropdown');
        var isOpen = parent.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) parent.classList.add('open');
      });
    });
    document.addEventListener('click', closeAllDropdowns);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllDropdowns();
    });
  }
  function closeAllDropdowns() {
    document.querySelectorAll('.dash-dropdown.open').forEach(function (d) {
      d.classList.remove('open');
    });
  }

  /* --- Animated counters --- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    function animate(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var duration = 1200;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var value = Math.round(target * eased);
        el.textContent = prefix + value.toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { io.observe(c); });
    } else {
      counters.forEach(animate);
    }
  }

  /* --- Table search filter --- */
  function initTableSearch() {
    document.querySelectorAll('[data-table-search]').forEach(function (input) {
      input.addEventListener('input', function () {
        var tableId = input.getAttribute('data-table-search');
        var table = document.getElementById(tableId);
        if (!table) return;
        var q = input.value.trim().toLowerCase();
        var rows = table.querySelectorAll('tbody tr');
        var visible = 0;
        rows.forEach(function (row) {
          var match = row.textContent.toLowerCase().indexOf(q) !== -1;
          row.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        var empty = table.parentElement.querySelector('.table-empty-row');
        if (empty) empty.style.display = visible === 0 ? '' : 'none';
        window.dispatchEvent(new CustomEvent('table:filter'));
      });
    });

    document.querySelectorAll('[data-filter-col]').forEach(function (select) {
      select.addEventListener('change', function () {
        var tableId = select.getAttribute('data-table-search');
        var table = tableId ? document.getElementById(tableId) : null;
        if (!table) table = document.querySelector('.dash-table');
        if (!table) return;
        var col = parseInt(select.getAttribute('data-filter-col'), 10);
        var value = select.value.trim().toLowerCase();
        var q = (document.querySelector('[data-table-search="' + table.id + '"]') || { value: '' }).value.trim().toLowerCase();
        table.querySelectorAll('tbody tr').forEach(function (row) {
          var matchCell = value ? (row.cells[col] || {}).textContent.trim().toLowerCase() === value : true;
          var matchSearch = q ? row.textContent.toLowerCase().indexOf(q) !== -1 : true;
          row.style.display = (matchCell && matchSearch) ? '' : 'none';
        });
        window.dispatchEvent(new CustomEvent('table:filter'));
      });
    });
  }

  /* --- Simple pagination --- */
  function initPagination() {
    document.querySelectorAll('[data-pagination]').forEach(function (wrap) {
      var tableId = wrap.getAttribute('data-pagination');
      var table = document.getElementById(tableId);
      var info = wrap.querySelector('.info');
      var prev = wrap.querySelector('[data-page="prev"]');
      var next = wrap.querySelector('[data-page="next"]');
      var pages = wrap.querySelector('.pages');
      if (!table) return;

      var perPage = parseInt(wrap.getAttribute('data-per-page') || '5', 10);
      var current = 1;

      function getRows() {
        return Array.prototype.slice.call(table.querySelectorAll('tbody tr'))
          .filter(function (r) { return r.style.display !== 'none'; });
      }
      function render() {
        var rows = getRows();
        var total = rows.length;
        var totalPages = Math.max(1, Math.ceil(total / perPage));
        if (current > totalPages) current = totalPages;
        rows.forEach(function (r, i) {
          r.style.display = (i >= (current - 1) * perPage && i < current * perPage) ? '' : 'none';
        });
        if (info) {
          var from = total === 0 ? 0 : (current - 1) * perPage + 1;
          var to = Math.min(current * perPage, total);
          info.textContent = 'Showing ' + from + '\u2013' + to + ' of ' + total;
        }
        if (prev) prev.disabled = current <= 1;
        if (next) next.disabled = current >= totalPages;
        if (pages) {
          pages.innerHTML = '';
          for (var i = 1; i <= totalPages; i++) {
            (function (n) {
              var b = document.createElement('button');
              b.className = 'page-btn' + (n === current ? ' active' : '');
              b.textContent = n;
              b.setAttribute('aria-label', 'Page ' + n);
              b.addEventListener('click', function () { current = n; render(); });
              pages.appendChild(b);
            })(i);
          }
        }
      }
      if (prev) prev.addEventListener('click', function () { if (current > 1) { current--; render(); } });
      if (next) next.addEventListener('click', function () { current++; render(); });
      render();

      window.addEventListener('table:filter', function () {
        var rows = getRows();
        var totalPages = Math.max(1, Math.ceil(rows.length / perPage));
        if (current > totalPages) current = totalPages;
        render();
      });
    });
  }

  /* --- Logged-in user display (name from login session) --- */
  function initUserDisplay() {
    var user = null;
    try {
      var raw = localStorage.getItem('stackly_user');
      if (raw) user = JSON.parse(raw);
    } catch (e) { /* storage unavailable */ }
    if (!user) return;

    var name = typeof user.name === 'string' ? user.name.trim() : '';
    if (!name) return;
    var firstName = name.split(/\s+/)[0];
    var email = typeof user.email === 'string' ? user.email.trim() : '';
    var roleLabel = user.role === 'admin' ? 'Firm Administrator' : 'Client';
    var initials = name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();

    document.querySelectorAll('[data-user-name]').forEach(function (el) {
      el.textContent = name;
    });
    document.querySelectorAll('[data-user-firstname]').forEach(function (el) {
      el.textContent = firstName;
    });
    document.querySelectorAll('[data-user-email]').forEach(function (el) {
      el.textContent = email;
    });
    document.querySelectorAll('[data-user-role]').forEach(function (el) {
      el.textContent = roleLabel;
    });
    document.querySelectorAll('[data-user-initials]').forEach(function (el) {
      el.textContent = initials;
    });
    document.querySelectorAll('[data-user-first-initial]').forEach(function (el) {
      el.textContent = name.charAt(0).toUpperCase();
    });
    document.querySelectorAll('[data-user-name-input]').forEach(function (el) {
      el.value = name;
    });
    document.querySelectorAll('[data-user-email-input]').forEach(function (el) {
      el.value = email;
    });
    document.querySelectorAll('[data-user-avatar]').forEach(function (el) {
      el.setAttribute('alt', name);
    });
  }

  /* --- Sign Out: clear the session immediately, then navigate straight to
     the Login page using location.replace() so the dashboard is removed from
     browser history and cannot be revisited with the Back button. --- */
  function initSignOut() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('a[href="login.html"], a[href="logout.html"]');
      if (!el) return;
      e.preventDefault();
      if (window.stacklyAuth && window.stacklyAuth.clearSession) window.stacklyAuth.clearSession();
      window.location.replace('login.html');
    }, true);
  }

  /* --- BFCache guard: browsers restore cached pages on Back without firing
     DOMContentLoaded, so re-check the session when a cached dashboard is shown
     and bounce signed-out users to the login page. --- */
  function initSessionGuard() {
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) {
        try {
          if (!localStorage.getItem('stackly_role')) window.location.replace('login.html');
        } catch (err) { /* storage unavailable */ }
      }
    });
  }

  /* --- Testing guard: only the main sidebar + notification UI keep working ---
     Every other clickable element (links, buttons, cards, icons, actions)
     redirects to the 404 error page for testing. */
  function initTestNavGuard() {
    var sidebar = document.getElementById('dashSidebar');
    var notifPage = /user-notifications\.html$/.test(window.location.pathname);

    var SELECTOR = 'a, button, [role="button"], .quick-action, .stat-card, .appt-item, .activity-item, .notif-item';

    function isAllowed(el) {
      if (el.matches('a[href="login.html"], a[href="logout.html"]')) return true;
      if (el.matches('[data-dropdown-toggle]')) return true;
      if (el.closest('#appointmentRequestForm')) return true;
      if (sidebar && sidebar.contains(el)) return true;
      if (el.closest('.dash-dropdown')) return true;
      if (notifPage && (el.closest('#notifChips') || el.closest('#notifList'))) return true;
      return false;
    }

    document.addEventListener('click', function (e) {
      var el = e.target.closest(SELECTOR);
      if (!el || isAllowed(el)) return;
      e.preventDefault();
      e.stopPropagation();
      window.location.href = '404.html';
    }, true);
  }

  /* --- Book an Appointment: require Service, Date & Time, then
     add the request to the appointments history table. --- */
  function initAppointmentForm() {
    var form = document.getElementById('appointmentRequestForm');
    if (!form) return;

    var requiredIds = ['apptService', 'apptCounsel', 'apptDate', 'apptTime', 'apptNotes'];
    var msg = form.querySelector('.appointment-message');

    form.addEventListener('submit', function (e) {
      var inputs = requiredIds.map(function (id) { return document.getElementById(id); });
      var firstInvalid = null;
      inputs.forEach(function (input) {
        var empty = !input || input.value.trim() === '';
        input.classList.toggle('is-invalid', empty);
        if (empty && !firstInvalid) firstInvalid = input;
      });

      e.preventDefault();

      if (firstInvalid) {
        if (msg) msg.hidden = true;
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    /* --- Session guard: dashboards require a stored role --- */
    try {
      if (!localStorage.getItem('stackly_role')) {
        window.location.replace('login.html');
        return;
      }
    } catch (e) { /* storage unavailable — allow access */ }

    initSidebar();
    initDropdowns();
    initCounters();
    initTableSearch();
    initPagination();
    initUserDisplay();
    initSignOut();
    initSessionGuard();
    initAppointmentForm();
    initTestNavGuard();
  });
})();
