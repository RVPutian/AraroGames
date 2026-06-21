const AppState = {
    currentLang: 'en',
    currentTheme: 'dark',
    currentSection: 'home',
    isMenuOpen: false,
    isLoaded: false
};

let pageSections = [];

const APPWRITE_CONFIG = {
    endpoint: 'https://sgp.cloud.appwrite.io/v1',
    projectId: '6a047edc002f06ccec20',
    databaseId: '6a04949300345f370eff',
    tableId: 'feedback',
    adminsTableId: 'admins',
    // Database IDs for Update Logs
    patchNotesTableId: 'patch_notes',
    showcaseTableId: 'showcase',
    storageBucketId: '6a34cd24002a42489904'
};

let appwriteSdkPromise = null;
let appwriteTablesDb = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

window.addEventListener('pageshow', () => {
    hideSuccessPopup();
    hideErrorPopup();
    closeFeedbackModal();
});

function initializeApp() {
    hideSuccessPopup();
    hideErrorPopup();
    closeFeedbackModal();
    loadPreferences();
    initTheme();
    initNavigation();
    initScrollEffects();
    initCardPerformanceOptimization();
    initBlossomScene();
    initFormHandlers();
    initMobileMenu();
    initProjectsCarousel();
    initFeedbackModal();
    initApprovedFeedbackSection();
    initAdminNavVisibility();
    initShowcase(); 
    updateThemeUI();
    
    // Initialize our new systems
    loadPatchNotes(); 
    initLightbox(); 
    
    AppState.isLoaded = true;
}

function loadPreferences() {
    const savedLang = localStorage.getItem('portfolio-lang');
    const savedTheme = localStorage.getItem('portfolio-theme');
    if (savedLang) AppState.currentLang = savedLang;
    if (savedTheme) AppState.currentTheme = savedTheme;
}

function initTheme() {
    document.body.setAttribute('data-theme', 'dark');
}

function toggleTheme() {
    const newTheme = AppState.currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('portfolio-theme', newTheme);
}

function setTheme(theme) {
    AppState.currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    updateThemeUI();
}

function updateThemeUI() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = AppState.currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

function initNavigation() {
    pageSections = Array.from(document.querySelectorAll('section[id]'));
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');

    const shouldAutoOpenFeedback = new URLSearchParams(window.location.search).get('feedback') === 'open';
    if (shouldAutoOpenFeedback) {
        const url = new URL(window.location.href);
        url.searchParams.delete('feedback');
        window.history.replaceState({}, '', url);

        setTimeout(() => {
            const feedbackSection = document.getElementById('feedback');
            if (!feedbackSection) return;

            const header = document.querySelector('.main-header');
            const headerHeight = header ? header.offsetHeight : 0;
            const targetPosition = feedbackSection.offsetTop - headerHeight;

            window.scrollTo({
                top: Math.max(0, targetPosition),
                behavior: 'smooth'
            });

            setTimeout(openFeedbackModal, 450);
        }, 150);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const shouldFeedbackOpen = link.getAttribute('data-feedback-nav') === 'open';
            if (shouldFeedbackOpen) {
                const url = new URL(window.location.href);
                url.searchParams.set('feedback', 'open');
                window.history.replaceState({}, '', url);
            }

            const targetId = shouldFeedbackOpen ? '#feedback' : link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (!targetSection) return;

            const headerHeight = document.querySelector('.main-header').offsetHeight;
            const targetPosition = targetSection.offsetTop - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            updateActiveNavLink(link);
            if (AppState.isMenuOpen) {
                toggleMobileMenu();
            }
        });
    });

    let scrollFrame = null;
    const onScroll = () => {
        if (scrollFrame !== null) {
            return;
        }

        scrollFrame = window.requestAnimationFrame(() => {
            handleScroll();
            updateHeaderOnScroll();
            scrollFrame = null;
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
}

function handleScroll(sections = pageSections) {
    if (!sections.length) {
        return;
    }

    const scrollPosition = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            AppState.currentSection = sectionId;
            updateActiveNavLink(null, sectionId);
        }
    });
}

function updateActiveNavLink(clickedLink, sectionId = null) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (clickedLink && link === clickedLink) {
            link.classList.add('active');
        } else if (sectionId) {
            const linkSection = link.getAttribute('data-section');
            if (linkSection === sectionId) {
                link.classList.add('active');
            }
        }
    });
}

function updateHeaderOnScroll() {
    const header = document.querySelector('.main-header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
}

function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(element => observer.observe(element));
    
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => observer.observe(section));
}

