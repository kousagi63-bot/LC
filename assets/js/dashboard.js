/* ============================================
   STACKLY — Dashboard Scripts
   Shared by Admin & User dashboards
   ============================================ */
(function () {
  'use strict';

  var body = document.body;

  /* --- Sidebar toggle (mobile) ---
     A hamburger button is injected into the top bar; on mobile it
     slides the off-canvas sidebar in/out. A close (X) button is
     placed inside the sidebar header so it's always reachable. */
  function initSidebar() {
    var sidebar = document.getElementById('dashSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!sidebar || !overlay) return;

    /* --- hamburger in top bar --- */
    var topbar = document.querySelector('.dash-topbar');
    var toggle = document.getElementById('sidebarToggle');
    if (!toggle && topbar) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'hamburger';
      toggle.id = 'sidebarToggle';
      toggle.setAttribute('aria-label', 'Toggle sidebar menu');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      topbar.insertBefore(toggle, topbar.firstChild);
    }

    /* --- close button inside sidebar (top-right) --- */
    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sidebar-close';
    closeBtn.setAttribute('aria-label', 'Close sidebar');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    sidebar.insertBefore(closeBtn, sidebar.querySelector('.sidebar-profile') || sidebar.firstChild);

    function close() {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
    function open() {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        if (window.innerWidth >= 992) return;
        sidebar.classList.contains('open') ? close() : open();
      });
    }
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.querySelectorAll('.sidebar-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth < 992) close();
      });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) close();
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
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
      if (el.closest('#uploadDocumentForm')) return true;
      if (el.closest('#makePaymentForm')) return true;
      if (el.closest('#supportForm')) return true;
      if (el.closest('#settingsSecurityForm')) return true;
      if (el.closest('#adminApptForm')) return true;
      if (el.closest('#addClientForm')) return true;
      if (el.closest('#addServiceForm')) return true;
      if (el.closest('#reportForm')) return true;
      if (el.closest('#adminSettingsForm')) return true;
      if (el.closest('#profileForm')) return true;
      if (el.id === 'sidebarToggle') return true;
      if (el.id === 'saveAccountBtn') return true;
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

  /* --- Admin Schedule Appointment: require Client, Counsel, Date
     & Time, then redirect only once every detail is filled. --- */
  function initAdminApptForm() {
    var form = document.getElementById('adminApptForm');
    if (!form) return;

    var requiredIds = ['adminApptClient', 'adminApptCounsel', 'adminApptDate', 'adminApptTime'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Admin Schedule Appointment: require Client, Counsel, Date
     & Time, then redirect only once every detail is filled. --- */
  function initAdminApptForm() {
    var form = document.getElementById('adminApptForm');
    if (!form) return;

    var requiredIds = ['adminApptClient', 'adminApptCounsel', 'adminApptDate', 'adminApptTime'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Admin Add Client: require Name, Email & Counsel, then
     redirect only once every detail is filled. --- */
  function initAddClientForm() {
    var form = document.getElementById('addClientForm');
    if (!form) return;

    var requiredIds = ['newClientName', 'newClientEmail', 'newClientCounsel'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Admin Add Client: require Name, Email & Counsel, then
     redirect only once every detail is filled. --- */
  function initAddClientForm() {
    var form = document.getElementById('addClientForm');
    if (!form) return;

    var requiredIds = ['newClientName', 'newClientEmail', 'newClientCounsel'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Admin Add Service: require Name, Category & Fee, then
     redirect only once every detail is filled. --- */
  function initAddServiceForm() {
    var form = document.getElementById('addServiceForm');
    if (!form) return;

    var requiredIds = ['serviceName', 'serviceCategory', 'serviceFee'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Admin Add Service: require Name, Category & Fee, then
     redirect only once every detail is filled. --- */
  function initAddServiceForm() {
    var form = document.getElementById('addServiceForm');
    if (!form) return;

    var requiredIds = ['serviceName', 'serviceCategory', 'serviceFee'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Admin Reports: require Start Date, End Date & Template,
     then redirect only once every detail is filled. --- */
  function initReportForm() {
    var form = document.getElementById('reportForm');
    if (!form) return;

    var requiredIds = ['reportStart', 'reportEnd', 'reportTemplate'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Profile: require all personal information fields, then
     redirect only once every detail is filled. --- */
  function initProfileForm() {
    var form = document.getElementById('profileForm');
    if (!form) return;

    var phone = document.getElementById('profilePhone');
    if (phone) {
      phone.addEventListener('keydown', function (e) {
        if (e.key.length === 1 && /[a-z]/i.test(e.key)) e.preventDefault();
      });
      phone.addEventListener('input', function () {
        phone.value = phone.value.replace(/[^0-9+()\-. ]/g, '');
      });
    }

    var requiredIds = ['profileName', 'profileEmail', 'profilePhone', 'profileCompany'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Admin Settings: require all firm profile fields, block letters in
     the phone box, then redirect only once every detail is filled. --- */
  function initAdminSettingsForm() {
    var form = document.getElementById('adminSettingsForm');
    if (!form) return;

    var phone = document.getElementById('firmPhone');
    if (phone) {
      phone.addEventListener('keydown', function (e) {
        if (e.key.length === 1 && /[a-z]/i.test(e.key)) e.preventDefault();
      });
      phone.addEventListener('input', function () {
        phone.value = phone.value.replace(/[^0-9+()\-. ]/g, '');
      });
    }

    var requiredIds = ['firmName', 'firmPhone', 'firmEmail', 'firmAddress'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Admin Save Account: require Name, Email & Password, then
     redirect only once every detail is filled. --- */
  function initSaveAccount() {
    var btn = document.getElementById('saveAccountBtn');
    if (!btn) return;

    var requiredIds = ['adminNameInput', 'adminEmailInput', 'adminPasswordInput'];

    btn.addEventListener('click', function (e) {
      var inputs = requiredIds.map(function (id) { return document.getElementById(id); });
      var firstInvalid = null;
      inputs.forEach(function (input) {
        var empty = !input || input.value.trim() === '';
        input.classList.toggle('is-invalid', empty);
        if (empty && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Update Password: require all three password fields, then
     redirect only once every detail is filled. --- */
  function initSettingsSecurityForm() {
    var form = document.getElementById('settingsSecurityForm');
    if (!form) return;

    var requiredIds = ['currentPassword', 'newPassword', 'confirmPassword'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Submit a Request: require Topic & Message, then
     redirect only once every detail is filled. --- */
  function initSupportForm() {
    var form = document.getElementById('supportForm');
    if (!form) return;

    var requiredIds = ['supportTopic', 'supportMessage'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Make a Payment: require Amount, Method & Invoice, then
     redirect only once every detail is filled. --- */
  function initMakePaymentForm() {
    var form = document.getElementById('makePaymentForm');
    if (!form) return;

    var requiredIds = ['payAmount', 'payMethod', 'payInvoice'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
  }

  /* --- Upload a Document: require File, Title & Matter, then
     redirect only once every detail is filled. --- */
  function initUploadDocumentForm() {
    var form = document.getElementById('uploadDocumentForm');
    if (!form) return;

    var requiredIds = ['docFile', 'docTitle', 'docMatter'];

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
        firstInvalid.focus();
        return;
      }

      window.location.href = '404.html';
    });
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
    initUploadDocumentForm();
    initMakePaymentForm();
    initSupportForm();
    initSettingsSecurityForm();
    initAdminApptForm();
    initAddClientForm();
    initAddServiceForm();
    initReportForm();
    initAdminSettingsForm();
    initProfileForm();
    initSaveAccount();
    initTestNavGuard();
  });
})();
