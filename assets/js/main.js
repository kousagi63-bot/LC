/* ============================================
   STACKLY — Theme JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // ----- Reduced motion / missing AOS: never leave content hidden -----
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || typeof window.AOS === 'undefined') {
    document.querySelectorAll('[data-aos]').forEach(function (el) {
      el.removeAttribute('data-aos');
      el.removeAttribute('data-aos-delay');
      el.removeAttribute('data-aos-duration');
    });
  }

  // ----- Footer links: Quick Links redirect to concern pages, other links redirect to 404 -----
  var footerLinks = document.querySelectorAll('.footer a');
  footerLinks.forEach(function (el) {
    var quickCol = el.closest('.footer-quick-links');
    if (!quickCol) {
      var col = el.closest('.col-sm-6, .col-lg, div');
      var heading = col ? col.querySelector('h6') : null;
      if (heading && heading.textContent.trim().toLowerCase() === 'quick links') {
        quickCol = col;
      }
    }

    if (quickCol) {
      // Direct Quick Links to their respective concern pages
      var text = el.textContent.trim().toLowerCase();
      if (text.includes('home')) el.setAttribute('href', 'index.html');
      else if (text.includes('about')) el.setAttribute('href', 'about.html');
      else if (text.includes('blog') || text.includes('insight')) el.setAttribute('href', 'insights.html');
      else if (text.includes('service') || text.includes('practice')) el.setAttribute('href', 'practice-areas.html');
      else if (text.includes('contact')) el.setAttribute('href', 'contact.html');
      return;
    }

    // Other footer links redirect to 404
    el.setAttribute('href', '404.html');
  });

  // ----- Mobile Full-Screen Menu Toggler & Scroll Lock -----
  var navMenu = document.getElementById('navMenu');
  var navToggler = document.querySelector('.navbar-toggler');
  var togglerIcon = navToggler ? navToggler.querySelector('i') : null;

  if (navMenu && navToggler) {
    navMenu.addEventListener('show.bs.collapse', function () {
      document.body.classList.add('mobile-nav-open');
      if (togglerIcon) {
        togglerIcon.classList.remove('fa-bars');
        togglerIcon.classList.add('fa-xmark');
      }
    });

    navMenu.addEventListener('hide.bs.collapse', function () {
      document.body.classList.remove('mobile-nav-open');
      if (togglerIcon) {
        togglerIcon.classList.remove('fa-xmark');
        togglerIcon.classList.add('fa-bars');
      }
    });

    // Close mobile full-screen menu when clicking any link
    navMenu.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth < 992 && navMenu.classList.contains('show')) {
          var bsCollapse = bootstrap.Collapse.getInstance(navMenu);
          if (bsCollapse) {
            bsCollapse.hide();
          } else {
            navMenu.classList.remove('show');
            document.body.classList.remove('mobile-nav-open');
            if (togglerIcon) {
              togglerIcon.classList.remove('fa-xmark');
              togglerIcon.classList.add('fa-bars');
            }
          }
        }
      });
    });

    // Clean up when resizing back to desktop viewport
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) {
        document.body.classList.remove('mobile-nav-open');
        if (navMenu.classList.contains('show')) {
          var bsCollapse = bootstrap.Collapse.getInstance(navMenu);
          if (bsCollapse) bsCollapse.hide();
          else navMenu.classList.remove('show');
        }
        if (togglerIcon) {
          togglerIcon.classList.remove('fa-xmark');
          togglerIcon.classList.add('fa-bars');
        }
      }
    });
  }

  // ----- Navbar scroll effect -----
  var nav = document.getElementById('mainNav');
  var backToTop = document.getElementById('backToTop');

  function updateNav() {
    var scrollY = window.scrollY;
    if (nav) {
      if (scrollY > 60) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    }
    if (backToTop) {
      if (scrollY > 500) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // ----- Back to top -----
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ----- Active nav link (single-page sections) -----
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  if (sections.length && navLinks.length) {
    function updateActiveLink() {
      var current = '';
      var scrollPos = window.scrollY + 150;
      sections.forEach(function (sec) {
        var top = sec.offsetTop;
        var bottom = top + sec.offsetHeight;
        if (scrollPos >= top && scrollPos < bottom) {
          current = sec.getAttribute('id');
        }
      });
      navLinks.forEach(function (link) {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
          link.classList.add('active');
        }
      });
    }
    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();
  }

  // ----- GSAP animations -----
  if (!reducedMotion && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // ----- SplitType letter-by-letter heading animations (Desktop viewports only to avoid mobile word collision) -----
    if (typeof SplitType !== 'undefined' && window.innerWidth >= 992) {
      var splitHeadings = [];
      document.querySelectorAll('h1, h2').forEach(function (h) {
        if (h.closest('.accordion-header') || h.closest('nav') || h.closest('footer') || h.classList.contains('hero-animated-heading')) return;
        splitHeadings.push(h);
      });
      splitHeadings.forEach(function (heading) {
        var splitText = new SplitType(heading, { types: 'chars,words', tagName: 'span' });
        var chars = splitText.chars;
        if (!chars || !chars.length) return;
        gsap.set(chars, { opacity: 0, y: 24 });
        gsap.to(chars, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: 'power3.out',
          stagger: { each: 0.02, from: 'start' },
          scrollTrigger: { trigger: heading, start: 'top 88%', toggleActions: 'play none none none' }
        });
      });
    }

    // Hero timeline
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl.to('.hero-bg', { scale: 1, duration: 1.6, ease: 'power2.out' });

    // Homepage hero only
    var heroSection = document.querySelector('.hero');
    if (heroSection) {
      // Hero parallax
      gsap.to('.hero-bg', {
        y: '12%', ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
      });
    }

    // Counter animation
    var counters = document.querySelectorAll('[data-count]');
    counters.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      gsap.fromTo(el,
        { textContent: 0 },
        {
          textContent: target, duration: 2.5, ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Resize handler
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 300);
    });
  }

  // ----- AOS scroll animations -----
  if (!reducedMotion && typeof AOS !== 'undefined') {
    AOS.init({
      once: true,
      duration: 900,
      easing: 'ease-out-cubic',
      offset: 70,
      delay: 0
    });
  }

  // ----- Hero background video loop (hero01 -> hero02 -> repeat) -----
  var heroVideo01 = document.getElementById('heroVideo01');
  var heroVideo02 = document.getElementById('heroVideo02');

  if (heroVideo01 && heroVideo02) {
    var FADE_S = 0.9;
    var LEAD_S = 0.4;
    var heroVideos = [heroVideo01, heroVideo02];
    var heroIdx = 0;
    var heroSwitching = false;

    function showHeroVideo(nextIdx) {
      if (heroSwitching) return;
      heroSwitching = true;
      var cur = heroVideos[heroIdx];
      var nxt = heroVideos[nextIdx];
      // Replay the outgoing video muted so it is warm for the next cycle
      cur.currentTime = 0;
      cur.play().catch(function () {});
      nxt.currentTime = 0;
      nxt.play().catch(function () {});
      cur.classList.remove('active');
      nxt.classList.add('active');
      heroIdx = nextIdx;
      setTimeout(function () { heroSwitching = false; }, (FADE_S + 0.15) * 1000);
    }

    heroVideos.forEach(function (video) {
      video.addEventListener('timeupdate', function () {
        if (video === heroVideos[heroIdx] && !heroSwitching &&
            video.currentTime > 0 && video.duration &&
            (video.duration - video.currentTime) < LEAD_S) {
          showHeroVideo((heroIdx + 1) % heroVideos.length);
        }
      });
      video.addEventListener('ended', function () {
        if (video === heroVideos[heroIdx]) {
          showHeroVideo((heroIdx + 1) % heroVideos.length);
        }
      });
    });

    function ensureHeroPlaying() {
      heroVideo01.classList.add('active');
      var p = heroVideo01.play();
      if (p) p.catch(function () {});
    }

    // Start immediately on load; retry as data becomes available so the
    // first frame shows as soon as the browser has it (no placeholder).
    // heroVideo02 stays quiet until showHeroVideo starts it at switch time,
    // so heroVideo01 gets full bandwidth priority for its first frame.
    ensureHeroPlaying();
    heroVideo01.addEventListener('canplay', ensureHeroPlaying);
  }

  // ----- All Subscribe (Newsletter) Forms -----
  // Validates email; redirects to 404.html ONLY when details are filled and valid.
  var newsletterForms = document.querySelectorAll('.newsletter-form');
  newsletterForms.forEach(function (form) {
    var input = form.querySelector('input[type="email"], .newsletter-input');
    var msg = form.querySelector('.newsletter-message') || form.closest('section, .container, body').querySelector('#newsletterMessage, #insightsNewsletterMsg');
    var emailPattern = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*\.[A-Za-z]{2,}$/;

    if (input) {
      input.addEventListener('input', function () {
        input.classList.remove('error', 'field-error');
        if (msg) {
          msg.className = 'newsletter-message';
          msg.textContent = '';
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = input ? input.value.trim() : '';

      if (input) input.classList.remove('error', 'field-error');
      if (msg) {
        msg.className = 'newsletter-message';
        msg.textContent = '';
      }

      if (!email) {
        if (input) {
          input.classList.add('error', 'field-error');
          input.focus();
        }
        if (msg) {
          msg.className = 'newsletter-message error';
          msg.textContent = 'Please enter your email address.';
        }
        return;
      }

      if (!emailPattern.test(email)) {
        if (input) {
          input.classList.add('error', 'field-error');
          input.focus();
        }
        if (msg) {
          msg.className = 'newsletter-message error';
          msg.textContent = 'Please enter a valid email address using only letters, numbers, dots, and the @ symbol (e.g. abc@gmail.com).';
        }
        return;
      }

      // Details are fully filled and valid -> redirect to 404
      window.location.href = '404.html';
    });
  });

  // ----- All "Send Message" & Application Forms -----
  // Validates all required inputs; redirects to 404.html ONLY when all details are filled and valid.
  var contactForms = document.querySelectorAll('.contact-form, #supportForm');
  contactForms.forEach(function (form) {
    var msg = form.querySelector('.newsletter-message') || form.querySelector('#contactMessage') || form.querySelector('#applyMessage');
    var emailPattern = /^[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(?:\.[A-Za-z0-9]+)*\.[A-Za-z]{2,}$/;

    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        el.classList.remove('field-error', 'is-invalid', 'error', 'stackly-email-invalid');
      });
      el.addEventListener('change', function () {
        el.classList.remove('field-error', 'is-invalid', 'error', 'stackly-email-invalid');
      });
    });

    // Phone inputs: strip alphabetic characters as the user types
    form.querySelectorAll('input[type="tel"]').forEach(function (tel) {
      tel.addEventListener('input', function () {
        var cleaned = tel.value.replace(/[^0-9+\s()\-/.]/g, '');
        if (cleaned !== tel.value) tel.value = cleaned;
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (msg) {
        msg.className = 'newsletter-message';
        msg.textContent = '';
      }

      form.querySelectorAll('.field-error, .is-invalid, .error').forEach(function (el) {
        el.classList.remove('field-error', 'is-invalid', 'error');
      });

      var firstInvalid = null;
      var errorList = [];

      // Check all required inputs, selects, and textareas
      var requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
      requiredFields.forEach(function (field) {
        var val = (field.value || '').trim();
        var labelText = '';
        var parentCol = field.closest('.col-md-6, .col-12, .mb-3, div');
        if (parentCol) {
          var labelEl = parentCol.querySelector('label');
          if (labelEl) labelText = labelEl.textContent.trim();
        }
        if (!labelText) labelText = field.getAttribute('placeholder') || 'Required field';

        if (!val) {
          field.classList.add('field-error');
          if (!firstInvalid) firstInvalid = field;
          errorList.push('Please fill in ' + labelText + '.');
        } else if (field.type === 'email' && !emailPattern.test(val)) {
          field.classList.add('field-error');
          if (!firstInvalid) firstInvalid = field;
          errorList.push('Please enter a valid email address.');
        }
      });

      // Also validate any optional email field if filled
      form.querySelectorAll('input[type="email"]:not([required])').forEach(function (field) {
        var val = (field.value || '').trim();
        if (val && !emailPattern.test(val)) {
          field.classList.add('field-error');
          if (!firstInvalid) firstInvalid = field;
          errorList.push('Please enter a valid email address.');
        }
      });

      // Validate phone fields: digits/formatting characters only, at least 7 digits
      form.querySelectorAll('input[type="tel"]').forEach(function (field) {
        var val = (field.value || '').trim();
        if (!val) return;
        if (/[A-Za-z]/.test(val)) {
          field.classList.add('field-error');
          if (!firstInvalid) firstInvalid = field;
          errorList.push('Phone number cannot contain letters.');
        } else {
          var digits = val.replace(/\D/g, '');
          if (digits.length < 7) {
            field.classList.add('field-error');
            if (!firstInvalid) firstInvalid = field;
            errorList.push('Please enter a valid phone number.');
          }
        }
      });

      if (firstInvalid) {
        firstInvalid.focus();
        if (msg) {
          msg.className = 'newsletter-message error';
          msg.textContent = errorList[0] || 'Please complete all required fields before submitting.';
        }
        return;
      }

      // All details are completely filled and valid -> redirect to 404
      window.location.href = '404.html';
    });
  });

  // ----- Smooth scroll for anchor links (multi-page fallback) -----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