function initCardPerformanceOptimization() {
    const creatorCards = document.querySelectorAll('.ex-demo .card[data-bg]');
    const modelViewers = document.querySelectorAll('model-viewer[data-src]');

    if (!creatorCards.length && !modelViewers.length) {
        return;
    }

    const canObserve = typeof IntersectionObserver !== 'undefined';
    const observeOptions = {
        root: null,
        rootMargin: '180px 0px 220px 0px',
        threshold: 0.01
    };

    const hydrateModelViewer = (viewer) => {
        if (!viewer || viewer.dataset.modelHydrated === '1') {
          return;
        }

        const source = viewer.getAttribute('data-src');
        if (!source) {
            return;
        }

        viewer.setAttribute('src', source);
        viewer.setAttribute('loading', 'lazy');
        viewer.setAttribute('reveal', viewer.getAttribute('reveal') || 'interaction');
        viewer.dataset.modelHydrated = '1';
        viewer.classList.add('is-loading');

        viewer.addEventListener('load', () => {
            viewer.classList.remove('is-loading');
        }, { once: true });
    };

    const hydrateCard = (card) => {
        if (!card || card.dataset.bgHydrated === '1') {
            return;
        }

        const backgroundImage = card.getAttribute('data-bg');
        if (backgroundImage) {
            card.style.setProperty('--card-bg', `url("${backgroundImage}")`);
            card.classList.add('has-card-bg');
        }

        card.dataset.bgHydrated = '1';
        card.classList.remove('is-loading');
    };

    if (canObserve) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                if (entry.target.matches('.ex-demo .card[data-bg]')) {
                    hydrateCard(entry.target);
                } else if (entry.target.matches('model-viewer[data-src]')) {
                    hydrateModelViewer(entry.target);
                }

                obs.unobserve(entry.target);
            });
        }, observeOptions);

        creatorCards.forEach((card) => {
            card.classList.add('is-loading');
            observer.observe(card);
        });

        modelViewers.forEach((viewer) => {
            observer.observe(viewer);
        });
        return;
    }

    creatorCards.forEach((card) => {
        card.classList.add('is-loading');
        hydrateCard(card);
    });

    modelViewers.forEach((viewer) => {
        hydrateModelViewer(viewer);
    });
}

function initFormHandlers() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleFormSubmit);
    }

    const feedbackPopupForm = document.getElementById('feedbackPopupForm');
    if (feedbackPopupForm) {
        feedbackPopupForm.addEventListener('submit', (e) => {
            handleFormSubmit(e);
            closeFeedbackModal();
        });
    }
}

function initFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (!modal) return;

    const openButtons = document.querySelectorAll('[data-open-feedback-modal]:not(.nav-feedback-modal)');
    const closeButtons = document.querySelectorAll('[data-close-feedback-modal]');

    openButtons.forEach((button) => {
        button.addEventListener('click', openFeedbackModal);
    });

    closeButtons.forEach((button) => {
        button.addEventListener('click', closeFeedbackModal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeFeedbackModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFeedbackModal();
        }
    });
}

function openFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');

    const url = new URL(window.location.href);
    url.searchParams.delete('feedback');
    window.history.replaceState({}, '', url);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    if (typeof e.target.checkValidity === 'function' && !e.target.checkValidity()) {
        try { e.target.reportValidity(); } catch (_) {}
        return;
    }
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        await submitFeedbackToAppwrite(data);
        e.target.reset();
        showSuccessPopup();

        if (e.target.id === 'feedbackPopupForm') {
            closeFeedbackModal();
        }
    } catch (error) {
        console.error('Failed to send feedback to Appwrite:', error);
        hideErrorPopup();
    }
}

function isAppwriteConfigured() {
    return Boolean(
        APPWRITE_CONFIG.endpoint &&
        APPWRITE_CONFIG.projectId &&
        APPWRITE_CONFIG.databaseId &&
        APPWRITE_CONFIG.tableId
    );
}

async function loadAppwriteSdk() {
    if (!window.Appwrite) {
        throw new Error('Appwrite SDK is not loaded.');
    }

    if (!appwriteSdkPromise) {
        appwriteSdkPromise = Promise.resolve(window.Appwrite);
    }

    return appwriteSdkPromise;
}

async function getAppwriteTablesDb() {
    if (appwriteTablesDb) {
        return appwriteTablesDb;
    }

    const { Client, TablesDB } = await loadAppwriteSdk();
    const client = new Client()
        .setEndpoint(APPWRITE_CONFIG.endpoint)
        .setProject(APPWRITE_CONFIG.projectId);

    appwriteTablesDb = new TablesDB(client);
    return appwriteTablesDb;
}

async function submitFeedbackToAppwrite(data) {
    if (!isAppwriteConfigured()) {
        throw new Error('Appwrite configuration is incomplete.');
    }

    const { ID } = await loadAppwriteSdk();
    const tablesDb = await getAppwriteTablesDb();
    const permissions = getPrivateFeedbackPermissions();

    return tablesDb.createRow({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.tableId,
        rowId: ID.unique(),
        data: {
            Name: data.name,
            Email: data.email,
            Message: data.message,
            approved: false
        },
        permissions
    });
}

function getPrivateFeedbackPermissions() {
    return null;
}

function showSuccessPopup() {
    const popup = document.getElementById('successPopup');
    if (!popup) return;

    popup.setAttribute('aria-hidden', 'false');
    popup.classList.add('is-visible');

    setTimeout(() => {
        hideSuccessPopup();
    }, 3000);
}

function hideSuccessPopup() {
    const popup = document.getElementById('successPopup');
    if (!popup) return;

    popup.classList.remove('is-visible');
    popup.setAttribute('aria-hidden', 'true');
}

