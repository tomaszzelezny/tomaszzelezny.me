/* Elementy .landing pojawiają się, gdy wjadą na ekran przy przewijaniu.
   Style: sekcja „Animacje” w assets/css/landing.css. Karty w jednym rzędzie (komputer) wchodzą po kolei. */
(function () {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var sel = '.landing :is(.sec-head, .inline-cta, .about, .final, .steps > li, .posts > .post, .symptoms > li, .index-list > li)';
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.add('in');
      // po wjeździe element wraca do zwykłych stylów (hover bez opóźnienia)
      e.target.addEventListener('transitionend', function () {
        e.target.classList.remove('reveal', 'in');
        e.target.style.removeProperty('--i');
      }, { once: true });
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  // elementy widoczne od razu po wczytaniu zostają bez zmian, żeby nie mrugały
  document.querySelectorAll(sel).forEach(function (el) {
    if (el.getBoundingClientRect().top < innerHeight) return;
    var p = el.parentElement;
    if (p.matches('.steps, .posts, .symptoms') && innerWidth > 880) {
      el.style.setProperty('--i', Array.prototype.indexOf.call(p.children, el) % 3);
    }
    el.classList.add('reveal');
    io.observe(el);
  });
})();
