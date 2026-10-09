// Splash: tells viewers this is a mock-up with no company data, then waits for "Enter demo".
// Shown once per browser session. ?splash forces it, ?nosplash skips it, ?motion forces
// full motion even when the OS asks for reduced motion.
(function () {
  var el = document.getElementById('splash');
  if (!el) return;
  var q = location.search;
  var seen = false;
  try { seen = sessionStorage.getItem('ae:splash') === '1'; } catch (e) {}
  if (/nosplash/.test(q) || (seen && !/[?&]splash/.test(q))) { el.className = 'gone'; if (window.__menuIn) window.__menuIn(); return; }

  var reduce = !/[?&]motion/.test(q) && !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var EASE = 'cubic-bezier(.2,.8,.2,1)', POP = 'cubic-bezier(.34,1.56,.64,1)';
  function anim(node, kf, o) {
    if (!node || !node.animate) return Promise.resolve();
    if (reduce) o = Object.assign({}, o, { duration: 1, delay: 0 });
    return node.animate(kf, Object.assign({ fill: 'both', easing: EASE }, o)).finished.catch(function () {});
  }
  var $ = function (s) { return el.querySelector(s); };

  // Entrance: orbs drift, badge pops, title sharpens, note and wins rise, button arrives.
  if (!reduce) el.querySelectorAll('.sp-orbs i').forEach(function (o, i) {
    o.animate([{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (i % 2 ? -70 : 70) + 'px,' + (i ? 50 : -40) + 'px) scale(1.18)' }],
      { duration: 5200 + i * 900, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
  });
  anim($('.sp-badge'), [{ opacity: 0, transform: 'scale(.55)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 560, delay: 150, easing: POP });
  anim($('.sp-title'), [{ opacity: 0, transform: 'translateY(28px)', filter: 'blur(10px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 760, delay: 300 });
  anim($('.sp-note'), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 600 });
  el.querySelectorAll('.sp-wins li').forEach(function (li, i) {
    anim(li, [{ opacity: 0, transform: 'translateY(12px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 820 + i * 120, easing: POP });
  });
  anim($('.sp-enter'), [{ opacity: 0, transform: 'translateY(12px) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: 1350, easing: POP })
    .then(function () { $('.sp-enter').focus({ preventScroll: true }); });

  var leaving = false;
  function enter() {
    if (leaving) return; leaving = true;
    try { sessionStorage.setItem('ae:splash', '1'); } catch (e) {}
    document.removeEventListener('keydown', onKey, true);
    anim(el, [{ clipPath: 'circle(150% at 50% 50%)' }, { clipPath: 'circle(0% at 50% 50%)' }], { duration: 700, easing: 'cubic-bezier(.7,0,.3,1)' })
      .then(function () { el.className = 'gone'; });
    setTimeout(function () { if (window.__menuIn) window.__menuIn(); }, reduce ? 0 : 260);
  }
  function onKey(e) { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); enter(); } }
  $('.sp-enter').addEventListener('click', enter);
  document.addEventListener('keydown', onKey, true);
})();
