/* ============================================
   STACKLY — Auth JavaScript
   Login & Sign Up validation, password toggles,
   role selection, and role-based redirects.
   ============================================ */
(function () {
  'use strict';

  var stacklyAuth = window.stacklyAuth = window.stacklyAuth || {};

  var PATTERNS = {
    name: /^[A-Za-z\s]+$/,
    email: /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*\.[A-Za-z]{2,}$/,
    phone: /^\d{10}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/
  };

  function $id(id) { return document.getElementById(id); }
  function $sel(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* --- Session helpers (role-based dashboard access) --- */
  stacklyAuth.setSession = function (role, user) {
    try {
      localStorage.setItem('stackly_role', role || 'user');
      localStorage.setItem('stackly_user', JSON.stringify(user || {}));
    } catch (e) { /* storage unavailable */ }
  };

  stacklyAuth.getRole = function () {
    try { return localStorage.getItem('stackly_role'); } catch (e) { return null; }
  };

  stacklyAuth.clearSession = function () {
    try {
      localStorage.removeItem('stackly_role');
      localStorage.removeItem('stackly_user');
    } catch (e) { /* storage unavailable */ }
  };

  stacklyAuth.dashboardFor = function (role) {
    return role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
  };

  /* Derive a display name from the login email (the only identity entered at
     sign-in). E.g. jane.doe@example.com -> "Jane Doe". No hardcoded names. */
  stacklyAuth.nameFromEmail = function (email) {
    var local = String(email || '').split('@')[0] || '';
    var parts = local.replace(/[._\-]+/g, ' ').split(' ').filter(Boolean);
    var name = parts.map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join(' ');
    return name || local;
  };

  /* --- Password visibility toggle --- */
  function initPasswordToggles() {
    $all('[data-toggle-password]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = $id(btn.getAttribute('data-toggle-password'));
        if (!input) return;
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        var icon = btn.querySelector('i');
        if (icon) icon.className = show ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        input.focus();
      });
    });
  }

  /* --- Field / role / terms state helpers --- */
  function setFieldState(fieldEl, error) {
    fieldEl.classList.toggle('invalid', !!error);
    fieldEl.classList.toggle('valid', !error);
    var errEl = $sel('.auth-error', fieldEl);
    if (errEl) errEl.textContent = error || '';
    var input = $sel('input, textarea, select', fieldEl);
    if (input) input.setAttribute('aria-invalid', error ? 'true' : 'false');
    return !error;
  }

  function setRoleState(fieldsetEl, error) {
    fieldsetEl.classList.toggle('invalid', !!error);
    var errEl = $sel('.auth-error', fieldsetEl);
    if (errEl) errEl.textContent = error || '';
    return !error;
  }

  function shakeField(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', function h() {
      el.classList.remove('shake');
      el.removeEventListener('animationend', h);
    });
  }

  /* --- Alerts --- */
  function showAlert(el, type, message) {
    if (!el) return;
    el.className = 'auth-alert show ' + type;
    var icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    el.innerHTML = '<i class="fa-solid ' + icon + '"></i><span></span>';
    $sel('span', el).textContent = message;
  }
  function hideAlert(el) { if (el) { el.className = 'auth-alert'; el.textContent = ''; } }

  /* --- Password strength meter --- */
  function passwordStrength(pw) {
    var score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }
  var STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  function updateStrength(meter, input) {
    if (!meter) return;
    var score = passwordStrength(input.value);
    if (!input.value) { meter.classList.remove('show'); return; }
    meter.classList.add('show');
    meter.setAttribute('data-level', String(score));
    $all('.bar', meter).forEach(function (bar, i) { bar.classList.toggle('on', i < score); });
    var label = $sel('.password-strength-label', meter);
    if (label) label.textContent = 'Password strength: ' + STRENGTH_LABELS[score];
  }

  /* --- Single-field validation --- */
  function validateField(input) {
    var fieldEl = input.closest('.auth-field');
    if (!fieldEl) return true;
    var rule = fieldEl.getAttribute('data-rule');
    var value = input.value.trim();
    var error = '';

    if (rule === 'name') {
      if (!value) error = 'Full name is required.';
      else if (!PATTERNS.name.test(value)) error = 'Name may only contain letters and spaces.';
    } else if (rule === 'email') {
      if (!value) error = 'Email address is required.';
      else if (!PATTERNS.email.test(value)) error = 'Please enter a valid email address using only letters, numbers, dots, and the @ symbol (e.g. abc@gmail.com).';
    } else if (rule === 'phone') {
      if (!value) error = 'Phone number is required.';
      else if (!PATTERNS.phone.test(value)) error = 'Phone number must be exactly 10 digits.';
    } else if (rule === 'password') {
      if (!value) error = 'Password is required.';
      else if (!PATTERNS.password.test(value)) error = 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.';
    } else if (rule === 'confirm') {
      var passwordField = $id(input.getAttribute('data-match'));
      if (!value) error = 'Please confirm your password.';
      else if (passwordField && value !== passwordField.value) error = 'Passwords do not match.';
    }
    return setFieldState(fieldEl, error);
  }

  function validateRole(fieldsetEl) {
    var checked = fieldsetEl.querySelector('input[type="radio"]:checked');
    return setRoleState(fieldsetEl, checked ? '' : 'Please select a role to continue.');
  }

  /* --- Bind live validation for a field --- */
  function bindFieldValidation(input) {
    input.addEventListener('blur', function () { validateField(input); });
    input.addEventListener('input', function () {
      var fieldEl = input.closest('.auth-field');
      if (fieldEl && fieldEl.classList.contains('invalid')) validateField(input);
    });
  }

  /* --- Preselect role from ?role= query param --- */
  function applyRoleParam(fieldsetId, prefix) {
    var params = new URLSearchParams(window.location.search);
    var role = params.get('role');
    if (role !== 'admin' && role !== 'user') return;
    var radio = $id(prefix + (role === 'admin' ? 'RoleAdmin' : 'RoleUser'));
    if (radio) radio.checked = true;
    var fieldset = $id(fieldsetId);
    if (fieldset) setRoleState(fieldset, '');
  }

  /* ============================================
     LOGIN
     ============================================ */
  function initLogin() {
    var form = $id('loginForm');
    if (!form) return;

    var alertEl = $id('loginAlert');
    var roleFieldset = $id('loginRoleFieldset');
    var emailInput = $id('loginEmail');
    var passwordInput = $id('loginPassword');
    var rememberInput = $id('rememberMe');
    var rememberWrap = $id('rememberWrap');
    var rememberError = $id('rememberError');
    var submitBtn = $id('loginSubmit');

    applyRoleParam('loginRoleFieldset', 'login');

    function setRememberState(valid) {
      if (rememberInput) rememberInput.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (rememberWrap) rememberWrap.classList.toggle('invalid', !valid);
      if (rememberError) {
        rememberError.textContent = valid ? '' : 'Please select Remember Me to sign in.';
        rememberError.classList.toggle('show', !valid);
      }
    }

    bindFieldValidation(emailInput);
    bindFieldValidation(passwordInput);

    roleFieldset.addEventListener('change', function () {
      if (roleFieldset.querySelector('input:checked')) setRoleState(roleFieldset, '');
    });

    rememberInput.addEventListener('change', function () {
      if (rememberInput.checked) setRememberState(true);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert(alertEl);

      var validRole = validateRole(roleFieldset);
      var validEmail = validateField(emailInput);
      var validPass = validateField(passwordInput);

      if (!validRole || !validEmail || !validPass) {
        [roleFieldset, emailInput.closest('.auth-field'), passwordInput.closest('.auth-field')].forEach(function (el) {
          if (el.classList.contains('invalid')) shakeField(el);
        });
        var firstInvalid = form.querySelector('.role-fieldset.invalid, .auth-field.invalid');
        var focusTarget = firstInvalid ? firstInvalid.querySelector('input') : null;
        if (focusTarget) focusTarget.focus();
        showAlert(alertEl, 'error', 'Please fix the highlighted fields and try again.');
        return;
      }

      if (!rememberInput.checked) {
        setRememberState(false);
        if (rememberWrap) shakeField(rememberWrap);
        rememberInput.focus();
        showAlert(alertEl, 'error', 'Please select Remember Me to sign in.');
        return;
      }

      var selectedRole = roleFieldset.querySelector('input[type="radio"]:checked').value;

      try {
        if (rememberInput.checked) localStorage.setItem('stackly_remember_email', emailInput.value.trim());
        else localStorage.removeItem('stackly_remember_email');
      } catch (err) { /* storage unavailable */ }

      submitBtn.classList.add('loading');
      setTimeout(function () {
        submitBtn.classList.remove('loading');
        var email = emailInput.value.trim();
        stacklyAuth.setSession(selectedRole, { name: stacklyAuth.nameFromEmail(email), email: email, role: selectedRole });
        showAlert(alertEl, 'success', 'Sign in successful. Redirecting to your dashboard\u2026');
        setTimeout(function () { window.location.href = stacklyAuth.dashboardFor(selectedRole); }, 900);
      }, 1200);
    });
  }

  /* ============================================
     SIGN UP
     ============================================ */
  function initSignup() {
    var form = $id('signupForm');
    if (!form) return;

    var alertEl = $id('signupAlert');
    var roleFieldset = $id('signupRoleFieldset');
    var fields = {
      name: $id('signupName'),
      email: $id('signupEmail'),
      phone: $id('signupPhone'),
      password: $id('signupPassword'),
      confirm: $id('signupConfirm')
    };
    var strengthMeter = $id('passwordStrength');
    var termsWrap = $id('termsWrapper');
    var termsCheck = $id('termsCheck');
    var submitBtn = $id('signupSubmit');

    applyRoleParam('signupRoleFieldset', 'signup');

    Object.keys(fields).forEach(function (key) {
      var input = fields[key];
      bindFieldValidation(input);
      if (key === 'password') {
        input.addEventListener('input', function () {
          updateStrength(strengthMeter, input);
          if (fields.confirm.value) validateField(fields.confirm);
        });
      }
    });

    roleFieldset.addEventListener('change', function () {
      if (roleFieldset.querySelector('input:checked')) setRoleState(roleFieldset, '');
    });

    termsCheck.addEventListener('change', function () {
      termsWrap.classList.remove('invalid');
      var errEl = $sel('.auth-error', termsWrap);
      if (errEl) errEl.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideAlert(alertEl);

      var checks = [
        validateRole(roleFieldset),
        validateField(fields.name),
        validateField(fields.email),
        validateField(fields.phone),
        validateField(fields.password),
        validateField(fields.confirm)
      ];
      updateStrength(strengthMeter, fields.password);

      var termsValid = !termsCheck.checked;
      termsWrap.classList.toggle('invalid', termsValid);
      var termsErr = $sel('.auth-error', termsWrap);
      if (termsErr) termsErr.textContent = termsValid ? 'Please accept the Terms & Conditions to continue.' : '';

      if (checks.indexOf(false) !== -1 || termsValid) {
        [roleFieldset, fields.name.closest('.auth-field'), fields.email.closest('.auth-field'),
         fields.phone.closest('.auth-field'), fields.password.closest('.auth-field'),
         fields.confirm.closest('.auth-field')].forEach(function (el) {
          if (el.classList.contains('invalid')) shakeField(el);
        });
        var firstInvalid = form.querySelector('.role-fieldset.invalid, .auth-field.invalid, .auth-terms.invalid');
        var focusTarget = firstInvalid ? firstInvalid.querySelector('input') : null;
        if (focusTarget) focusTarget.focus();
        showAlert(alertEl, 'error', 'Please fix the highlighted fields and try again.');
        return;
      }

      var selectedRole = roleFieldset.querySelector('input[type="radio"]:checked').value;

      submitBtn.classList.add('loading');
      setTimeout(function () {
        submitBtn.classList.remove('loading');
        var user = {
          name: fields.name.value.trim(),
          email: fields.email.value.trim(),
          phone: fields.phone.value.trim(),
          role: selectedRole
        };
        stacklyAuth.setSession(selectedRole, user);
        showAlert(alertEl, 'success', 'Account created successfully. Redirecting to your dashboard\u2026');
        setTimeout(function () { window.location.href = stacklyAuth.dashboardFor(selectedRole); }, 900);
      }, 1300);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPasswordToggles();
    initLogin();
    initSignup();
  });
})();