function showErrorPopup(errorMessage) {
    const popup = document.getElementById('errorPopup');
    const messageElement = document.getElementById('errorPopupMessage');
    
    if (!popup) return;

    if (messageElement) {
        messageElement.textContent = AppState.currentLang === 'ar'
            ? `تعذر إرسال الرسالة: ${errorMessage}`
            : `Could not send feedback: ${errorMessage}`;
    }

    popup.setAttribute('aria-hidden', 'false');
    popup.classList.add('is-visible');

    setTimeout(() => {
        hideErrorPopup();
    }, 5000);
}

function hideErrorPopup() {
    const popup = document.getElementById('errorPopup');
    if (!popup) return;

    popup.classList.remove('is-visible');
    popup.setAttribute('aria-hidden', 'true');
}

async function initApprovedFeedbackSection() {
    const list = document.getElementById('approvedFeedbackList');
    if (!list) return;

    const emptyState = document.getElementById('approvedFeedbackEmptyState');

    if (!window.Appwrite || !isAppwriteConfigured()) {
        showApprovedFeedbackEmptyState(emptyState, 'Appwrite is not configured yet.');
        return;
    }

    try {
        const { Query } = window.Appwrite;
        const tablesDb = await getAppwriteTablesDb();
        const response = await tablesDb.listRows({
            databaseId: APPWRITE_CONFIG.databaseId,
            tableId: APPWRITE_CONFIG.tableId,
            queries: [
                Query.equal('approved', [true]),
                Query.orderDesc('$createdAt'),
                Query.limit(12)
            ],
            ttl: 0
        });

        const rows = Array.isArray(response?.rows) ? response.rows : [];
        renderApprovedFeedbackRows(rows, list, emptyState);
    } catch (error) {
        console.error('Failed to load approved feedback:', error);
        const detail = error?.message || (typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error));
        showApprovedFeedbackEmptyState(emptyState, `Approved feedback could not be loaded: ${detail}.\nCheck collection read permissions and document-level security or run "Fix visibility" from the admin dashboard.`);
    }
}

