// Asset page specific JS: carousel scrolling and active-card rotation gating.
(function () {
  var activeCard = null;

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
    var model = card.querySelector('model-viewer');

    card.classList.toggle('is-active', isActive);
    card.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    if (!model) {
      return;
    }

    if (isActive) {
      model.setAttribute('camera-controls', '');
      model.setAttribute('disable-pan', '');
      model.removeAttribute('auto-rotate');
    } else {
      model.removeAttribute('camera-controls');
      model.setAttribute('disable-pan', '');
      model.setAttribute('auto-rotate', '');
    }
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
    document.querySelectorAll('.project-card').forEach(function (card) {
      var content = card.querySelector('.project-content');
      var model = card.querySelector('model-viewer');

      if (!content || !model) {
        return;
      }

      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');

      try {
        model.style.display = 'block';
        model.style.width = '100%';
        model.style.height = '100%';
        model.style.filter = 'brightness(1.02) contrast(1.02)';
        model.setAttribute('exposure', model.getAttribute('exposure') || '1.05');
        model.setAttribute('shadow-intensity', '0');
      } catch (error) {
        // ignore render style failures
      }

      model.removeAttribute('camera-controls');
      model.setAttribute('disable-pan', '');
      model.setAttribute('auto-rotate', '');
      model.setAttribute('disable-zoom', '');

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
        imageSet: ['/page/Assets/img/Tanaw Trail.png', '/page/Assets/img/Tanaw Trail.png'],
        title: 'Tanaw Trail',
        description: 'Nestled within a peaceful yet mysterious forest, Tanaw Trail serves as the opening area of the journey in KulturaQuest, where the protagonist, Lam, first awakens confused and unaware of the dangers ahead. Surrounded by towering trees and the distant sounds of nature, the trail introduces players to the game’s atmosphere while teaching the fundamentals of movement, exploration, interaction, and the use of the slingshot as they begin their adventure into the unknown.'
      },
      {
        imageSet: ['/page/Assets/img/Tahanan.png', '/page/Assets/img/Tahanan.png'],
        title: 'Tahanan',
        description: 'This area serves as the Players Home, acting as the primary narrative start for the players journey. The Tahanan map is designed with multiple interactive layouts, featuring multiple Minigame Nodes (e.g., Water Pump and Dodge the Tsinelas), Chore-Based Objectives (e.g., Feed the Chicken) and a Puzzle (e.g. Tagutaguan). The Player Must Complete the Quest to access the next zone which is the ‘Luntian Woods’.'
      },
      {
        imageSet: ['/page/Assets/img/Luntian Woods.png', '/page/Assets/img/Luntian Woods.png'],
        title: 'Luntian Woods',
        description: 'The Luntian Woods zone functions as the first major Level, introducing the player to one of the game’s quest-giver, the Diwata Makilia. The level design emphasizes an Exploration-Based Questing, requiring the player to navigate a dense, multi-pathed forest to locate specific Quest Items demanded by the Unique Npc. Unlike the tutorial, this area utilizes Natural Gating, where the player must successfully traverse organic terrain by using the blessing he will acquire by completing the Npc’s quest to grow beantalks, vines ropes and vine bridges. The integration of a central landmark provides a Visual Anchor, assisting in spatial orientation while emphasizing the Heritage Showcase aspect of the game.'
      },
      {
        imageSet: ['/page/Assets/img/Hamog Highlands.png', '/page/Assets/img/Hamod Highlands.png'],
        title: 'Hamog Highlands',
        description: 'The Hamog Highlands map expands the players Kwaderno (Cultural Journal) through the inclusion of two new distinct landmarks: the Waterfall and the Rice Terraces. These landmarks are placed at the terminals of diverging paths to reward player exploration. This level serves as the primary introduction to the Compassion Blessing mechanic. The spatial design is centered around the NPC Piya, who initiates a Search Quest for Maisig. Unlike previous levels, Hamog Highlands features Enemies that serve a dual purpose: initially as obstacles, and subsequently as Environmental Puzzle Tools. '
      },
      {
        imageSet: ['/page/Assets/img/SamutSari Village.png', '/page/Assets/img/SamutSari Village.png'],
        title: 'SamutSari Village',
        description: 'Samut-Sari Village is the concluding level, divided into three sections to pace the narrative. It begins with social and navigational challenges, requiring players to perform the respect-based Mano Po before gathering Rattan Bundles. The second phase highlights daily rituals through a Pound the Palay minigame and a Tapuy Jar arrangement puzzle. Finally, players face a branching resolution: engage in the Tayaw Dance minigame or proceed directly to the games outro.'
      }
    ];

    mapsGrid.innerHTML = mapsData.map(function (map, index) {
      var imageOne = map.imageSet[0] || '/assets/img/UserDefault.png';
      var imageTwo = map.imageSet[1] || imageOne;
      return [
        '<article class="project-card map-card" data-map-card data-map-index="0">',
        '  <div class="project-image">',
        '    <div class="map-image-stack">',
        '      <img class="map-image is-active" src="' + imageOne + '" alt="' + map.title + ' 2D map preview" loading="lazy" decoding="async" data-image-index="0">',
        '      <img class="map-image" src="' + imageTwo + '" alt="' + map.title + ' 3D map preview" loading="lazy" decoding="async" data-image-index="1">',
        '    </div>',
        '    <span class="map-tag" data-map-tag>2D View</span>',
        '    <button type="button" class="map-nav map-prev" aria-label="Previous map view">',
        '      <i class="fas fa-chevron-left"></i>',
        '    </button>',
        '    <button type="button" class="map-nav map-next" aria-label="Next map view">',
        '      <i class="fas fa-chevron-right"></i>',
        '    </button>',
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
        // reset the previously active card before switching
        resetContainImage(activeMapCard);
        setMapCardState(activeMapCard, false);
      }

      var shouldActivate = activeMapCard !== card;
      activeMapCard = shouldActivate ? card : null;
      setMapCardState(card, shouldActivate);

      if (shouldActivate) {
        // show contain (zoomed-out) layer with crossfade
        showContainImage(card);
      } else {
        resetContainImage(card);
      }
    }

    function resetContainImage(card) {
      if (!card) return;

      var contain = card.querySelector('.map-image-contain');
      var images = card.querySelectorAll('.map-image');

      if (contain && contain.parentNode) {
        contain.parentNode.removeChild(contain);
      }

      images.forEach(function (img) {
        img.style.opacity = '';
        img.style.transition = '';
      });
    }

    function showContainImage(card) {
      if (!card) return;
      resetContainImage(card);

      var stack = card.querySelector('.map-image-stack');
      var activeImg = card.querySelector('.map-image.is-active');
      if (!stack || !activeImg) return;
      // don't duplicate if already present
      if (card.querySelector('.map-image-contain')) return;

      var contain = activeImg.cloneNode(true);
      contain.classList.remove('is-active');
      contain.classList.add('map-image-contain');
      // ensure it uses the same src but renders as contain
      contain.removeAttribute('data-image-index');
      contain.setAttribute('aria-hidden', 'true');
      contain.style.opacity = '0';
      stack.appendChild(contain);

      // let the browser paint once, then fade in the contain layer
      window.requestAnimationFrame(function () {
        contain.style.opacity = '1';
        activeImg.style.transition = 'opacity 0.22s ease';
        activeImg.style.opacity = '0';
      });
    }

    function syncContainImage(card) {
      if (!card) return;
      var activeImg = card.querySelector('.map-image.is-active');
      if (!activeImg) {
        return;
      }

      showContainImage(card);
    }

    function hideContainImage(card) {
      if (!card) return;
      var stack = card.querySelector('.map-image-stack');
      var activeImg = card.querySelector('.map-image.is-active');
      var contain = card.querySelector('.map-image-contain');
      if (!contain) return;

      // fade out contain, restore cover
      contain.style.opacity = '0';
      if (activeImg) {
        activeImg.style.transition = 'opacity 0.22s ease';
        activeImg.style.opacity = '1';
      }

      contain.addEventListener('transitionend', function () {
        if (contain && contain.parentNode) {
          contain.parentNode.removeChild(contain);
        }
      }, { once: true });
    }

    mapCards.forEach(function (card) {
      var images = card.querySelectorAll('.map-image');
      var tag = card.querySelector('[data-map-tag]');
      var prev = card.querySelector('.map-prev');
      var next = card.querySelector('.map-next');
      var state = { activeIndex: 0 };

      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', 'false');

      function updateMapView() {
        images.forEach(function (img, idx) {
          img.classList.toggle('is-active', idx === state.activeIndex);
        });
        if (tag) {
          tag.textContent = state.activeIndex === 0 ? '2D View' : '3D View';
        }

        if (card.classList.contains('is-active')) {
          syncContainImage(card);
        }
      }

      function stepMap(direction) {
        var imageCount = images.length;
        if (imageCount < 2) {
          return;
        }
        state.activeIndex = (state.activeIndex + direction + imageCount) % imageCount;
        updateMapView();
      }

      if (prev) {
        prev.addEventListener('click', function (event) {
          event.stopPropagation();
          stepMap(-1);
        });
      }

      if (next) {
        next.addEventListener('click', function (event) {
          event.stopPropagation();
          stepMap(1);
        });
      }

      var pointerStartX = null;

      card.addEventListener('pointerdown', function (event) {
        pointerStartX = event.clientX;
      });

      card.addEventListener('pointerup', function (event) {
        if (pointerStartX === null) {
          return;
        }

        var deltaX = event.clientX - pointerStartX;
        pointerStartX = null;

        if (Math.abs(deltaX) < 36) {
          return;
        }

        stepMap(deltaX > 0 ? -1 : 1);
      });

      card.addEventListener('pointercancel', function () {
        pointerStartX = null;
      });

      card.addEventListener('click', function () {
        activateMapCard(card);
      });

      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateMapCard(card);
        }
      });

      updateMapView();
    });

    document.addEventListener('pointerdown', function (event) {
      if (!activeMapCard) {
        return;
      }

      if (!activeMapCard.contains(event.target)) {
        resetContainImage(activeMapCard);
        setMapCardState(activeMapCard, false);
        activeMapCard = null;
      }
    });

    if (mapCards.length > 0) {
      activateMapCard(mapCards[0]);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCarousels();
    initProjectCards();
    initRotationDismissal();
    renderMapsShowcase();

    document.querySelectorAll('model-viewer').forEach(function (viewer) {
      try {
        viewer.style.display = 'block';
        viewer.style.width = '100%';
        viewer.style.height = '100%';
        viewer.style.filter = 'brightness(1.2) contrast(1.05)';
        if (!viewer.hasAttribute('exposure')) {
          viewer.setAttribute('exposure', '1.05');
        }
        if (viewer.closest('.projects-grid')) {
          viewer.setAttribute('shadow-intensity', '0');
        }
      } catch (error) {
        // ignore rendering style failures
      }
    });
  });
})();
