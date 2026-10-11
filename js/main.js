/* ==========================================================
   Akhil Hotel — site interactions (no dependencies)
   ========================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var HOTEL_EMAIL = 'yeluriakhil@gmail.com';
  var LONG_STAY_NIGHTS = 3;
  var LONG_STAY_DISCOUNT = 0.15;
  var ROOMS = {
    single:   { name: 'Single Room',   price: 800,  capacity: 1 },
    standard: { name: 'Standard Room', price: 1000, capacity: 2 },
    family:   { name: 'Family Suite',  price: 1250, capacity: 4 }
  };

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatINR(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }

  // Local YYYY-MM-DD (toISOString would shift the date across time zones)
  function toISODate(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }
  function parseDate(str) {
    var p = str.split('-');
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function addDays(d, n) { var c = new Date(d); c.setDate(c.getDate() + n); return c; }
  function prettyDate(d) {
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  /* ---------- Header: scrolled state, mobile menu, active link ---------- */
  var header = $('.site-header');
  var toTop = $('.to-top');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    toTop.classList.toggle('is-visible', y > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = $('.nav-toggle');
  function setMenu(open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('nav-open'));
  });
  $$('.main-nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('nav-open')) setMenu(false);
  });

  var navLinks = $$('.main-nav ul a');
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var section = $(a.getAttribute('href'));
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Hero slideshow ---------- */
  var slides = $$('.hero-slide');
  var dots = $$('.hero-dots button');
  var current = 0;
  var timer;
  function showSlide(i) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
  }
  function startSlides() {
    if (reduceMotion) return;
    clearInterval(timer);
    timer = setInterval(function () { showSlide(current + 1); }, 6000);
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { showSlide(i); startSlides(); });
  });
  startSlides();

  /* ---------- Scroll reveal + counters ---------- */
  function animateCount(el) {
    var target = +el.dataset.count;
    var suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target.toLocaleString('en-IN') + suffix; return; }
    var start = null;
    var duration = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        $$('[data-count]', entry.target).forEach(animateCount);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el, i) {
      // Stagger siblings that appear together in a grid
      el.style.transitionDelay = (i % 3) * 0.08 + 's';
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    $$('[data-count]').forEach(animateCount);
  }

  /* ---------- Booking form ---------- */
  var bookingForm = $('#booking-form');
  var checkin = $('#checkin');
  var checkout = $('#checkout');
  var roomSelect = $('#room');
  var guestsSelect = $('#guests');
  var bookingError = $('#booking-error');
  var modal = $('#booking-modal');
  var summary = $('#booking-summary');
  var pendingBooking = null;

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  checkin.min = toISODate(today);
  checkin.value = toISODate(addDays(today, 1));
  checkout.min = toISODate(addDays(today, 2));
  checkout.value = toISODate(addDays(today, 3));

  checkin.addEventListener('change', function () {
    if (!checkin.value) return;
    var nextDay = toISODate(addDays(parseDate(checkin.value), 1));
    checkout.min = nextDay;
    if (!checkout.value || checkout.value <= checkin.value) checkout.value = nextDay;
  });

  // Keep the guest count within the selected room's capacity
  function syncGuests() {
    var cap = ROOMS[roomSelect.value].capacity;
    $$('option', guestsSelect).forEach(function (opt) { opt.disabled = +opt.value > cap; });
    if (+guestsSelect.value > cap) guestsSelect.value = String(cap);
  }
  roomSelect.addEventListener('change', syncGuests);
  syncGuests();

  // "Book Now" buttons on the room cards preselect the room
  $$('[data-book]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      roomSelect.value = btn.dataset.book;
      syncGuests();
      $('#booking').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { checkin.focus({ preventScroll: true }); }, reduceMotion ? 0 : 600);
    });
  });

  function addRow(label, value, cls) {
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    if (cls) { dt.className = cls; dd.className = cls; }
    summary.appendChild(dt);
    summary.appendChild(dd);
  }

  bookingForm.addEventListener('submit', function (e) {
    e.preventDefault();
    bookingError.textContent = '';

    if (!checkin.value || !checkout.value) {
      bookingError.textContent = 'Please choose your check-in and check-out dates.';
      return;
    }
    var inDate = parseDate(checkin.value);
    var outDate = parseDate(checkout.value);
    if (inDate < today) {
      bookingError.textContent = 'Check-in date cannot be in the past.';
      return;
    }
    if (outDate <= inDate) {
      bookingError.textContent = 'Check-out must be at least one day after check-in.';
      return;
    }

    var room = ROOMS[roomSelect.value];
    var guests = +guestsSelect.value;
    var nights = Math.round((outDate - inDate) / 86400000);
    var subtotal = nights * room.price;
    var discount = nights >= LONG_STAY_NIGHTS ? subtotal * LONG_STAY_DISCOUNT : 0;
    var total = subtotal - discount;

    pendingBooking = {
      room: room.name, guests: guests, nights: nights,
      checkin: prettyDate(inDate), checkout: prettyDate(outDate), total: formatINR(total)
    };

    summary.innerHTML = '';
    addRow('Room', room.name);
    addRow('Check-in', pendingBooking.checkin);
    addRow('Check-out', pendingBooking.checkout);
    addRow('Guests', guests + (guests > 1 ? ' guests' : ' guest'));
    addRow(formatINR(room.price) + ' × ' + nights + (nights > 1 ? ' nights' : ' night'), formatINR(subtotal));
    if (discount) addRow('Long-stay offer (15%)', '− ' + formatINR(discount), 'discount');
    addRow('Total', formatINR(total), 'total');

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      sendBookingEmail();
    }
  });

  function sendBookingEmail() {
    if (!pendingBooking) return;
    var b = pendingBooking;
    var body = [
      'Hello Akhil Hotel,', '',
      'I would like to request the following booking:', '',
      'Room: ' + b.room,
      'Check-in: ' + b.checkin,
      'Check-out: ' + b.checkout,
      'Nights: ' + b.nights,
      'Guests: ' + b.guests,
      'Estimated total: ' + b.total, '',
      'Name:', 'Phone:', '', 'Thank you!'
    ].join('\n');
    window.location.href = 'mailto:' + HOTEL_EMAIL +
      '?subject=' + encodeURIComponent('Booking request — ' + b.room) +
      '&body=' + encodeURIComponent(body);
  }

  modal.addEventListener('close', function () {
    if (modal.returnValue === 'confirm') sendBookingEmail();
  });
  // Close when clicking the backdrop
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close('cancel'); });

  /* ---------- Contact form ---------- */
  var contactForm = $('#contact-form');
  var contactStatus = $('#contact-status');
  var messages = {
    name: 'Please enter your name.',
    phone: 'Please enter a valid phone number.',
    email: 'Please enter a valid email address.',
    message: 'Please write a short message.'
  };

  function validateField(input) {
    var field = input.closest('.field');
    var error = $('.field-error', field);
    var valid = input.value.trim() !== '' && input.checkValidity();
    field.classList.toggle('has-error', !valid);
    error.textContent = valid ? '' : messages[input.name];
    input.setAttribute('aria-invalid', String(!valid));
    return valid;
  }

  $$('input, textarea', contactForm).forEach(function (input) {
    input.addEventListener('blur', function () { if (input.value) validateField(input); });
    input.addEventListener('input', function () {
      if (input.closest('.field').classList.contains('has-error')) validateField(input);
    });
  });

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var inputs = $$('input, textarea', contactForm);
    var allValid = inputs.map(validateField).every(Boolean);
    if (!allValid) {
      contactStatus.className = 'form-status err';
      contactStatus.textContent = 'Please fix the highlighted fields.';
      var firstBad = $('[aria-invalid="true"]', contactForm);
      if (firstBad) firstBad.focus();
      return;
    }
    var data = new FormData(contactForm);
    var body = data.get('message') + '\n\n— ' + data.get('name') + '\n' + data.get('phone') + '\n' + data.get('email');
    window.location.href = 'mailto:' + HOTEL_EMAIL +
      '?subject=' + encodeURIComponent('Website enquiry from ' + data.get('name')) +
      '&body=' + encodeURIComponent(body);
    contactStatus.className = 'form-status ok';
    contactStatus.textContent = 'Thanks, ' + data.get('name') + '! Your email app should now open with your message ready to send.';
    contactForm.reset();
  });

  /* ---------- Gallery lightbox ---------- */
  var lightbox = $('#lightbox');
  var lightboxImg = $('img', lightbox);
  var galleryItems = $$('.gallery-item');
  var lbIndex = 0;

  function showImage(i) {
    lbIndex = (i + galleryItems.length) % galleryItems.length;
    var item = galleryItems[lbIndex];
    lightboxImg.src = item.dataset.full;
    lightboxImg.alt = $('img', item).alt;
  }
  galleryItems.forEach(function (item, i) {
    item.addEventListener('click', function () {
      if (typeof lightbox.showModal !== 'function') { window.open(item.dataset.full, '_blank'); return; }
      showImage(i);
      lightbox.showModal();
    });
  });
  $('.lightbox-nav.prev').addEventListener('click', function () { showImage(lbIndex - 1); });
  $('.lightbox-nav.next').addEventListener('click', function () { showImage(lbIndex + 1); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') showImage(lbIndex - 1);
    if (e.key === 'ArrowRight') showImage(lbIndex + 1);
  });

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();
})();
