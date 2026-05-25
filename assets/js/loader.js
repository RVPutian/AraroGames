(function () {
  let loaderTimeline = null;
  let loaderFinished = false;

  function setPlantInitialState() {
    if (typeof TweenMax === 'undefined') {
      return false;
    }

    TweenMax.set('#shadow', {
      scale: 0,
      transformOrigin: '15px 8px'
    });
    TweenMax.set('#tree', {
      scale: 0,
      transformOrigin: '154px bottom'
    });
    TweenMax.set('#leaf-rb', {
      scale: 0,
      rotation: '-60cw',
      y: -15,
      transformOrigin: 'left bottom'
    });
    TweenMax.set('#leaf-rm', {
      scale: 0,
      rotation: '-50cw',
      y: 30,
      transformOrigin: 'left bottom'
    });
    TweenMax.set('#leaf-lb', {
      scale: 0,
      rotation: '60cw',
      y: -80,
      transformOrigin: 'right bottom'
    });
    TweenMax.set('#leaf-lm', {
      scale: 0,
      rotation: '40cw',
      y: -90,
      transformOrigin: 'right bottom'
    });
    TweenMax.set('#leaf-top', {
      scale: 0,
      transformOrigin: 'center bottom'
    });

    TweenMax.set('#leaf-rb g', {
      scale: 0,
      transformOrigin: 'left 60px'
    });
    TweenMax.set('#leaf-rm g', {
      scale: 0,
      transformOrigin: '22px 140px'
    });
    TweenMax.set('#leaf-lb g', {
      scale: 0,
      transformOrigin: 'right 56px'
    });
    TweenMax.set('#leaf-lm g', {
      scale: 0,
      transformOrigin: '106px bottom'
    });

    return true;
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
      delay: 0.7,
      onComplete: finishLoader
    });

    loaderTimeline
      .to('#shadow', 3.4, { scale: 1 }, 0)
      .to('#tree', 3.4, { scale: 1 }, 0)
      .to('#leaf-rb', 3.2, { scale: 1, rotation: '0cw', y: 0, delay: 0.55 }, 0)
      .to('#leaf-rm', 3.2, { scale: 1, rotation: '0cw', y: 0, delay: 0.55 }, 0)
      .to('#leaf-lb', 3.2, { scale: 1, rotation: '0cw', y: 0, delay: 0.55 }, 0)
      .to('#leaf-lm', 3.2, { scale: 1, rotation: '0cw', y: 0, delay: 0.55 }, 0)
      .to('#leaf-top', 4.2, { scale: 1, delay: 0.7 }, 0)
      .to('#leaf-lb g', 3.8, { scale: 1, delay: 0.9 }, 0)
      .to('#leaf-lm g', 3.8, { scale: 1, delay: 1.05 }, 0)
        .to('#leaf-rb g', 3.8, { scale: 1, delay: 0.9 }, 0)
        .to('#leaf-rm g', 3.8, { scale: 1, delay: 1.05 }, 0);
  }

  function finishLoader() {
    if (loaderFinished) {
      return;
    }

    loaderFinished = true;

    if (loaderTimeline) {
      loaderTimeline.kill();
      loaderTimeline = null;
    }

    const loader = document.getElementById('loader');
    if (!loader) {
      if (typeof initPageAnimations === 'function') {
        initPageAnimations();
      }
      return;
    }

    const completeLoader = () => {
      loader.classList.add('hidden');
      document.body.classList.remove('loading');
      document.body.classList.add('loaded');
      if (typeof initPageAnimations === 'function') {
        initPageAnimations();
      }
    };

    if (typeof anime !== 'undefined') {
      anime({
        targets: loader,
        opacity: [1, 0],
        duration: 500,
        easing: 'easeInOutQuad',
        complete: completeLoader
      });
      return;
    }

    completeLoader();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('loader')) {
      return;
    }

    if (setPlantInitialState()) {
      window.addEventListener('load', startPlantAnimation, { once: true });
    }
  });
})();