function renderApprovedFeedbackRows(rows, list, emptyState) {
    if (!list) return;

    list.innerHTML = '';

    if (!rows.length) {
        list.classList.add('is-empty');
        showApprovedFeedbackEmptyState(emptyState);
        return;
    }

    list.classList.remove('is-empty');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    rows.forEach((row) => {
        const card = document.createElement('article');
        card.className = 'feedback-card';

        const name = row.Name || row.name || 'Anonymous';
        const message = row.Message || row.message || '';
        const createdAt = row.$createdAt ? new Date(row.$createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : 'Recently';

        card.innerHTML = `
            <div class="feedback-card-top">
                <div>
                    <p class="feedback-card-name">${escapeHtml(name)}</p>
                    <p class="feedback-card-date">${escapeHtml(createdAt)}</p>
                </div>
            </div>
            <p class="feedback-card-message">${escapeHtml(message)}</p>
        `;

        list.appendChild(card);
    });
}

function showApprovedFeedbackEmptyState(emptyState, customMessage) {
    if (!emptyState) return;

    const small = emptyState.querySelector('small');
    if (small && customMessage) {
        small.textContent = customMessage;
    } else if (small) {
        small.textContent = 'Only feedback approved in the admin dashboard appears here.';
    }

    emptyState.style.display = 'block';
}

async function initAdminNavVisibility() {
    const navLink = document.getElementById('adminDashboardNavLink');
    if (!navLink || !window.Appwrite || !isAppwriteConfigured()) {
        return;
    }

    const cachedAdminSession = getCachedAdminSession();
    if (cachedAdminSession?.userId) {
        navLink.style.display = '';
    }

    try {
        const account = createAppwriteAccountService();
        const user = await account.get();
        const isAdmin = await checkHomePageAdminAccess(user.$id);

        if (isAdmin) {
            localStorage.setItem('araro-admin-session', JSON.stringify({
                userId: user.$id,
                email: user.email,
                verifiedAt: Date.now()
            }));
            navLink.style.display = '';
        } else if (!cachedAdminSession?.userId) {
            navLink.style.display = 'none';
        }
    } catch (error) {
        if (!cachedAdminSession?.userId) {
            navLink.style.display = 'none';
        }
    }
}

function getCachedAdminSession() {
    try {
        const raw = localStorage.getItem('araro-admin-session');
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function createAppwriteClient() {
    const { Client } = window.Appwrite;
    return new Client()
        .setEndpoint(APPWRITE_CONFIG.endpoint)
        .setProject(APPWRITE_CONFIG.projectId);
}

function createAppwriteAccountService() {
    const { Account } = window.Appwrite;
    return new Account(createAppwriteClient());
}

function createAppwriteTablesService() {
    const { TablesDB } = window.Appwrite;
    return new TablesDB(createAppwriteClient());
}

async function checkHomePageAdminAccess(userId) {
    const { Query } = window.Appwrite;
    const tablesDb = createAppwriteTablesService();

    const response = await tablesDb.listRows({
        databaseId: APPWRITE_CONFIG.databaseId,
        tableId: APPWRITE_CONFIG.adminsTableId,
        queries: [
            Query.equal('userId', [userId]),
            Query.equal('active', [true])
        ]
    });

    return Array.isArray(response?.rows) && response.rows.length > 0;
}

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    document.addEventListener('click', (e) => {
        const navMenu = document.getElementById('navMenu');
        const menuToggle = document.getElementById('menuToggle');
        
        if (AppState.isMenuOpen && 
            !navMenu.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            toggleMobileMenu();
        }
    });
}

function toggleMobileMenu() {
    AppState.isMenuOpen = !AppState.isMenuOpen;
    const navMenu = document.getElementById('navMenu');
    const menuToggle = document.getElementById('menuToggle');
    
    if (navMenu) {
        navMenu.classList.toggle('active', AppState.isMenuOpen);
    }
    
    if (menuToggle) {
        menuToggle.classList.toggle('active', AppState.isMenuOpen);
        menuToggle.setAttribute('aria-expanded', String(AppState.isMenuOpen));
    }

    document.body.classList.toggle('nav-open', AppState.isMenuOpen);
}

function initProjectsCarousel() {
    const carouselGroups = document.querySelectorAll('[data-carousel-group]');
    if (!carouselGroups.length) return;

    carouselGroups.forEach((group) => {
        const grid = group.querySelector('.projects-grid');
        const prevBtn = group.querySelector('.carousel-prev');
        const nextBtn = group.querySelector('.carousel-next');

        if (!grid || !prevBtn || !nextBtn) return;

        const getStep = () => {
            const firstCard = grid.querySelector('.project-card');
            if (!firstCard) return grid.clientWidth;
            const cardWidth = firstCard.getBoundingClientRect().width;
            const styles = window.getComputedStyle(grid);
            const gap = parseFloat(styles.columnGap || styles.gap || '0');
            return cardWidth + gap;
        };

        const updateArrowState = () => {
            const maxScrollLeft = grid.scrollWidth - grid.clientWidth;
            prevBtn.disabled = grid.scrollLeft <= 2;
            nextBtn.disabled = grid.scrollLeft >= maxScrollLeft - 2 || maxScrollLeft <= 0;
        };

        const bounce = (button) => {
            button.classList.remove('is-bouncing');
            void button.offsetWidth;
            button.classList.add('is-bouncing');
            setTimeout(() => button.classList.remove('is-bouncing'), 240);
        };

        prevBtn.addEventListener('click', () => {
            grid.scrollBy({ left: -getStep(), behavior: 'smooth' });
            bounce(prevBtn);
        });

        nextBtn.addEventListener('click', () => {
            grid.scrollBy({ left: getStep(), behavior: 'smooth' });
            bounce(nextBtn);
        });

        let scrollFrame = null;
        const onScroll = () => {
            if (scrollFrame !== null) {
                return;
            }

            scrollFrame = window.requestAnimationFrame(() => {
                updateArrowState();
                scrollFrame = null;
            });
        };

        let resizeFrame = null;
        const onResize = () => {
            if (resizeFrame !== null) {
                return;
            }

            resizeFrame = window.requestAnimationFrame(() => {
                updateArrowState();
                resizeFrame = null;
            });
        };

        grid.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        updateArrowState();
    });
}

const BLOSSOM_VARIANTS = ['petal-style1', 'petal-style2', 'petal-style3', 'petal-style4'];

class Petal {
    constructor(config = {}) {
        this.customClass = config.customClass || '';
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.z = config.z || 0;
        
        // Use constant speeds instead of random wind variations
        this.xSpeed = 0; 
        this.ySpeed = 0; 
        
        this.rotation = {
            axis: 'X',
            value: 0,
            speed: 0,
            x: 0
        };

        this.el = document.createElement('div');
        this.el.className = `petal ${this.customClass}`.trim();
        this.el.style.position = 'absolute';
        this.el.style.backfaceVisibility = 'visible';
    }
}

class BlossomScene {
    constructor(config) {
        const container = document.getElementById(config.id);
        if (!container) {
            throw new Error('[id] provided was not found in document');
        }

        this.container = container;
        this.placeholder = document.createElement('div');
        this.petals = [];
        this.petalsTypes = config.petalsTypes;
        this.numPetals = config.numPetals || 18;
        this.width = 0;
        this.height = 0;

        this.container.style.overflow = 'hidden';
        this.placeholder.className = 'blossom-scene';
        this.placeholder.style.transformStyle = 'preserve-3d';
        this.container.appendChild(this.placeholder);

        this.handleResize = this.handleResize.bind(this);
        this.updateFrame = this.updateFrame.bind(this);
        this.handleResize();
        window.addEventListener('resize', this.handleResize, { passive: true });
        this.createPetals();
        requestAnimationFrame(this.updateFrame);
    }

    handleResize() {
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.placeholder.style.width = `${this.width}px`;
        this.placeholder.style.height = `${this.height}px`;
    }

    resetPetal(petal) {
        // Start petals off-screen to the right or top
        petal.x = this.width + (Math.random() * this.width * 0.5);
        petal.y = (Math.random() * this.height * 1.5) - this.height;
        petal.z = Math.random() * 200;

        // FAST SPEEDS
        petal.xSpeed = Math.random() * 2.5 + 1.5; // Fast leftward movement
        petal.ySpeed = Math.random() * 1.0 + 0.8; // Fast downward gravity

        // FAST SPIN
        petal.rotation.speed = Math.random() * 10;
        
        const randomAxis = Math.random();
        if (randomAxis > 0.5) {
            petal.rotation.axis = 'X';
        } else if (randomAxis > 0.25) {
            petal.rotation.axis = 'Y';
            petal.rotation.x = Math.random() * 180 + 90;
        } else {
            petal.rotation.axis = 'Z';
            petal.rotation.x = Math.random() * 360 - 180;
            // Original Z-axis spin speed
            petal.rotation.speed = Math.random() * 3; 
        }

        return petal;
    }

    updatePetal(petal) {
        // perfectly smooth diagonal lines, no zigzag
        petal.x -= petal.xSpeed;
        petal.y += petal.ySpeed;
        petal.rotation.value += petal.rotation.speed;

        let transform = `translateX(${petal.x}px) translateY(${petal.y}px) translateZ(${petal.z}px) rotate${petal.rotation.axis}(${petal.rotation.value}deg)`;
        if (petal.rotation.axis !== 'X') {
            transform += ` rotateX(${petal.rotation.x}deg)`;
        }
        petal.el.style.transform = transform;

        // Reset the petal to the top/right when it floats off screen
        if (petal.x < -50 || petal.y > this.height + 50) {
            this.resetPetal(petal);
        }
    }

    createPetals() {
        const isCompactViewport = window.matchMedia('(max-width: 768px)').matches;
        const targetCount = isCompactViewport ? Math.max(12, Math.round(this.numPetals * 0.75)) : this.numPetals;

        for (let i = 0; i < targetCount; i++) {
            const petalType = this.petalsTypes[Math.floor(Math.random() * this.petalsTypes.length)];
            const petal = new Petal({ customClass: petalType.customClass });
            this.resetPetal(petal);
            this.petals.push(petal);
            this.placeholder.appendChild(petal.el);
        }
    }

    updateFrame() {
        for (let i = 0; i < this.petals.length; i++) {
            this.updatePetal(this.petals[i]);
        }
        requestAnimationFrame(this.updateFrame);
    }
}

let blossomSceneInstance = null;

function initBlossomScene() {
    if (blossomSceneInstance) {
        return blossomSceneInstance;
    }

    const container = document.getElementById('blossom_container');
    if (!container) {
        return null;
    }

    container.textContent = '';
    blossomSceneInstance = new BlossomScene({
        id: 'blossom_container',
        petalsTypes: BLOSSOM_VARIANTS.map((customClass) => ({ customClass })),
        numPetals: 18
    });

    return blossomSceneInstance;
}

//--------------animations.js-----------------
function inView(element, callback, options = {}) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry);
                if (options.once !== false) {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, {
        threshold: options.amount || 0.1,
        rootMargin: options.rootMargin || '0px'
    });
    observer.observe(element);
    return () => observer.unobserve(element);
}

