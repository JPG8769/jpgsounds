(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const selectors = [
    '.home-hero',
    '.home-feature-card',
    '.home-flow-card',
    '.page-card',
    '.license-picker',
    '.license-option',
    '.license-item',
    '.signup-card',
    '.info-list',
    '.mini-form',
    '.beat-detail-back',
    '.beat-detail-card',
    '.beats-heading',
    '.page-title',
    '.page-subtitle'
  ];

  const seen = new Set();

  selectors.forEach((selector) => {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach((node, index) => {
      if (seen.has(node)) return;
      seen.add(node);
      node.setAttribute('data-reveal', '');
      node.style.setProperty('--reveal-delay', `${Math.min(index * 70, 420)}ms`);
    });
  });

  const revealNodes = document.querySelectorAll('[data-reveal]');
  if (!revealNodes.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    }
  );

  revealNodes.forEach((node) => observer.observe(node));
})();
