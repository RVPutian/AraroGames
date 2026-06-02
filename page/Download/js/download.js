document.addEventListener('DOMContentLoaded', () => {
    initDownloadPage();
});

function initDownloadPage() {
    setActiveDownloadNav();
    initDownloadEntranceAnimations();
    initCtaParticles();
    initCtaButtonPulse();
}

function setActiveDownloadNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link) => {
        const href = (link.getAttribute('href') || '').toLowerCase();
        link.classList.toggle('active', href.includes('/page/download/index.html'));
    });
}

function initDownloadEntranceAnimations() {
    const items = Array.from(document.querySelectorAll('.download-entrance'));
    if (!items.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach((item) => {
            item.style.opacity = '1';
            item.style.transform = 'none';
        });
        return;
    }

    if (typeof anime !== 'undefined') {
        anime.timeline({
            easing: 'easeOutExpo',
            duration: 920
        }).add({
            targets: items,
            opacity: [0, 1],
            translateY: [30, 0],
            scale: [0.985, 1],
            delay: anime.stagger(140)
        });
        return;
    }

    items.forEach((item) => {
        item.style.opacity = '1';
        item.style.transform = 'none';
    });
}

function initCtaParticles() {
    const container = document.querySelector('.cta-particles');
    if (!container) return;

    const particleCount = window.matchMedia('(max-width: 768px)').matches ? 12 : 18;

    for (let i = 0; i < particleCount; i++) {
        const dot = document.createElement('span');
        dot.className = 'cta-particle';

        const left = Math.random() * 100;
        const size = 5 + Math.random() * 8;
        const delay = Math.random() * 7;
        const duration = 7.5 + Math.random() * 5;
        const drift = (Math.random() * 24 - 12).toFixed(2);

        dot.style.setProperty('--particle-left', `${left}%`);
        dot.style.setProperty('--particle-size', `${size}px`);
        dot.style.setProperty('--particle-delay', `${delay}s`);
        dot.style.setProperty('--particle-duration', `${duration}s`);
        dot.style.setProperty('--particle-drift', `${drift}px`);

        container.appendChild(dot);
    }
}

function initCtaButtonPulse() {
    const button = document.querySelector('.download-cta-btn');
    if (!button || typeof anime === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    anime({
        targets: button,
        boxShadow: [
            '0 0 0 0 rgba(201, 139, 45, 0.2), 0 18px 35px rgba(0, 0, 0, 0.35)',
            '0 0 0 12px rgba(201, 139, 45, 0.0), 0 18px 35px rgba(0, 0, 0, 0.35)'
        ],
        duration: 2200,
        easing: 'easeInOutSine',
        loop: true
    });
}