function animateElement(element, props, options = {}) {
    if (typeof anime === 'undefined') return;
    const animeProps = {};
    if (props.opacity) animeProps.opacity = props.opacity;
    if (props.x !== undefined) animeProps.translateX = props.x;
    if (props.y !== undefined) animeProps.translateY = props.y;
    if (props.scale) animeProps.scale = props.scale;
    return anime({
        targets: element,
        ...animeProps,
        duration: (options.duration || 0.8) * 1000,
        delay: (options.delay || 0) * 1000,
        easing: options.easing || 'easeOutExpo'
    });
}

function initPageAnimations() {
    setTimeout(() => {
        initHeroAnimations();
        initSkillAnimations();
        initTimelineAnimations();
        initProjectAnimations();
        initProjectModal();
        initScrollAnimations();
        initContactAnimations();
        animateStats();
        initBlossomScene();
        initSmoothScroll();
    }, 300);
}

function initHeroAnimations() {
    const forceHeroVisible = () => {
        const heroSelectors = [
            '.hero-logo-img',
            '.hero-title',
            '.hero-description',
            '.hero-buttons',
            '.hero-social',
            '#profileImage'
        ];

        heroSelectors.forEach((selector) => {
            const element = document.querySelector(selector);
            if (!element) {
                return;
            }

            element.style.opacity = '1';
            element.style.visibility = 'visible';
            element.style.transform = 'none';
        });
    };

    if (typeof anime === 'undefined') {
        forceHeroVisible();
        return;
    }
    
    const heroLogo = document.querySelector('.hero-logo-img');
    if (heroLogo) {
        anime({
            targets: heroLogo,
            opacity: [0, 1],
            translateY: [20, 0],
            delay: 500,
            duration: 1500,
            easing: 'easeOutExpo'
        });
    }
    
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        anime({
            targets: heroTitle,
            opacity: [0, 1],
            translateX: [-30, 0],
            delay: 800,
            duration: 1000,
            easing: 'easeOutExpo'
        });
    }
    
    const heroDescription = document.querySelector('.hero-description');
    if (heroDescription) {
        anime({
            targets: heroDescription,
            opacity: [0, 1],
            translateY: [20, 0],
            delay: 1200,
            duration: 1000,
            easing: 'easeOutExpo'
        });
    }
    
    const heroButtons = document.querySelectorAll('.hero-buttons .btn');
    if (heroButtons.length > 0) {
        anime({
            targets: heroButtons,
            opacity: [0, 1],
            scale: [0.8, 1],
            delay: anime.stagger(100, {start: 1500}),
            duration: 800,
            easing: 'easeOutBack'
        });
    }
    
    const socialIcons = document.querySelectorAll('.hero-social .social-icon');
    if (socialIcons.length > 0) {
        anime({
            targets: socialIcons,
            opacity: [0, 1],
            scale: [0, 1],
            rotate: [180, 0],
            delay: anime.stagger(100, {start: 2000}),
            duration: 800,
            easing: 'easeOutBack'
        });
    }
    
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        anime({
            targets: profileImage,
            opacity: [0, 1],
            scale: [0.8, 1],
            rotate: [180, 0],
            delay: 1000,
            duration: 1500,
            easing: 'easeOutElastic(1, .8)'
        });
        
        profileImage.addEventListener('mouseenter', () => {
            anime({
                targets: profileImage,
                scale: [1, 1.1],
                rotate: [0, 5],
                duration: 500,
                easing: 'easeOutElastic(1, .8)'
            });
        });
        
        window.setTimeout(forceHeroVisible, 4500);
        
        profileImage.addEventListener('mouseleave', () => {
            anime({
                targets: profileImage,
                scale: [1.1, 1],
                rotate: [5, 0],
                duration: 500,
                easing: 'easeOutElastic(1, .8)'
            });
        });
    }
    
    const badges = document.querySelectorAll('.floating-badge');
    if (badges.length > 0) {
        badges.forEach((badge, index) => {
            anime({
                targets: badge,
                opacity: [0, 1],
                scale: [0, 1],
                delay: 1500 + (index * 200),
                duration: 800,
                easing: 'easeOutBack'
            });
        });
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function initSkillAnimations() {
    const skillsSection = document.getElementById('skills');
    if (!skillsSection) return;
    
    const skillItems = skillsSection.querySelectorAll('.skill-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillItem = entry.target;
                const progressBar = skillItem.querySelector('.skill-progress');
                const percentElement = skillItem.querySelector('.skill-percent');
                const percent = parseInt(skillItem.getAttribute('data-percent') || 0);
                
                if (progressBar && typeof anime !== 'undefined') {
                    anime({
                        targets: progressBar,
                        width: ['0%', percent + '%'],
                        duration: 2000,
                        easing: 'easeOutExpo',
                        delay: 300
                    });
                    
                    anime({
                        targets: { value: 0 },
                        value: percent,
                        duration: 2000,
                        easing: 'easeOutExpo',
                        delay: 300,
                        update: function(anim) {
                            if (percentElement) {
                                percentElement.textContent = Math.floor(anim.animatables[0].target.value) + '%';
                            }
                        }
                    });
                }
                observer.unobserve(skillItem);
            }
        });
    }, { threshold: 0.5 });
    
    skillItems.forEach(item => observer.observe(item));
}

function initTimelineAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        inView(item, () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: item,
                    opacity: [0, 1],
                    translateX: [-50, 0],
                    delay: index * 150,
                    duration: 1000,
                    easing: 'easeOutExpo'
                });
            } else {
                animateElement(item, { opacity: [0, 1], x: [-50, 0] }, { duration: 0.8, delay: index * 0.1 });
            }
        }, { amount: 0.3 });
    });
}

function initProjectAnimations() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        inView(card, () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: card,
                    opacity: [0, 1],
                    translateY: [50, 0],
                    scale: [0.9, 1],
                    delay: index * 100,
                    duration: 1000,
                    easing: 'easeOutExpo'
                });
            } else {
                animateElement(card, { opacity: [0, 1], y: [50, 0], scale: [0.9, 1] }, { duration: 0.8, delay: index * 0.1 });
            }
        }, { amount: 0.2 });
        
        card.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime({ targets: card, scale: [1, 1.02], duration: 300, easing: 'easeOutQuad' });
            }
        });
        
        card.addEventListener('mouseleave', () => {
            if (typeof anime !== 'undefined') {
                anime({ targets: card, scale: [1.02, 1], duration: 300, easing: 'easeOutQuad' });
            }
        });
    });
}

function initProjectModal() {
    const modal = document.getElementById('projectModal');
    if (!modal) return;
    const modalModel = modal.querySelector('#modalModel');
    const modalTitle = modal.querySelector('#modalTitle');
    const modalDescription = modal.querySelector('#modalDescription');
    const closeBtn = modal.querySelector('.feedback-modal-close');

    const openModal = (card) => {
        const modelEl = card.querySelector('.project-model');
        const titleEl = card.querySelector('.project-title');
        const src = modelEl ? modelEl.getAttribute('src') : '';
        const title = titleEl ? titleEl.textContent.trim() : 'Untitled';
        const desc = card.getAttribute('data-desc') || `No description available for ${title}.`;

        if (modalModel && src) {
            modalModel.setAttribute('src', src);
                    if (typeof modalModel.jumpCameraToGoal === 'function') {
                        requestAnimationFrame(() => {
                            modalModel.jumpCameraToGoal();
                    });
            }
        }

        if (modalTitle) modalTitle.textContent = title;
        if (modalDescription) modalDescription.textContent = desc;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
    };

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        if (modalModel) {
            modalModel.setAttribute('src', '');
        }
    };

    document.querySelectorAll('.project-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => openModal(card));
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
}

