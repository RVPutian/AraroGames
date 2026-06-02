(function () {
  const LOADER_STORAGE_KEY = 'kulturaquest-loader-seen';
  const REDUCED_MOTION_QUERY = window.matchMedia('(prefers-reduced-motion: reduce)');

  let loaderElement = null;
  let loaderTimeline = null;
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
    if (typeof TweenMax === 'undefined') {
      return false;
    }

    TweenMax.set('#shadow', {
      scale: 0,
      autoAlpha: 0,
      transformOrigin: '15px 8px'
    });
    TweenMax.set('#tree', {
      scale: 0,
      y: 20,
      autoAlpha: 0,
      transformOrigin: '154px bottom'
    });

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
    if (typeof TimelineMax === 'undefined') {
      finishLoader();
      return;
    }

    if (loaderTimeline) {
      loaderTimeline.kill();
      loaderTimeline = null;
    }

    loaderTimeline = new TimelineMax({
      delay: 0.28,
      onComplete: finishLoader
    });

    loaderTimeline
      .to('#shadow', 1.0, { scale: 1, autoAlpha: 1, ease: Power2.easeOut }, 0)
      .to('#tree', 3.4, { scale: 1, y: 0, autoAlpha: 1, ease: Power3.easeOut }, 0.08);
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

    if (loaderTimeline) {
      loaderTimeline.kill();
      loaderTimeline = null;
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
