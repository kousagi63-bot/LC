/* ============================================
   STACKLY — Shared Email Validation
   Consistent email rules across the entire site.
   Allowed: letters (A-Z, a-z), numbers (0-9),
   dots (.) and @ only. Format: username@domain.extension
   ============================================ */
(function () {
  'use strict';

  var EMAIL_PATTERN = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*\.[A-Za-z]{2,}$/;

  var EMAIL_REQUIRED_MSG = 'Please enter your email address.';
  var EMAIL_INVALID_MSG = 'Please enter a valid email address using only letters, numbers, dots, and the @ symbol (e.g. abc@gmail.com).';

  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  window.stacklyEmailPattern = EMAIL_PATTERN;

  /* Returns an error message string, or '' when the value is valid. */
  window.stacklyValidateEmail = function (value) {
    var v = (value || '').trim();
    if (!v) return EMAIL_REQUIRED_MSG;
    if (!EMAIL_PATTERN.test(v)) return EMAIL_INVALID_MSG;
    return '';
  };

  /* Returns true when the input holds a valid email, showing/clearing the inline error. */
  window.stacklyCheckEmailInput = function (input) {
    if (!input) return true;
    var error = window.stacklyValidateEmail(input.value);
    var errEl = input.parentNode ? input.parentNode.querySelector('.stackly-email-error') : null;

    if (error) {
      input.classList.add('stackly-email-invalid');
      input.setAttribute('aria-invalid', 'true');
      if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'stackly-email-error';
        if (input.parentNode) input.parentNode.appendChild(errEl);
      }
      errEl.textContent = error;
      errEl.classList.add('show');
      return false;
    }

    input.classList.remove('stackly-email-invalid');
    input.removeAttribute('aria-invalid');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.remove('show');
    }
    return true;
  };

  /* Validates every email field inside a form. Returns true when all are valid. */
  window.stacklyValidateForm = function (form) {
    var valid = true;
    var firstInvalid = null;
    $all('input[type="email"]', form).forEach(function (input) {
      if (input.closest('.auth-field') || input.closest('.newsletter-form')) return;
      if (!window.stacklyCheckEmailInput(input)) {
        valid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });
    if (firstInvalid) firstInvalid.focus();
    return valid;
  };

  document.addEventListener('DOMContentLoaded', function () {
    $all('input[type="email"]').forEach(function (input) {
      /* Handled by auth.js / main.js rich validation on these forms */
      if (input.closest('.auth-field') || input.closest('.newsletter-form')) return;

      input.addEventListener('blur', function () { window.stacklyCheckEmailInput(input); });
      input.addEventListener('input', function () {
        if (input.classList.contains('stackly-email-invalid')) window.stacklyCheckEmailInput(input);
      });

      var form = input.closest('form');
      if (form && !form.dataset.stacklyEmailBound) {
        form.dataset.stacklyEmailBound = '1';
        form.addEventListener('submit', function (e) {
          if (!window.stacklyValidateForm(form)) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        });
      }
    });
  });
})();
