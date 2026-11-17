(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const io = (fn, opts) => new IntersectionObserver(es => es.forEach(fn), opts);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  /* every page opens at its top, unless the link points to a section (#...) */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const toTop = () => { if (!location.hash) { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0); document.documentElement.style.scrollBehavior = ''; } };
  toTop();
  addEventListener('pageshow', toTop);
  /* a header or menu link to the page you are already on takes you back to its top */
  document.addEventListener('click', e => {
    const a = e.target.closest('.nav a[href], .menu a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const url = new URL(a.href, location.href);
    const here = p => p.replace(/index\.html$/, '');
    if (url.origin === location.origin && here(url.pathname) === here(location.pathname) && !url.hash) {
      e.preventDefault();
      scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
      if (location.hash) history.replaceState(null, '', url.pathname);
    }
  });

  /* nav: white over the dark page top, frosted after it */
  const top = $('.hero, .phero');
  if (top) io(e => document.body.classList.toggle('hero-on', e.isIntersecting), { rootMargin: '-70px 0px -85% 0px' }).observe(top);
  const onScrollNav = () => document.body.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScrollNav, { passive: true }); onScrollNav();
  const menu = $('.menu'), burger = $('.burger');
  if (menu && burger) {
    const set = open => { $$('.skip, .nav, main, footer.site, .dock').forEach(n => n.inert = open); menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); document.documentElement.style.overflow = open ? 'hidden' : ''; if (open) $('.x', menu).focus(); else burger.focus(); };
    burger.addEventListener('click', () => set(true));
    $('.x', menu).addEventListener('click', () => set(false));
    menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) set(false); });
  }

  /* home hero film: plays once by itself, then rests on its last frame */
  const film = $('.hero video');
  if (film && !reduced.matches && !(navigator.connection && navigator.connection.saveData)) {
    film.src = innerWidth <= 720 ? film.dataset.srcSm : film.dataset.src;
    film.addEventListener('playing', () => film.classList.add('on'), { once: true });
    film.play().catch(() => {});
    film.addEventListener('timeupdate', () => { if (film.currentTime >= 4.9) film.pause(); });   // rests within five seconds
  }

  /* hero messages: take turns once, rest on the last; any touch of the dots takes over */
  const slidesBox = $('[data-slides]');
  if (slidesBox) {
    const slides = $$('.slide', slidesBox), dots = $('.dots'), btns = $$('button', dots), DUR = 4600;
    let cur = 0, timer = null;
    const show = n => {
      cur = n;
      slides.forEach((s, i) => { const on = i === n; s.classList.toggle('on', on); s.setAttribute('aria-hidden', !on); s.inert = !on; });
      btns.forEach((b, i) => i === n ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'));
    };
    const stop = () => { clearTimeout(timer); timer = null; dots.classList.remove('auto'); };
    const tick = () => { if (cur < slides.length - 1) { show(cur + 1); timer = setTimeout(tick, DUR); } else stop(); };
    slides.forEach((s, i) => { if (i) s.inert = true; });
    btns.forEach((b, i) => b.addEventListener('click', () => { stop(); show(i); }));
    if (!reduced.matches) { dots.style.setProperty('--dur', DUR + 'ms'); dots.classList.add('auto'); timer = setTimeout(tick, DUR); }
    reduced.addEventListener('change', e => { if (e.matches) stop(); });
  }

  /* entrances */
  const revealer = io(e => {
    if (!e.isIntersecting || e.target.classList.contains('in')) return;
    e.target.classList.add('in');
    setTimeout(() => e.target.classList.add('done'), 1800);
    $$('[data-count]', e.target).forEach(countUp);
  }, { rootMargin: '0px 0px -10% 0px' });   // any height of section reveals as it enters
  $$('.reveal').forEach(s => revealer.observe(s));
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('paused', document.hidden));

  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    if (reduced.matches) { el.textContent = end.toFixed(dec); return; }
    const t0 = performance.now(), dur = 1600;
    const step = now => {
      const t = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - t, 3);
      el.textContent = (end * k).toFixed(dec);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* reviews track arrows */
  $$('.rnav').forEach(nav => {
    const track = $(nav.dataset.for);
    nav.addEventListener('click', e => {
      const b = e.target.closest('button[data-dir]'); if (!b || !track) return;
      track.scrollBy({ left: (b.dataset.dir === 'next' ? 1 : -1) * Math.min(440, track.clientWidth * 0.9), behavior: reduced.matches ? 'auto' : 'smooth' });
    });
  });

  /* home services: the row under the pointer or keyboard focus shows its picture */
  const pick = $('.spick');
  if (pick) {
    const rows = $$('li', pick), on = li => rows.forEach(r => r.classList.toggle('on', r === li));
    rows.forEach(li => {
      li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') on(li); });
      li.addEventListener('focusin', () => on(li));
    });
  }

  /* services page: show the services for one concern */
  const filt = $('.sfilter');
  if (filt) {
    const list = filt.closest('.slist'), cards = $$('.scard', list), groups = $$('.tgroup', list), btns = $$('button', filt), count = $('#scount');
    const apply = f => {
      let n = 0;
      cards.forEach(c => {
        const show = f === 'all' || c.dataset.c === f;
        c.hidden = !show; n += show; if (show) c.classList.add('in');
        if (show && !reduced.matches) c.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' });
      });
      groups.forEach(g => { g.hidden = !cards.some(c => !c.hidden && g.contains(c)); });
      list.classList.toggle('filtered', f !== 'all');
      btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.f === f));
      count.textContent = f === 'all' ? 'All ' + cards.length + ' services' : n + ' of ' + cards.length + ' services';
    };
    filt.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.getAttribute('aria-pressed') !== 'true') apply(b.dataset.f); });
  }

  /* cards on the services and reviews pages come in one by one, in reading order */
  const cards = $$('.rv');
  if (cards.length) {
    const showAll = () => cards.forEach(c => c.classList.add('in'));
    if (reduced.matches || !('IntersectionObserver' in window)) showAll();
    else {
      const cardIO = new IntersectionObserver(entries => {
        const hits = entries.filter(e => e.isIntersecting).map(e => e.target)
          .sort((a, b) => { const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return (Math.round(ra.top / 60) - Math.round(rb.top / 60)) || (ra.left - rb.left); });
        hits.forEach((c, i) => {
          c.style.setProperty('--d', Math.min(i * 90, 450) + 'ms');
          c.classList.add('in'); cardIO.unobserve(c);
          setTimeout(() => c.style.removeProperty('--d'), 2400);   // later hovers answer at once
        });
      }, { rootMargin: '0px 0px -8% 0px' });
      cards.forEach(c => cardIO.observe(c));
      reduced.addEventListener('change', e => { if (e.matches) showAll(); });
    }
  }

  /* home reviews: on a desktop the cards move along one at a time, slowly.
     Hover or focus pauses it, the pause button or any arrow, scroll or touch stops it for good. */
  const rtrack = $('#rtrack'), rplay = $('.rplay');
  if (rtrack && rplay && !reduced.matches && matchMedia('(hover:hover) and (min-width:861px)').matches) {
    let timer = null, held = false, stopped = false;
    const STEP = 4200;
    const advance = () => {
      if (held || stopped || document.hidden) return;
      const card = $('.rcard', rtrack); if (!card) return;
      const w = card.offsetWidth + (parseFloat(getComputedStyle(rtrack).columnGap) || 14);
      const max = rtrack.scrollWidth - rtrack.clientWidth;
      rtrack.scrollTo({ left: rtrack.scrollLeft >= max - 4 ? 0 : Math.min(max, rtrack.scrollLeft + w), behavior: 'smooth' });
    };
    const run = on => { clearInterval(timer); timer = on && !stopped ? setInterval(advance, STEP) : null; };
    const stop = () => { stopped = true; run(false); rplay.setAttribute('aria-pressed', 'true'); rplay.setAttribute('aria-label', 'Play reviews'); };
    rplay.hidden = false;
    rplay.addEventListener('click', () => {
      if (stopped) { stopped = false; rplay.setAttribute('aria-pressed', 'false'); rplay.setAttribute('aria-label', 'Pause reviews'); run(true); advance(); }
      else stop();
    });
    $$('.rnav button:not(.rplay)').forEach(b => b.addEventListener('click', stop));
    ['wheel', 'pointerdown', 'keydown'].forEach(ev => rtrack.addEventListener(ev, stop, { passive: true }));
    rtrack.addEventListener('pointerenter', () => held = true);
    rtrack.addEventListener('pointerleave', () => held = false);
    rtrack.addEventListener('focusin', () => held = true);
    rtrack.addEventListener('focusout', () => held = false);
    new IntersectionObserver(([e]) => run(e.isIntersecting)).observe(rtrack);
    reduced.addEventListener('change', e => { if (e.matches) stop(); });
  }

  /* booking: opens WhatsApp with the details filled in */
  const form = $('#bookForm');
  if (form) {
    const want = new URLSearchParams(location.search).get('c');
    if (want) [...form.concern.options].forEach(o => { if (o.textContent === want) form.concern.value = want; });
    const note = $('#formNote');
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const d = new FormData(form), line = (k, label) => (d.get(k) || '').trim() ? '\n' + label + ': ' + d.get(k).trim() : '';
      const msg = "Hello, I would like to book a consultation at Dr. Sahitya's Dermacure."
        + line('name', 'Name') + line('phone', 'Phone') + line('concern', 'Concern') + line('when', 'Preferred time') + line('note', 'Note');
      window.open('https://wa.me/' + form.dataset.wa + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      note.className = 'done-msg full';
      note.textContent = 'WhatsApp should now be open with your message. Press send there to finish. Nothing has been sent from this page. If WhatsApp did not open, please call the clinic.';
    });
  }
})();