function initScrollAnimations() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        inView(section, () => {
            const sectionHeader = section.querySelector('.section-header');
            if (sectionHeader && typeof anime !== 'undefined') {
                anime({
                    targets: sectionHeader,
                    opacity: [0, 1],
                    translateY: [-20, 0],
                    duration: 600,
                    easing: 'easeOutExpo'
                });
            }
        }, { amount: 0.2 });
    });
    
    const cards = document.querySelectorAll('.card, .project-card, .contact-item');
    cards.forEach((card, index) => {
        inView(card, () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: card,
                    opacity: [0, 1],
                    translateY: [30, 0],
                    delay: index * 30,
                    duration: 500,
                    easing: 'easeOutExpo'
                });
            } else {
                animateElement(card, { opacity: [0, 1], y: [50, 0] }, { duration: 0.6, delay: index * 0.05 });
            }
        }, { amount: 0.2 });
    });
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count') || 0);
        inView(stat, () => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: { value: 0 },
                    value: target,
                    duration: 2000,
                    easing: 'easeOutExpo',
                    update: function(anim) {
                        stat.textContent = Math.floor(anim.animatables[0].target.value);
                    }
                });
            }
        }, { amount: 0.5 });
    });
}

function initContactAnimations() {
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            if (typeof anime !== 'undefined') {
                anime({ targets: item, scale: [1, 1.02], duration: 200, easing: 'easeOutQuad' });
            }
        });
        item.addEventListener('mouseleave', () => {
            if (typeof anime !== 'undefined') {
                anime({ targets: item, scale: [1.02, 1], duration: 200, easing: 'easeOutQuad' });
            }
        });
    });
}

function initSmoothScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.main-header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                if (typeof anime !== 'undefined') {
                    anime({
                        targets: window,
                        scrollTop: targetPosition,
                        duration: 800,
                        easing: 'easeInOutQuad'
                    });
                } else {
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    let currentSection = '';
    window.addEventListener('scroll', () => {
        const scrollPos = window.scrollY + 150;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                if (currentSection !== sectionId) {
                    currentSection = sectionId;
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            }
        });
    });
}

// =========================================================================
// DYNAMIC GAME SHOWCASE LOGIC 
// =========================================================================
async function initShowcase() {
    const track = document.getElementById('showcaseThumbnails');
    const mainImg = document.getElementById('showcaseMainImg');
    const titleEl = document.getElementById('showcaseTitle');
    const descEl = document.getElementById('showcaseDesc');
    const prevBtn = document.querySelector('.showcase-prev');
    const nextBtn = document.querySelector('.showcase-next');

    if (!track || !mainImg || !window.Appwrite) return;

    try {
        const { Query } = window.Appwrite;
        const tablesDb = await getAppwriteTablesDb();

        // 1. Fetch the cards from Appwrite, ordered by your custom number!
        const response = await tablesDb.listRows({
            databaseId: APPWRITE_CONFIG.databaseId,
            tableId: APPWRITE_CONFIG.showcaseTableId,
            queries: [
                Query.orderAsc('order'),
                Query.limit(15) 
            ]
        });

        const rows = Array.isArray(response?.rows) ? response.rows : [];

        // If the database is empty, stop and just show the hardcoded HTML
        if (rows.length === 0) return; 

        // 2. Clear out any hardcoded HTML from the track
        track.innerHTML = '';

        // 3. Build the new Thumbnails dynamically
        rows.forEach((row, index) => {
            const imageUrl = row.imageId 
                ? `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${row.imageId}/view?project=${APPWRITE_CONFIG.projectId}`
                : '';

            const thumb = document.createElement('div');
            // Make the first item active by default
            thumb.className = `showcase-thumb ${index === 0 ? 'active' : ''}`;
            thumb.setAttribute('data-title', row.title);
            thumb.setAttribute('data-desc', row.description);
            thumb.setAttribute('data-src', imageUrl);

            // Notice we removed the <span> label here, keeping it super clean!
            thumb.innerHTML = `
                <div class="showcase-thumb-img-wrap">
                    <img src="${imageUrl}" alt="${escapeHtml(row.title)}" loading="lazy">
                </div>
            `;

            track.appendChild(thumb);
        });

        // 4. Set the Main Image canvas to the very first item in your database
        const firstRow = rows[0];
        const firstImgUrl = firstRow.imageId 
            ? `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${firstRow.imageId}/view?project=${APPWRITE_CONFIG.projectId}`
            : '';
        mainImg.src = firstImgUrl;
        titleEl.textContent = firstRow.title;
        descEl.textContent = firstRow.description;

        // 5. Re-bind all the click logic!
        const thumbnails = Array.from(document.querySelectorAll('.showcase-thumb'));
        let currentIndex = 0;

        const updateShowcase = (index) => {
            thumbnails.forEach(t => t.classList.remove('active'));
            
            const thumb = thumbnails[index];
            thumb.classList.add('active');

            mainImg.style.opacity = '0.4';
            setTimeout(() => {
                mainImg.src = thumb.getAttribute('data-src');
                titleEl.textContent = thumb.getAttribute('data-title');
                descEl.textContent = thumb.getAttribute('data-desc');
                mainImg.style.opacity = '1';
            }, 200);

            // --- REPLACED SCROLL LOGIC BELOW ---
            if (track) {
                const thumbLeft = thumb.offsetLeft;
                const thumbWidth = thumb.offsetWidth;
                const trackWidth = track.clientWidth;

                // Calculates the exact center of the track minus half the thumbnail width
                const centerPosition = thumbLeft - (trackWidth / 2) + (thumbWidth / 2);

                track.scrollTo({ left: centerPosition, behavior: 'smooth' });
            }
            // -----------------------------------
        };

        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                currentIndex = index;
                updateShowcase(currentIndex);
            });
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex > 0) ? currentIndex - 1 : thumbnails.length - 1;
                updateShowcase(currentIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex < thumbnails.length - 1) ? currentIndex + 1 : 0;
                updateShowcase(currentIndex);
            });
        }

    } catch (error) {
        console.error("Failed to fetch dynamic showcase:", error);
    }
}

