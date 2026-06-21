(function () {
  const LOADER_STORAGE_KEY = 'kulturaquest-loader-seen';
  const REDUCED_MOTION_QUERY = window.matchMedia('(prefers-reduced-motion: reduce)');

  let loaderElement = null;
  let loaderFinished = false;
  let fallbackTimerId = null;

  function storageGet(key) {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      return false;
    }

    return true;
  }

  function hasSeenLoader() {
    return storageGet(LOADER_STORAGE_KEY) === '1';
  }

  function markLoaderSeen() {
    storageSet(LOADER_STORAGE_KEY, '1');
  }

  function runPageAnimations() {
    if (typeof initPageAnimations === 'function') {
      initPageAnimations();
    }
  }

  function setPlantInitialState() {
    // Handled strictly by CSS to prevent FOUC (Flash of Unstyled Content)
    return true;
  }

  function runAfterWindowLoad(callback) {
    if (document.readyState === 'complete') {
      window.requestAnimationFrame(callback);
      return;
    }

    window.addEventListener('load', () => {
      window.requestAnimationFrame(callback);
    }, { once: true });
  }

  function startPlantAnimation() {
    const shadow = document.getElementById('shadow');
    const tree = document.getElementById('tree');

    // Fallback if elements aren't found or browser doesn't support Web Animations API
    if (!shadow || !tree || !shadow.animate) {
      finishLoader();
      return;
    }

    // Native Browser Animation API (Zero external libraries, no forced reflows)
    shadow.animate([
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
    ], { 
        duration: 1000, 
        easing: 'ease-out', 
        fill: 'forwards' 
    });

    const treeAnim = tree.animate([
        { transform: 'scale(0) translateY(20px)', opacity: 0 },
        { transform: 'scale(1) translateY(0)', opacity: 1 }
    ], { 
        duration: 3400, 
        delay: 80, 
        easing: 'cubic-bezier(0.215, 0.610, 0.355, 1.000)', 
        fill: 'forwards' 
    });

    // When the tree animation finishes, trigger the rest of the site load
    treeAnim.onfinish = finishLoader;
  }

  function unlockPage() {
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  }

  function cleanupLoader() {
    if (fallbackTimerId) {
      window.clearTimeout(fallbackTimerId);
      fallbackTimerId = null;
    }
  }

  function removeLoaderElement() {
    if (loaderElement && loaderElement.parentNode) {
      loaderElement.parentNode.removeChild(loaderElement);
    }
  }

  function finishLoader() {
    if (loaderFinished) {
      return;
    }

    loaderFinished = true;
    cleanupLoader();

    if (!loaderElement) {
      unlockPage();
      runPageAnimations();
      return;
    }

    loaderElement.classList.add('is-hiding');
    loaderElement.setAttribute('aria-hidden', 'true');
    unlockPage();

    const finalize = () => {
      removeLoaderElement();
      runPageAnimations();
    };

    if (REDUCED_MOTION_QUERY.matches) {
      finalize();
      return;
    }

    loaderElement.addEventListener('transitionend', (event) => {
      if (event.target === loaderElement) {
        finalize();
      }
    }, { once: true });

    fallbackTimerId = window.setTimeout(finalize, 1100);
  }

  function skipLoader() {
    document.documentElement.classList.add('loader-skip');
    unlockPage();
    removeLoaderElement();
    runPageAnimations();
  }

  function initLoader() {
    loaderElement = document.getElementById('loader');

    if (!loaderElement) {
      unlockPage();
      runPageAnimations();
      return;
    }

    if (hasSeenLoader()) {
      skipLoader();
      return;
    }

    markLoaderSeen();

    if (setPlantInitialState()) {
      runAfterWindowLoad(startPlantAnimation);
    } else {
      runAfterWindowLoad(finishLoader);
    }

    window.addEventListener('pageshow', (event) => {
      if (event.persisted && hasSeenLoader()) {
        skipLoader();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader, { once: true });
  } else {
    initLoader();
  }
})();