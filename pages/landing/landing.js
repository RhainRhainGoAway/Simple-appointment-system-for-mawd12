(() => {
  if (document.body) document.body.classList.add('lp-js');

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const nav = document.querySelector('.lp-nav');
  const burger = document.querySelector('.lp-nav__burger');

  if (nav instanceof HTMLElement && burger instanceof HTMLElement) {
    const setOpen = (isOpen) => {
      nav.classList.toggle('lp-nav--open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
    };

    burger.addEventListener('click', () => {
      const isOpen = nav.classList.contains('lp-nav--open');
      setOpen(!isOpen);
    });

    nav.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.matches('.lp-nav__link')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  // Scroll-triggered reveal animations (text + image per section)
  const revealEls = Array.from(
    document.querySelectorAll(
      [
        '.lp-hero__copy',
        '.lp-hero__art',
        '.lp-split__copy',
        '.lp-split__media',
        '.lp-footer__inner',
      ].join(',')
    )
  ).filter((el) => el instanceof HTMLElement);

  if (revealEls.length === 0) return;

  const isInViewportNow = (el) => {
    const rect = el.getBoundingClientRect();
    const topLimit = window.innerHeight * 0.9;
    const bottomLimit = window.innerHeight * 0.1;
    return rect.top < topLimit && rect.bottom > bottomLimit;
  };

  for (const el of revealEls) {
    el.classList.add('lp-reveal');

    if (el.matches('.lp-hero__art, .lp-split__media')) {
      el.classList.add('lp-reveal--right');
      el.style.setProperty('--reveal-delay', '120ms');
    } else if (el.matches('.lp-hero__copy, .lp-split__copy')) {
      el.classList.add('lp-reveal--left');
      el.style.setProperty('--reveal-delay', '200ms');
    }

    if (isInViewportNow(el)) el.classList.add('is-inview');
  }

  if (!('IntersectionObserver' in window)) {
    for (const el of revealEls) el.classList.add('is-inview');
    return;
  }

  const ENTER_RATIO = 0.2;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const target = entry.target;
        if (!(target instanceof HTMLElement)) continue;

        if (entry.intersectionRatio >= ENTER_RATIO) {
          target.classList.add('is-inview');
        } else if (!entry.isIntersecting) {
          // Reset only when fully out of view (so it can re-animate on re-entry).
          target.classList.remove('is-inview');
        }
      }
    },
    {
      threshold: [0, ENTER_RATIO],
    }
  );

  for (const el of revealEls) observer.observe(el);
})();
