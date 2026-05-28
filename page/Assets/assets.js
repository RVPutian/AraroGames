// Asset page specific JS: carousel scrolling and active-card rotation gating.
(function () {
  var activeCard = null;
  var modelLifecycleObserver = null;
  var modelUnloadTimers = new WeakMap();
  var modelRuntimeState = new WeakMap();
  var lowPowerMode = false;
  var priorityCardLimit = 8;

  function detectLowPowerMode() {
    var widthMatch = window.matchMedia('(max-width: 900px)').matches;
    var coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0 && navigator.deviceMemory <= 4;
    var lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;

    return reducedMotion || coarsePointer || widthMatch || lowMemory || lowCpu;
  }

  function getViewerSource(viewer) {
    return viewer.getAttribute('data-src') || viewer.dataset.src || viewer.getAttribute('src') || '';
  }

  function markViewerSource(viewer, forceEager) {
    var src = getViewerSource(viewer);
    if (!src) {
      return;
    }

    if (!viewer.dataset.src) {
      viewer.dataset.src = src;
    }

    viewer.dataset.lazyPrepared = '1';
    viewer.setAttribute('loading', forceEager ? 'eager' : 'lazy');
    viewer.setAttribute('reveal', 'auto');
    viewer.setAttribute('interaction-prompt', 'none');
    viewer.setAttribute('disable-pan', '');
    viewer.setAttribute('disable-zoom', '');
    viewer.removeAttribute('camera-controls');
    viewer.removeAttribute('auto-rotate');
  }

  function applyViewerQuality(viewer) {
    if (!viewer) {
      return;
    }

    if (lowPowerMode) {
      viewer.setAttribute('exposure', '0.72');
      viewer.setAttribute('shadow-intensity', '0');
      viewer.style.filter = 'none';
      return;
    }

    viewer.setAttribute('exposure', viewer.getAttribute('exposure') || '0.88');
    viewer.setAttribute('shadow-intensity', viewer.closest('.maps-grid') ? '0' : '0.35');
    viewer.style.filter = 'none';
  }

  function loadViewer(viewer) {
    var src = viewer.getAttribute('data-src') || viewer.dataset.src || getViewerSource(viewer);
    if (src && !viewer.getAttribute('src')) {
      viewer.setAttribute('src', src);
      var card = viewer.closest('.project-card');
      if (card) {
        card.classList.add('is-loading');
      }
    }
  }

  function getModelState(viewer) {
    if (!viewer) {
      return null;
    }

    if (!modelRuntimeState.has(viewer)) {
      modelRuntimeState.set(viewer, {
        mode: 'idle'
      });
    }

    return modelRuntimeState.get(viewer);
  }

  function pauseViewer(viewer) {
    if (!viewer) {
      return;
    }

    var state = getModelState(viewer);
    if (state && state.mode === 'paused') {
      return;
    }

    try {
      if (typeof viewer.pause === 'function') {
        viewer.pause();
      }
    } catch (error) {
      // ignore pause failures
    }

    viewer.removeAttribute('auto-rotate');
    viewer.removeAttribute('camera-controls');

    if (state) {
      state.mode = 'paused';
    }
  }

  function playViewer(viewer, shouldAutoRotate) {
    if (!viewer) {
      return;
    }

    var state = getModelState(viewer);
    if (state && state.mode === 'active' && (!shouldAutoRotate || state.autoRotate === shouldAutoRotate)) {
      return;
    }

    try {
      if (typeof viewer.play === 'function') {
        viewer.play();
      }
    } catch (error) {
      // ignore play failures
    }

    if (shouldAutoRotate) {
      viewer.setAttribute('auto-rotate', '');
      viewer.setAttribute('camera-controls', '');
    }

    if (state) {
      state.mode = 'active';
      state.autoRotate = Boolean(shouldAutoRotate);
    }
  }

  function unloadViewer(viewer) {
    if (!viewer) {
      return;
    }

    var card = viewer.closest('.project-card');
    if (card && card.getAttribute('data-retain-model') === '1') {
      pauseViewer(viewer);
      return;
    }

    pauseViewer(viewer);
    if (viewer.getAttribute('src')) {
      viewer.removeAttribute('src');
    }
  }

  function scheduleUnload(card, viewer) {
    if (!viewer) {
      return;
    }

    if (card && card.getAttribute('data-retain-model') === '1') {
      pauseViewer(viewer);
      return;
    }

    if (modelUnloadTimers.has(viewer)) {
      window.clearTimeout(modelUnloadTimers.get(viewer));
    }

    modelUnloadTimers.set(viewer, window.setTimeout(function () {
      if (!card.classList.contains('is-active') && !card.classList.contains('is-visible')) {
        unloadViewer(viewer);
      } else {
        pauseViewer(viewer);
      }
      modelUnloadTimers.delete(viewer);
    }, lowPowerMode ? 500 : 1200));
  }

  function updateViewerState(card, isActive, forceEager) {
    var viewer = card.querySelector('model-viewer');
    if (!viewer) {
      return;
    }

    markViewerSource(viewer, forceEager);
    applyViewerQuality(viewer);

    card.classList.toggle('is-active', isActive);
    card.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    if (isActive) {
      playViewer(viewer, true);
    } else {
      pauseViewer(viewer);
    }
  }

  function updateViewportState(card, isVisible, forceEager) {
    var viewer = card.querySelector('model-viewer');
    if (!viewer) {
      return;
    }

    card.classList.toggle('is-visible', isVisible);

    if (isVisible) {
      markViewerSource(viewer, forceEager);
      applyViewerQuality(viewer);
      loadViewer(viewer);

      if (card.classList.contains('is-active')) {
        playViewer(viewer, true);
      } else {
        pauseViewer(viewer);
      }
      return;
    }

    if (card.classList.contains('is-active')) {
      pauseViewer(viewer);
      return;
    }

    scheduleUnload(card, viewer);
  }

  function hydrateVisibleCards() {
    var viewportTop = 0;
    var viewportBottom = window.innerHeight || document.documentElement.clientHeight || 0;
    var preloadMargin = lowPowerMode ? 180 : 320;

    document.querySelectorAll('.project-card').forEach(function (card) {
      var rect = card.getBoundingClientRect();
      var isNearViewport = rect.bottom >= viewportTop - preloadMargin && rect.top <= viewportBottom + preloadMargin;

      if (isNearViewport) {
        updateViewportState(card, true, true);
      }
    });
  }

  function getCardGrid(ctrl) {
    var windowEl = ctrl.previousElementSibling;
    return windowEl ? windowEl.querySelector('.projects-grid') : null;
  }

  function getScrollStep(grid) {
    var card = grid.querySelector('.project-card:not(.is-active)') || grid.querySelector('.project-card');
    if (!card) {
      return 320;
    }

    var computedGap = parseFloat(getComputedStyle(grid).gap || '0') || 0;
    return card.getBoundingClientRect().width + computedGap;
  }

  function initCarousels() {
    document.querySelectorAll('.projects-carousel-controls').forEach(function (ctrl) {
      var grid = getCardGrid(ctrl);
      if (!grid) {
        return;
      }

      var prev = ctrl.querySelector('.carousel-prev');
      var next = ctrl.querySelector('.carousel-next');

      if (prev) {
        prev.addEventListener('click', function () {
          grid.scrollBy({ left: -getScrollStep(grid), behavior: 'smooth' });
          prev.classList.add('is-bouncing');
          window.setTimeout(function () {
            prev.classList.remove('is-bouncing');
          }, 220);
        });
      }

      if (next) {
        next.addEventListener('click', function () {
          grid.scrollBy({ left: getScrollStep(grid), behavior: 'smooth' });
          next.classList.add('is-bouncing');
          window.setTimeout(function () {
            next.classList.remove('is-bouncing');
          }, 220);
        });
      }
    });
  }

  function getCardMeta(card) {
    var model = card.querySelector('model-viewer');
    var description = card.getAttribute('data-desc') || (model ? model.getAttribute('alt') : '');

    if (!description) {
      description = 'Select this card to unlock manual rotation. Use drag gestures once it is active.';
    }

    if (!card.querySelector('.project-description')) {
      var descEl = document.createElement('p');
      descEl.className = 'project-description';
      descEl.textContent = description;
      card.querySelector('.project-content').appendChild(descEl);
    }
  }

  function setCardInteractiveState(card, isActive) {
    card.classList.toggle('is-active', isActive);
    card.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    updateViewerState(card, isActive);
  }

  function clearActiveCard() {
    if (!activeCard) {
      return;
    }

    setCardInteractiveState(activeCard, false);
    activeCard = null;
  }

  function activateCard(card) {
    if (!card || activeCard === card) {
      return;
    }

    if (activeCard) {
      setCardInteractiveState(activeCard, false);
    }

    activeCard = card;
    setCardInteractiveState(card, true);

    window.requestAnimationFrame(function () {
      if (typeof card.scrollIntoView === 'function') {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });
  }

  function initProjectCards() {
    document.querySelectorAll('.project-card').forEach(function (card, index) {
      var content = card.querySelector('.project-content');
      var model = card.querySelector('model-viewer');

      if (!content || !model) {
        return;
      }

      if (card.closest('.models-group') && card.closest('.models-group').querySelector('.models-subtitle-enemies')) {
        card.setAttribute('data-retain-model', '1');
      }

      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');

      markViewerSource(model, index < priorityCardLimit);
      applyViewerQuality(model);
      card.classList.add('is-loading');

      try {
        model.style.display = 'block';
        model.style.width = '100%';
        model.style.height = '100%';
        model.style.filter = 'none';
      } catch (error) {
        // ignore render style failures
      }

      model.removeAttribute('camera-controls');
      model.setAttribute('disable-pan', '');
      model.setAttribute('disable-zoom', '');
      model.setAttribute('loading', index < priorityCardLimit ? 'eager' : 'lazy');
      model.setAttribute('reveal', index < priorityCardLimit ? 'auto' : 'interaction');

      model.addEventListener('load', function () {
        card.classList.remove('is-loading');
      });

      getCardMeta(card);

      card.addEventListener('click', function (event) {
        if (activeCard === card) {
          clearActiveCard();
          return;
        }

        activateCard(card);
      });

      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateCard(card);
        }
      });
    });
  }

  function initRotationDismissal() {
    document.addEventListener('pointerdown', function (event) {
      if (!activeCard) {
        return;
      }

      if (!activeCard.contains(event.target)) {
        clearActiveCard();
      }
    });
  }

  function renderMapsShowcase() {
    var mapsGrid = document.getElementById('mapsGrid');
    if (!mapsGrid) {
      return;
    }

    var mapsData = [
      {
        image: 'img/Tutorial.svg',
        title: 'Tanaw Trail',
        description: 'Nestled within a peaceful yet mysterious forest, Tanaw Trail serves as the opening area of the journey in KulturaQuest, where the protagonist, Lam, first awakens confused and unaware of the dangers ahead. Surrounded by towering trees and the distant sounds of nature, the trail introduces players to the game’s atmosphere while teaching the fundamentals of movement, exploration, interaction, and the use of the slingshot as they begin their adventure into the unknown.'
      },
      {
        image: 'img/Level1.svg',
        title: 'Tahanan',
        description: 'This area serves as the Players Home, acting as the primary narrative start for the players journey. The Tahanan map is designed with multiple interactive layouts, featuring multiple Minigame Nodes (e.g., Water Pump and Dodge the Tsinelas), Chore-Based Objectives (e.g., Feed the Chicken) and a Puzzle (e.g. Tagutaguan). The Player Must Complete the Quest to access the next zone which is the ‘Luntian Woods’.'
      },
      {
        image: 'img/Level2.svg',
        title: 'Luntian Woods',
        description: 'The Luntian Woods zone functions as the first major Level, introducing the player to one of the game’s quest-giver, the Diwata Makilia. The level design emphasizes an Exploration-Based Questing, requiring the player to navigate a dense, multi-pathed forest to locate specific Quest Items demanded by the Unique Npc. Unlike the tutorial, this area utilizes Natural Gating, where the player must successfully traverse organic terrain by using the blessing he will acquire by completing the Npc’s quest to grow beantalks, vines ropes and vine bridges. The integration of a central landmark provides a Visual Anchor, assisting in spatial orientation while emphasizing the Heritage Showcase aspect of the game.'
      },
      {
        image: 'img/Level3.svg',
        title: 'Hamog Highlands',
        description: 'The Hamog Highlands map expands the players Kwaderno (Cultural Journal) through the inclusion of two new distinct landmarks: the Waterfall and the Rice Terraces. These landmarks are placed at the terminals of diverging paths to reward player exploration. This level serves as the primary introduction to the Compassion Blessing mechanic. The spatial design is centered around the NPC Piya, who initiates a Search Quest for Maisig. Unlike previous levels, Hamog Highlands features Enemies that serve a dual purpose: initially as obstacles, and subsequently as Environmental Puzzle Tools. '
      },
      {
        image: 'img/Level4.svg',
        title: 'SamutSari Village',
        description: 'Samut-Sari Village is the concluding level, divided into three sections to pace the narrative. It begins with social and navigational challenges, requiring players to perform the respect-based Mano Po before gathering Rattan Bundles. The second phase highlights daily rituals through a Pound the Palay minigame and a Tapuy Jar arrangement puzzle. Finally, players face a branching resolution: engage in the Tayaw Dance minigame or proceed directly to the games outro.'
      }
    ];

    mapsGrid.innerHTML = mapsData.map(function (map, index) {
      var imageSource = map.image || '../../assets/img/UserDefault.png';
      return [
        '<article class="project-card map-card" data-map-card data-map-index="0">',
        '  <div class="project-image">',
        '    <div class="map-image-stack">',
        '      <img class="map-image is-active" src="' + imageSource + '" alt="' + map.title + ' map preview" loading="lazy" decoding="async" fetchpriority="low">',
        '    </div>',
        '  </div>',
        '  <div class="project-content">',
        '    <h3 class="project-title">' + map.title + '</h3>',
        '    <p class="project-description">' + map.description + '</p>',
        '  </div>',
        '</article>'
      ].join('');
    }).join('');

    var mapCards = mapsGrid.querySelectorAll('[data-map-card]');
    var activeMapCard = null;

    function setMapCardState(card, isActive) {
      if (!card) {
        return;
      }

      card.classList.toggle('is-active', isActive);
      card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }

    function activateMapCard(card) {
      if (!card) {
        return;
      }

      if (activeMapCard && activeMapCard !== card) {
        setMapCardState(activeMapCard, false);
      }

      var shouldActivate = activeMapCard !== card;
      activeMapCard = shouldActivate ? card : null;
      setMapCardState(card, shouldActivate);
    }

    mapCards.forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');

      card.addEventListener('click', function () {
        activateMapCard(card);
      });

      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateMapCard(card);
        }
      });
    });

    document.addEventListener('pointerdown', function (event) {
      if (!activeMapCard) {
        return;
      }

      if (!activeMapCard.contains(event.target)) {
        setMapCardState(activeMapCard, false);
        activeMapCard = null;
      }
    });

    if (mapCards.length > 0) {
      activateMapCard(mapCards[0]);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    lowPowerMode = detectLowPowerMode();
    initCarousels();
    initProjectCards();
    initRotationDismissal();
    renderMapsShowcase();

    modelLifecycleObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        updateViewportState(entry.target, entry.isIntersecting);
      });
    }, {
      root: null,
      rootMargin: lowPowerMode ? '120px 0px 160px 0px' : '240px 0px 260px 0px',
      threshold: 0.08
    });

    document.querySelectorAll('.project-card').forEach(function (card) {
      if (modelLifecycleObserver) {
        modelLifecycleObserver.observe(card);
      }
    });

    hydrateVisibleCards();

    document.querySelectorAll('model-viewer').forEach(function (viewer, index) {
      try {
        viewer.style.display = 'block';
        viewer.style.width = '100%';
        viewer.style.height = '100%';
        viewer.style.filter = 'none';
        markViewerSource(viewer, index < priorityCardLimit);
        applyViewerQuality(viewer);
        viewer.setAttribute('loading', index < priorityCardLimit ? 'eager' : 'lazy');
        viewer.setAttribute('reveal', index < priorityCardLimit ? 'auto' : 'interaction');
      } catch (error) {
        // ignore rendering style failures
      }
    });
  });
})();