window.Animations = {
    initSmoothScroll
};

// =========================================================================
// LIGHTBOX CONTROLLER
// =========================================================================
function initLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    const closeBtn = document.querySelector('.lightbox-close');

    if (!lightbox) return;

    const closeLightbox = () => {
        lightbox.classList.remove('is-active');
        lightbox.setAttribute('aria-hidden', 'true');
        // Clear src after fade out so it doesn't flash the old image next time
        setTimeout(() => {
            document.getElementById('lightboxImage').src = '';
        }, 300);
    };

    // Close on X button click
    closeBtn.addEventListener('click', closeLightbox);
    
    // Close if clicking the dark background (outside the image)
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('is-active')) {
            closeLightbox();
        }
    });
}

// =========================================================================
// UPDATED DYNAMIC PATCH NOTES SYSTEM
// =========================================================================
async function loadPatchNotes() {
    const container = document.getElementById('dynamicPatchNotes');
    if (!container || !window.Appwrite) return;

    try {
        const { Query } = window.Appwrite;
        const tablesDb = await getAppwriteTablesDb();
        
        // Fetch rows sorted by Appwrite's built-in creation date
        const response = await tablesDb.listRows({
            databaseId: APPWRITE_CONFIG.databaseId,
            tableId: APPWRITE_CONFIG.patchNotesTableId,
            queries: [
                Query.orderDesc('$createdAt'),
                Query.limit(10) // Show last 10 updates
            ]
        });

        const rows = Array.isArray(response?.rows) ? response.rows : [];

        if (rows.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No recent updates available.</p>';
            return;
        }

        container.innerHTML = ''; // Clear loading state

        rows.forEach(row => {
            // Parse the changes JSON array safely
            let changes = [];
            try {
                changes = JSON.parse(row.changes || '[]');
            } catch (e) {
                console.error("Failed to parse changes for row", row.$id);
            }

            // Generate HTML for the bullet points
            const changesHTML = changes.map(change => `
                <li>
                    <span class="badge badge-${change.tag.toLowerCase()}">${escapeHtml(change.tag)}</span>
                    ${escapeHtml(change.text)}
                </li>
            `).join('');

            // Format the automatic $createdAt date nicely
            const dateObj = new Date(row.$createdAt);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

            // Generate the image tag utilizing the .patch-image class
            const imageHTML = row.image_id 
                ? `<img src="${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageBucketId}/files/${row.image_id}/view?project=${APPWRITE_CONFIG.projectId}" alt="${escapeHtml(row.title)}" class="patch-image">` 
                : '';

            // Build the full card
            const article = document.createElement('article');
            article.className = 'patch-card fade-in';
            article.innerHTML = `
                <div class="patch-header">
                    <h3 class="patch-version">${escapeHtml(row.version)} - ${escapeHtml(row.title)}</h3>
                    <span class="patch-date">${formattedDate}</span>
                </div>
                ${imageHTML}
                <ul class="patch-list">
                    ${changesHTML}
                </ul>
            `;
            
            // --- LIGHTBOX CLICK LOGIC ---
            const imgElement = article.querySelector('.patch-image');
            if (imgElement) {
                imgElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevents clicking the image from doing anything else
                    const lightbox = document.getElementById('imageLightbox');
                    const lightboxImg = document.getElementById('lightboxImage');
                    
                    lightboxImg.src = imgElement.src;
                    lightbox.classList.add('is-active');
                    lightbox.setAttribute('aria-hidden', 'false');
                });
            }
            // -----------------------------
            
            container.appendChild(article);
        });

        // Re-trigger scroll animations for the newly added dynamic content
        initScrollEffects(); 

    } catch (error) {
        console.error('Failed to load patch notes:', error);
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Failed to load updates. Please check back later.</p>';
    }
}