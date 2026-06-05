(function () {
  var activeCard = null;
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

  function renderMapsShowcase() {
    var mapsGrid = document.getElementById('mapsGrid');
    if (!mapsGrid) return;

    var mapsData = [
      { image: 'img/Tutorial.svg', title: 'Tanaw Trail', description: 'Nestled within a peaceful forest, Tanaw Trail serves as the opening area of the journey.' },
      { image: 'img/Level1.svg', title: 'Tahanan', description: 'This area serves as the Players Home, acting as the primary narrative start.' },
      { image: 'img/Level2.svg', title: 'Luntian Woods', description: 'The Luntian Woods zone functions as the first major exploratory Level.' },
      { image: 'img/Level3.svg', title: 'Hamog Highlands', description: 'The Hamog Highlands map expands the players Kwaderno documentation.' },
      { image: 'img/Level4.svg', title: 'SamutSari Village', description: 'Samut-Sari Village is the concluding level, divided into three historical sections.' }
    ];

    mapsGrid.innerHTML = mapsData.map(function (map, idx) {
      return [
        '<article class="map-card" tabindex="0" role="button" data-grid-index="' + idx + '">',
        '  <div class="map-image-container">',
        '    <img class="map-image" src="' + map.image + '" alt="' + map.title + '">',
        '  </div>',
        '  <div class="card-details">',
        '    <h3 class="project-title">' + map.title + '</h3>',
        '    <p class="project-description">' + map.description + '</p>',
        '    <button class="map-minimize-btn"><i class="fas fa-compress-alt"></i> Minimize Map</button>',
        '  </div>',
        '</article>'
      ].join('');
    }).join('');

    var mapCards = mapsGrid.querySelectorAll('.map-card');

    function toggleExpansion(card, expand) {
      if (expand) {
        document.querySelectorAll('.map-card.is-active').forEach(function (c) {
          c.classList.remove('is-active');
        });

        card.classList.add('is-active');
        mapsGrid.classList.add('has-expanded-card');
        document.body.classList.add('modal-active');
      } else {
        card.classList.remove('is-active');
        mapsGrid.classList.remove('has-expanded-card');
        document.body.classList.remove('modal-active');
      }
    }

    mapCards.forEach(function (card) {
      var minimizeBtn = card.querySelector('.map-minimize-btn');

      card.addEventListener('click', function (e) {
        if (e.target.closest('.map-minimize-btn')) return;
        if (!card.classList.contains('is-active')) toggleExpansion(card, true);
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!card.classList.contains('is-active')) toggleExpansion(card, true);
        }
      });

      minimizeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleExpansion(card, false);
      });
    });

    document.addEventListener('click', function (e) {
      var activeCardEl = document.querySelector('.map-card.is-active');
      // Fix: Closes if active card exists and click is completely outside of it
      if (activeCardEl && !activeCardEl.contains(e.target)) {
        toggleExpansion(activeCardEl, false);
      }
    });
  }

  function renderNPCsShowcase() {
    var track = document.getElementById('npcThumbnailsGrid');
    var displayContainer = document.getElementById('npcActiveModelContainer');
    var displayName = document.getElementById('npcDisplayName');
    var displayDesc = document.getElementById('npcDisplayDesc');
    var mainFrame = document.querySelector('.npc-display-frame-bamboo');

    if (!track || !displayContainer || !displayName || !displayDesc) return;

    var npcData = [
      { name: 'Piya', model: 'img/NPC/NPC/Piya.glb', preview: 'img/paper.jpg', desc: 'The lover of Maisig. Very well known as the prettiest girl in the village of Samutsari.' },
      { name: 'Pangat Ubay', model: 'img/NPC/NPC/Pangat Ubay.glb', preview: 'img/paper.jpg', desc: 'The village chief of Samutsari. He has a strong leadership but also looks grumpy.' },
      { name: 'Makilia', model: 'img/NPC/NPC/Makilia.glb', preview: 'img/paper.jpg', desc: 'A forest nymph with the outmost beauty of all Hiraya. She is also well known as the nature goddess living in the forests of Luntian Woods.' },
      { name: 'Maisig', model: 'img/NPC/NPC/Maisig.glb', preview: 'img/paper.jpg', desc: 'The lover of Piya. A decent, fine young man who eventually wins over Piya\'s heart.' },
      { name: 'Kasil', model: 'img/NPC/NPC/Kasil.glb', preview: 'img/paper.jpg', desc: 'The father of Lam and Ang and husband of Fukon. Very strong and well-built.' },
      { name: 'Fukon', model: 'img/NPC/NPC/Fukon.glb', preview: 'img/paper.jpg', desc: 'The mother of Lam and Ang and wife of Kasil. A caring mother who has clear boundaries.' },
      { name: 'Apo Ugay', model: 'img/NPC/NPC/Apo Ugay.glb', preview: 'img/paper.jpg', desc: 'A well-known elder respected for her wisdom. One of the oldest villagers in Samutsari.' },
      { name: 'Ang', model: 'img/NPC/NPC/Ang.glb', preview: 'img/paper.jpg', desc: 'The youngest son of Fukon and Kasil. He is very care-free and mischievous.' }
    ];

    var currentIndex = 0;
    var npcTimeout = null; // Fix: Tracks active timeout instance

    track.innerHTML = npcData.map(function (npc, idx) {
      return (
        '<div class="npc-thumb-square" data-npc-index="' +
        idx +
        '" tabindex="0" role="button">' +
        '<div class="npc-thumb-inner" style="background-image: url(\'' +
        npc.preview +
        '\');"><span>' +
        npc.name +
        '</span></div></div>'
      );
    }).join('');

    displayContainer.innerHTML =
      '<model-viewer class="npc-main-model-element" auto-rotate camera-controls camera-orbit="0deg 78deg 115%" disable-pan="true" disable-zoom interaction-prompt="none" shadow-intensity="0" exposure="0.88" ar="false" loading="eager" reveal="auto"></model-viewer>';

    var viewer = displayContainer.querySelector('model-viewer');

    function updateActiveNPC(index) {
      index = ((index % npcData.length) + npcData.length) % npcData.length;
      currentIndex = index;
      var item = npcData[currentIndex];

      track.querySelectorAll('.npc-thumb-square').forEach(function (thumb, idx) {
        thumb.classList.toggle('is-active', idx === index);
      });

      var shiftValue = (index - 1) * -116;
      track.style.transform = 'translateX(' + shiftValue + 'px)';

      if (mainFrame) mainFrame.classList.add('is-shifting');
      
      clearTimeout(npcTimeout); // Fix: Clear previous pending updates
      npcTimeout = setTimeout(function () {
        displayName.textContent = item.name;
        displayDesc.textContent = item.desc;
        if (viewer) {
          viewer.setAttribute('src', item.model);
          if (lowPowerMode) {
            viewer.setAttribute('exposure', '0.72');
            viewer.setAttribute('shadow-intensity', '0');
          }
        }
        if (mainFrame) mainFrame.classList.remove('is-shifting');
      }, 150);
    }

    track.querySelectorAll('.npc-thumb-square').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        updateActiveNPC(parseInt(this.getAttribute('data-npc-index'), 10));
      });
      // Fix: Add keyboard support block
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateActiveNPC(parseInt(this.getAttribute('data-npc-index'), 10));
        }
      });
    });

    var prevBtn = document.querySelector('.npc-prev');
    var nextBtn = document.querySelector('.npc-next');

    prevBtn && prevBtn.addEventListener('click', function () {
      updateActiveNPC(currentIndex - 1);
    });
    nextBtn && nextBtn.addEventListener('click', function () {
      updateActiveNPC(currentIndex + 1);
    });

    updateActiveNPC(0);
  }

  function renderEnemyNPCsShowcase() {
    var track = document.getElementById('enemyThumbnailsGrid');
    var displayContainer = document.getElementById('enemyActiveModelContainer');
    var displayName = document.getElementById('enemyDisplayName');
    var displayDesc = document.getElementById('enemyDisplayDesc');
    
    // Fix: Clean ES5 safe alternative to the breaking optional chaining syntax
    var enemySec = document.getElementById('enemyGallerySection');
    var mainFrame = enemySec ? enemySec.querySelector('.npc-display-frame-bamboo') : null;

    if (!track || !displayContainer || !displayName || !displayDesc) return;

    var enemyData = [
      { name: 'Baboy Ramo', model: 'img/Boar.glb', preview: 'img/paper.jpg', desc: 'A wild, medium-sized pig native to the Philippines, known for its rugged appearance and coarse, bristly coat. It features a distinct, elongated snout and a lean, muscular build that allows it to move quickly through dense forest floors. It is a shy, elusive animal that spends much of its time foraging for roots, fruits, and small insects in its natural habitat.' },
      { name: 'Rafflesia', model: 'img/Rafflesia.glb', preview: 'img/paper.jpg', desc: 'A rare, parasitic plant known as the worlds largest flower. Lacking leaves, stems, or roots, it survives entirely inside Tetrastigma vines. The Philippines hosts around 13 to 15 unique species, famous for their giant reddish-brown petals and foul, rotting-meat odor.' },
      { name: 'Carabao', model: 'img/Carabao.glb', preview: 'img/paper.jpg', desc: 'A powerful, sturdy water buffalo with broad, curved horns and thick, slate-grey skin. In a game setting, it is the ultimate beast of burden slow moving and docile, but possessing immense strength and high resilience against harsh weather and terrain. It is often depicted wallowing in mud or patiently pulling a wooden cart through rice paddies.' },
      { name: 'Chicken', model: 'img/Chicken.glb', preview: 'img/paper.jpg', desc: 'A common, small, feathered bird found in farms and rural areas. It is an active ground-dweller that spends its day foraging for food. It is widely recognized for its red comb, clucking sounds, and its role as a source of eggs and meat.' }
    ];

    var currentIndex = 0;
    var enemyTimeout = null; // Fix: Tracks active timeout instance

    track.innerHTML = enemyData.map(function (enemy, idx) {
      return (
        '<div class="npc-thumb-square" data-enemy-index="' +
        idx +
        '" tabindex="0" role="button">' +
        '<div class="npc-thumb-inner" style="background-image: url(\'' +
        enemy.preview +
        '\');"><span>' +
        enemy.name +
        '</span></div></div>'
      );
    }).join('');

    displayContainer.innerHTML =
      '<model-viewer class="npc-main-model-element" auto-rotate camera-controls camera-orbit="0deg 78deg 115%" disable-pan="false" disable-zoom interaction-prompt="none" shadow-intensity="0" exposure="0.82" ar="false" loading="eager" reveal="auto"></model-viewer>';

    var viewer = displayContainer.querySelector('model-viewer');

    function updateActiveEnemy(index) {
      index = ((index % enemyData.length) + enemyData.length) % enemyData.length;
      currentIndex = index;
      var item = enemyData[currentIndex];

      track.querySelectorAll('.npc-thumb-square').forEach(function (thumb, idx) {
        thumb.classList.toggle('is-active', idx === index);
      });

      var shiftValue = (index - 1) * -116;
      track.style.transform = 'translateX(' + shiftValue + 'px)';

      if (mainFrame) mainFrame.classList.add('is-shifting');
      
      clearTimeout(enemyTimeout); // Fix: Clear previous pending updates
      enemyTimeout = setTimeout(function () {
        displayName.textContent = item.name;
        displayDesc.textContent = item.desc;
        if (viewer) {
          if (item.model) {
            viewer.style.display = 'block';
            viewer.setAttribute('src', item.model);
          } else {
            viewer.style.display = 'none';
            viewer.removeAttribute('src');
          }
        }
        if (mainFrame) mainFrame.classList.remove('is-shifting');
      }, 150);
    }

    track.querySelectorAll('.npc-thumb-square').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        updateActiveEnemy(parseInt(this.getAttribute('data-enemy-index'), 10));
      });
      // Fix: Add keyboard support block
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateActiveEnemy(parseInt(this.getAttribute('data-enemy-index'), 10));
        }
      });
    });

    var prevBtn = document.querySelector('.enemy-prev');
    var nextBtn = document.querySelector('.enemy-next');

    prevBtn && prevBtn.addEventListener('click', function () {
      updateActiveEnemy(currentIndex - 1);
    });
    nextBtn && nextBtn.addEventListener('click', function () {
      updateActiveEnemy(currentIndex + 1);
    });

    updateActiveEnemy(0);
  }

  function initDashboardWing(trackId, stageId, titleId, descId, btnUpId, btnDownId, dataSet) {
    var track = document.getElementById(trackId);
    var stage = document.getElementById(stageId);
    var titleEl = document.getElementById(titleId);
    var descEl = document.getElementById(descId);
    var btnUp = document.getElementById(btnUpId);
    var btnDown = document.getElementById(btnDownId);

    if (!track || !stage || !titleEl || !descEl) return;

    var activeIndex = 0;
    var wingTimeout = null; // Fix: Tracks active timeout instance

    track.innerHTML = dataSet.map(function (item, idx) {
      return [
        '<div class="inspection-scroller-item" data-index="' + idx + '" tabindex="0" role="button">',
        '  <span class="inspection-item-accent">■</span>',
        '  <span class="inspection-item-text">' + item.name + '</span>',
        '</div>'
      ].join('');
    }).join('');

    stage.innerHTML =
      '<model-viewer class="inspection-master-viewer" auto-rotate camera-controls disable-pan="true" shadow-intensity="0" exposure="0.9" interaction-prompt="none"></model-viewer>';

    var viewer = stage.querySelector('model-viewer');

    function selectItem(index) {
      if (index < 0 || index >= dataSet.length) return;
      activeIndex = index;

      var items = track.querySelectorAll('.inspection-scroller-item');
      items.forEach(function (el, idx) {
        el.classList.remove('is-active', 'fade-out-deep', 'fade-out-light');

        if (idx === activeIndex) {
          el.classList.add('is-active');
        } else {
          var distance = Math.abs(idx - activeIndex);
          if (distance === 1) el.classList.add('fade-out-light');
          else el.classList.add('fade-out-deep');
        }
      });

      var activeNode = items[activeIndex];
      var targetItem = dataSet[activeIndex];

      if (activeNode) {
        var containerHeight = track.clientHeight;
        var nodeTop = activeNode.offsetTop;
        var nodeHeight = activeNode.offsetHeight;

        track.scrollTo({
          top: nodeTop - containerHeight / 2 + nodeHeight / 2,
          behavior: 'smooth'
        });
      }

      stage.classList.add('is-changing');
      
      clearTimeout(wingTimeout); // Fix: Clear previous pending updates
      wingTimeout = setTimeout(function () {
        titleEl.textContent = targetItem.name;
        descEl.textContent = targetItem.desc;
        if (viewer) {
          viewer.setAttribute('src', targetItem.model);
          viewer.setAttribute('alt', targetItem.desc);
          if (lowPowerMode) {
            viewer.setAttribute('exposure', '0.70');
            viewer.setAttribute('shadow-intensity', '0');
          }
        }
        stage.classList.remove('is-changing');
      }, 150);
    }

    track.querySelectorAll('.inspection-scroller-item').forEach(function (item) {
      item.addEventListener('click', function () {
        selectItem(parseInt(this.getAttribute('data-index'), 10));
      });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectItem(parseInt(this.getAttribute('data-index'), 10));
        }
      });
    });

    btnUp && btnUp.addEventListener('click', function () {
      if (activeIndex > 0) selectItem(activeIndex - 1);
    });
    btnDown && btnDown.addEventListener('click', function () {
      if (activeIndex < dataSet.length - 1) selectItem(activeIndex + 1);
    });

    if (dataSet.length > 0) setTimeout(function () { selectItem(0); }, 100);
  }

  function initStandardCarousels() {
    var groups = document.querySelectorAll('.models-group[data-carousel-group]');
    groups.forEach(function (group) {
      var windowEl = group.querySelector('.projects-carousel-window');
      var gridEl = group.querySelector('.projects-grid');
      var prevBtn = group.querySelector('.carousel-prev');
      var nextBtn = group.querySelector('.carousel-next');

      if (!windowEl || !gridEl || !prevBtn || !nextBtn) return;

      function getScrollStep() {
        var card = gridEl.querySelector('.project-card');
        if (card) {
          var cardWidth = card.getBoundingClientRect().width;
          var gap = parseFloat(window.getComputedStyle(gridEl).gap) || 20;
          return cardWidth + gap;
        }
        return windowEl.offsetWidth * 0.8;
      }

      prevBtn.addEventListener('click', function () {
        var step = getScrollStep();
        var currentStepIndex = Math.round(gridEl.scrollLeft / step);
        gridEl.scrollTo({ left: (currentStepIndex - 1) * step, behavior: 'smooth' });
      });

      nextBtn.addEventListener('click', function () {
        var step = getScrollStep();
        var currentStepIndex = Math.round(gridEl.scrollLeft / step);
        gridEl.scrollTo({ left: (currentStepIndex + 1) * step, behavior: 'smooth' });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    lowPowerMode = detectLowPowerMode();
    renderMapsShowcase();
    renderNPCsShowcase();
    renderEnemyNPCsShowcase();
    initStandardCarousels();

    initDashboardWing(
      'discoverablesVerticalTrack',
      'discoverablesMasterStage',
      'discoverablesMasterTitle',
      'discoverablesMasterDesc',
      'discScrollUp',
      'discScrollDown',
      [
        { name: 'Duyu', model: 'img/Duyo.glb', desc: 'A traditional wooden bowl from the Cordillera. They are often used in rituals or as ceremonial offering bowls, with some variations including star-shaped or hand-carved designs. ' },
        { name: 'Duli', model: 'img/Duli.glb', desc: 'Also referred to as the “Chuli” by the Bontoc tribe, it is a headdress made of snake vertebrae and exclusively worn by married Bontoc Women to secure their hair.' },
        { name: 'Kimata (a)', model: 'img/Kimata (a).glb', desc: 'A rattan double basket with a detachable wooden pole called Luwa. It is used as a load transporter for men in carrying harvested crops.' },
        { name: 'Libbit', model: 'img/Libbit.glb', desc: 'An instrumental drum used during Ifugao agricultural ceremonies such as the “Hongan Di Page” (rice rituals) to invite rice deities to partake in animal sacrifices.' },
        { name: 'Ligka (a)', model: 'img/Ligka (a).glb', desc: 'A traditionally square-shaped and almost flat basket. It is mainly used to separate the husk of rice grain after it has been hulled.' },
        { name: 'Pagkarilyasan', model: 'img/Pagkarilyasan.glb', desc: 'A brown wooden spinning wheel used for spinning thread or yarns. Pagkarilyasan, alternatively called \'ruedo\', specifically functions as a weft winder.' },
        { name: 'Aliwa (a)', model: 'img/Aliwa.glb', desc: 'The Aliwa is a traditional Isnag hand axe from the province of Apayao characterized by a unique concavo-convex curved blade and an elongated tail known as a pawit.' },
        { name: 'BahayKubo', model: 'img/BahayKubo.glb', desc: 'The traditional Bahay Kubo’s humble bamboo and nipa construction is archetypal of Filipino dwellings.' },
        { name: 'Bulul', model: 'img/Bulul.glb', desc: 'Bulul totems act as a powerful spiritual guardian that is traditionally housed inside indigenous rice granaries (alang) to protect harvested crops from pests, thieves, and malevolent spirits.' },
        { name: 'Dalapong', model: 'img/Dalapong.glb', desc: 'Dalapong serves as a practical, low-profile seating block utilized for resting and performing everyday household chores around the hearth. The Kankana-ey and Bontoc tribes commonly refer to their own seating blocks as the tokdowan.' },
        { name: 'Foaya', model: 'img/Foaya.glb', desc: 'A necklace usually made of crocodile teeth worn by elite Bontoc men. It is associated with headhunting rites, ceremonies, and dances. Also referred to as the “Buaya” amongst the Ifugao and Kalinga tribes. ' },
        { name: 'Padang', model: 'img/Giniling.glb', desc: 'Padang are heavy coiled brass ornaments that serve as highly visible status symbols, indicating the wearers wealth, prestige, and rank within traditional indigenous society. Padang Ifugao men as a leg accessory on the calves, where the specific number and placement of the leglets directly correlate to the mans social and class standing.' },
        { name: 'Hinolgat', model: 'img/Hinolgat.glb', desc: 'The Hinolgat is a traditional Ifugao spear characterized by two pairs of barbs that were specifically designed for hunting animals. Similar to the sinalawitan of the Bontok tribe, it also serves as a powerful talisman used to ward off malevolent spirits rather than for actual combat.' },
        { name: 'Pang-Op', model: 'img/PangOp.glb', desc: 'Also called as Pangaw, are glass beads incased in gold. It is worn by both Ifugao men and women as necklace to represent the Kadangyan class. ' },
        { name: 'Pawisak', model: 'img/Pawisak.glb', desc: 'A Pawisak is a traditional, crescent-shaped or butterfly-shaped ear ornament worn by women from indigenous tribes in the Cordillera region of the Philippines, such as the Kalinga and Ga dang.' },
        { name: 'Tinawon', model: 'img/Tinawon.glb', desc: 'Also known as Imbu-an or Tinglu   ‘Tinawon’, coming from the regional language Ilokano and literally meaning ‘once a year’, is the broad linguistic term and common name used for this medium grain staple rice. The specific variety of this nomination is called ‘Imbuucan’ in the Tawili language of the municipalities of Banaue and Hingyon, Ifugao Province. ' },
        { name: 'Ballingaw', model: 'img/Ballingaw.glb', desc: 'A container that is used  to organize and store clothing, everyday cloths, and valuable woven textiles. While recognized ballingaw by the Ifugao people of Banaue and Kiangan, this exact same textile storage basket is utilized and referred to by the Bontoc tribe.' },
        { name: 'Chinarman', model: 'img/Chinarman.glb', desc: 'Referred to as the Chinarman or Dinolman by the Ifugao tribe while the Bontok call it as Libliban. These jars served as essential household vessels for storing water, preserving food, or fermenting traditional rice wine (tapuy) for rituals.' },
        { name: 'Haklung', model: 'img/Haklung.glb', desc: 'These household utensils are used primarily for scooping and serving cooked rice, transferring and distributing liquids like broth or traditional rice wine during communal feasts. Among the Ifugao it is referred Haklung, while it is called Fakong by Bontoc tribe.' },
        { name: 'Kingon', model: 'img/Kingon.glb', desc: 'The Kingon is a traditional wooden shield used by the Bugkalot Tribe (also called Ilongot people) in the northern Philippines. It is a long, narrow shield carved from wood, usually with curved sides and decorative notches along the edges. The shield was traditionally used for protection in combat, rituals, and war dances.' },
        { name: 'Lakom', model: 'img/Lakom.glb', desc: 'An agricultural tool for harvesting rice. This tool used for careful harvesting is deeply tied to indigenous rituals. Referred to as the lakem by the Bontoc and Applay tribes, and as the gamulang by the Ifugao, it is also called the Lakom by the Kalinga.' },
        { name: 'Lilidsan', model: 'img/Lilidsan.glb', desc: 'An agricultural and textile tool used by indigenous weavers to streamline the production of cotton yarn. Often recognized as the lilidsan among the Tinggian (Itneg) people of Abra, the Bontoc historically referred to it as the baliaes.' },
        { name: 'LingLing-o', model: 'img/LingLingo.glb', desc: 'One of the most culturally significant ornaments of the Igorot peoples of the Cordillera highlands. An ancient C-shaped charm or pendant symbolizing the sacred symbolizing fertility, ancestry, and protection.' },
        { name: 'Luhong', model: 'img/Luhong.glb', desc: 'The tool is used primarily for pounding and dehulling harvested palay (unhusked rice), effectively separating the edible grain from the chaff so it can be cooked for daily meals. Specifically known as the luhong among the Ifugao and Kalanguya tribes, it is also called luson or lusong by the Bontoc tribe.' },
        { name: 'Unu', model: 'img/Unu_Awil.glb', desc: 'The unu serves as a highly valued family heirloom that is carefully preserved, passed down to descendants, and exclusively worn during specific, important cultural rituals. The Ibaloi and Kankana-ey tribes utilize the term awil to refer to this exact same silver coin necklace.' },
      ]
    );

    initDashboardWing(
      'collectiblesVerticalTrack',
      'collectiblesMasterStage',
      'collectiblesMasterTitle',
      'collectiblesMasterDesc',
      'collScrollUp',
      'collScrollDown',
      [
        { name: 'Bataw', model: 'img/W_Collectibles/W_Collectibles/Bataw.glb', desc: 'High fidelity 3D model of the Bataw plant consumable module item asset.' },
        { name: 'Bawang', model: 'img/W_Collectibles/W_Collectibles/Bawang.glb', desc: 'High fidelity 3D model of the Bawang plant consumable module item asset.' },
        { name: 'Kalabasa', model: 'img/W_Collectibles/W_Collectibles/Kalabasa.glb', desc: 'High fidelity 3D model of the Kalabasa plant consumable module item asset.' },
        { name: 'Kamatis', model: 'img/W_Collectibles/W_Collectibles/Kamatis.glb', desc: 'High fidelity 3D model of the Kamatis plant consumable module item asset.' },
        { name: 'Kundol', model: 'img/W_Collectibles/W_Collectibles/Kundol.glb', desc: 'High fidelity 3D model of the Kundol plant consumable module item asset.' },
        { name: 'Labanos', model: 'img/W_Collectibles/W_Collectibles/Labanos.glb', desc: 'High fidelity 3D model of the Labanos plant consumable module item asset.' },
        { name: 'Linga', model: 'img/W_Collectibles/W_Collectibles/Linga.glb', desc: 'High fidelity 3D model of the Linga plant consumable module item asset.' },
        { name: 'Luya', model: 'img/W_Collectibles/W_Collectibles/Luya.glb', desc: 'High fidelity 3D model of the Luya plant consumable module item asset.' },
        { name: 'Mani', model: 'img/W_Collectibles/W_Collectibles/Mani.glb', desc: 'High fidelity 3D model of the Mani plant consumable module item asset.' },
        { name: 'Mustasa', model: 'img/W_Collectibles/W_Collectibles/Mustasa.glb', desc: 'High fidelity 3D model of the Mustasa plant consumable module item asset.' },
        { name: 'Patani', model: 'img/W_Collectibles/W_Collectibles/Patani.glb', desc: 'High fidelity 3D model of the Patani plant consumable module item asset.' },
        { name: 'Patola', model: 'img/W_Collectibles/W_Collectibles/Patola.glb', desc: 'High fidelity 3D model of the Patola plant consumable module item asset.' },
        { name: 'Sibuyas', model: 'img/W_Collectibles/W_Collectibles/Sibuyas.glb', desc: 'High fidelity 3D model of the Sibuyas plant consumable module item asset.' },
        { name: 'Sigarilyas', model: 'img/W_Collectibles/W_Collectibles/Sigarilyas.glb', desc: 'High fidelity 3D model of the Sigarilyas plant consumable module item asset.' },
        { name: 'Singkamas', model: 'img/W_Collectibles/W_Collectibles/Singkamas.glb', desc: 'High fidelity 3D model of the Singkamas plant consumable module item asset.' },
        { name: 'Sitaw', model: 'img/W_Collectibles/W_Collectibles/Sitaw.glb', desc: 'High fidelity 3D model of the Sitaw plant consumable module item asset.' },
        { name: 'Talong', model: 'img/W_Collectibles/W_Collectibles/Talong.glb', desc: 'High fidelity 3D model of the Talong plant consumable module item asset.' },
        { name: 'Upo', model: 'img/W_Collectibles/W_Collectibles/Upo.glb', desc: 'High fidelity 3D model of the Upo plant consumable module item asset.' }
      ]
    );
  });
})();