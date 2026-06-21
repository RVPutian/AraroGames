document.addEventListener('DOMContentLoaded', () => {
    initDownloadPage();
});

function initDownloadPage() {
    setActiveDownloadNav();
    initDownloadEntranceAnimations();
    initCtaParticles();
    initCtaButtonPulse();
    loadDynamicLinks();
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
// ==========================================
// DYNAMIC LINK LOADING (CMS)
// ==========================================
async function loadDynamicLinks() {
    // Ensure Appwrite is loaded
    if (!window.Appwrite) return;

    try {
        const { Client, Databases } = window.Appwrite;
        
        // Initialize local Appwrite client
        const client = new Client()
            .setEndpoint('https://sgp.cloud.appwrite.io/v1')
            .setProject('6a047edc002f06ccec20');

        const databases = new Databases(client);

        // Fetch the links from your new table
        const response = await databases.listDocuments(
            '6a04949300345f370eff', // Your Database ID
            'download_settings'     // Your new Table ID
        );

        if (response.documents && response.documents.length > 0) {
            const settings = response.documents[0];
            
            // 1. Update the Download Button
            const downloadBtn = document.querySelector('.download-cta-btn');
            if (downloadBtn && settings.downloadLink) {
                downloadBtn.href = settings.downloadLink;
                downloadBtn.target = "_blank"; // Forces it to open in a new tab
            }

            // 2. Update the Gameplay Video iframe
            const videoIframe = document.querySelector('.video-card iframe');
            if (videoIframe && settings.videolink) {
                let finalVideoLink = settings.videolink;

                // Automatically convert standard YouTube links to Embed links
                if (finalVideoLink.includes('watch?v=')) {
                    finalVideoLink = finalVideoLink.replace('watch?v=', 'embed/');
                    finalVideoLink = finalVideoLink.split('&')[0]; // Remove extra tracking tags
                } else if (finalVideoLink.includes('youtu.be/')) {
                    finalVideoLink = finalVideoLink.replace('youtu.be/', 'www.youtube.com/embed/');
                    finalVideoLink = finalVideoLink.split('?')[0]; // Remove extra tracking tags
                }

                videoIframe.src = finalVideoLink;
            }
        }
    } catch (error) {
        console.error('Failed to load dynamic links from Appwrite:', error);
    }
}
