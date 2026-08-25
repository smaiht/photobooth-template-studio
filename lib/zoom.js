/**
 * Define action to zoom in/out
 */
(function () {
  'use strict';

  function zoom() {
    const _self = this;
    let currentZoomLevel = 1;

    const canvasHolder = document.querySelector('.canvas-holder');
    const canvasContainer = document.querySelector('.canvas-container');
    const canvasContent = canvasContainer.parentElement;
    const upperCanvas = this.canvas.upperCanvasEl;

    let lastDist = null;
    let lastX = null;
    let lastY = null;

    // Обработчик начала касания
    canvasHolder.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastDist = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        lastX = (touch1.clientX + touch2.clientX) / 2;
        lastY = (touch1.clientY + touch2.clientY) / 2;
      }
    }, { passive: false });




    // Обработчик движения
    canvasHolder.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();

        // Добавим throttle для уменьшения количества обновлений
        if (!this.lastMoveTime || Date.now() - this.lastMoveTime > 16) { // 16 for ~60fps
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];

          const dist = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );

          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;

          if (lastDist) {
            const scale = dist / lastDist;
            let zoom = _self.canvas.getZoom() * scale;

            const minAllowedZoom = 0.1;
            const maxAllowedZoom = 2.0; // Ограничиваем максимум до 200%
            zoom = Math.min(Math.max(minAllowedZoom, zoom), maxAllowedZoom);

            _self.applyZoom(zoom);

            if (lastX && lastY) {
              const deltaX = centerX - lastX;
              const deltaY = centerY - lastY;

              const currentTransform = window.getComputedStyle(canvasContent).transform;
              const matrix = new DOMMatrix(currentTransform === 'none' ? '' : currentTransform);

              matrix.translateSelf(deltaX, deltaY);
              canvasContent.style.transform = matrix.toString();
            }
          }

          lastDist = dist;
          lastX = centerX;
          lastY = centerY;

          this.lastMoveTime = Date.now();
        }
      }
    }, { passive: false });


    // Сброс значений
    canvasHolder.addEventListener('touchend', function () {
      lastDist = null;
      lastX = null;
      lastY = null;
    }, { passive: false });





    $(`${this.containerSelector} #footerbar .zoom-level-container`).append(`
          <button type="button" id="zoom-fit" title="${window.lang === 'ru' ? 'Вписать холст в свободную область' : 'Fit canvas into free space'}" aria-label="${window.lang === 'ru' ? 'Вписать холст в свободную область' : 'Fit canvas into free space'}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
              <path d="M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"/>
            </svg> 
          </button>
          <input type="range" id="input-zoom-level" min="0.1" max="3" step="0.05" value="${currentZoomLevel}" oninput="updateZoomValue(this.value)">
          <div id="zoom-value">${Math.round(currentZoomLevel * 100)}%</div>
        `);

    $(`${this.containerSelector} #footerbar .zoom-level-container button`).click(function () {
      typeof _self.fitZoom === 'function' && _self.fitZoom();
    })

    window.updateZoomValue = function (value) {
      // document.getElementById('zoom-value').textContent = Math.round((value * 100)) + '%';
      if (value === 'fit') {
        typeof _self.fitZoom === 'function' && _self.fitZoom();
      } else {
        let zoom = parseFloat(value);
        typeof _self.applyZoom === 'function' && _self.applyZoom(zoom);
      }
    };

    if (currentZoomLevel === 'fit') {
      typeof _self.fitZoom === 'function' && _self.fitZoom();
    } else {
      typeof _self.applyZoom === 'function' && _self.applyZoom(currentZoomLevel);
    }

    const minZoom = 0.05
    const maxZoom = 3

    this.applyZoom = (zoom) => {
      this.canvas.setZoom(zoom)
      this.canvas.setWidth(this.canvas.originalW * this.canvas.getZoom())
      this.canvas.setHeight(this.canvas.originalH * this.canvas.getZoom())
      this.inputZoomLevel(zoom)
    }

    // zoom fit the area
    this.fitZoom = () => {
      const holderStyles = window.getComputedStyle(canvasHolder);
      const horizontalPadding = parseFloat(holderStyles.paddingLeft) + parseFloat(holderStyles.paddingRight);
      const verticalPadding = parseFloat(holderStyles.paddingTop) + parseFloat(holderStyles.paddingBottom);
      const visiblePanel = document.querySelector(
        `${this.containerSelector} .toolpanel.visible:not(.closed)`,
      );
      const isMobile = window.matchMedia('(max-width: 820px)').matches;
      const panelWidth = visiblePanel && !isMobile
        ? visiblePanel.getBoundingClientRect().width + 24
        : 0;
      const panelHeight = visiblePanel && isMobile
        ? visiblePanel.getBoundingClientRect().height + 14
        : 0;
      const containerWidth = Math.max(
        1,
        canvasHolder.clientWidth - horizontalPadding - panelWidth,
      );
      const containerHeight = Math.max(
        1,
        canvasHolder.clientHeight - verticalPadding - panelHeight,
      );
      const canvasWidth = this.canvas.originalW;
      const canvasHeight = this.canvas.originalH;
      const widthRatio = containerWidth / canvasWidth;
      const heightRatio = containerHeight / canvasHeight;
      const newZoom = Math.min(widthRatio, heightRatio);
      const fittedZoom = Math.floor(newZoom * 1000) / 1000;
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, fittedZoom));

      // Fit keeps the open panel in place and centers the canvas in the free area.
      canvasContainer.style.transform = 'none';
      canvasContent.style.transform = `translate(${-panelWidth / 2}px, ${-panelHeight / 2}px)`;

      this.applyZoom(clampedZoom)
    };

    // zoom out/in/reset (ctr + -/+/0)
    const keyZoom = (e) => {
      const key = e.which || e.keyCode

      // ctr -: zoom out
      if (key === 189 && e.ctrlKey) {
        e.preventDefault()
        if (this.canvas.getZoom() === minZoom) return

        let updatedZoom = parseInt(this.canvas.getZoom() * 100)

        // 25% jumps
        if ((updatedZoom % 25) !== 0) {
          while ((updatedZoom % 25) !== 0) {
            updatedZoom = updatedZoom - 1
          }
        } else {
          updatedZoom = updatedZoom - 25
        }

        updatedZoom = updatedZoom / 100
        updatedZoom = (updatedZoom <= 0) ? minZoom : updatedZoom

        this.applyZoom(updatedZoom)
      }


      // ctr +: zoom in
      if (key === 187 && e.ctrlKey) {
        e.preventDefault()
        if (this.canvas.getZoom() === maxZoom) return

        let updatedZoom = parseInt(this.canvas.getZoom() * 100)

        // 25% jumps
        if ((updatedZoom % 25) !== 0) {
          while ((updatedZoom % 25) !== 0) {
            updatedZoom = updatedZoom + 1
          }
        } else {
          updatedZoom = updatedZoom + 25
        }

        updatedZoom = updatedZoom / 100
        updatedZoom = (updatedZoom > maxZoom) ? maxZoom : updatedZoom

        this.applyZoom(updatedZoom)
      }


      // ctr 0: reset
      if ((key === 96 || key === 48 || key === 192) && e.ctrlKey) {
        e.preventDefault()
        this.applyZoom(1)
      }
    }
    document.addEventListener('keydown', keyZoom)

    // zoom out/in with mouse    
    const mouseZoom = (e) => {
      if (!e.ctrlKey) return
      e.preventDefault()

      let updatedZoom = this.canvas.getZoom()
      let zoomAmount = (e.deltaY > 0) ? -5 : 5
      updatedZoom = ((updatedZoom * 100) + zoomAmount) / 100
      if (updatedZoom < minZoom || updatedZoom > maxZoom) return

      this.applyZoom(updatedZoom)
    }
    document.addEventListener('wheel', mouseZoom, {
      passive: false
    })

    this.inputZoomLevel = (zoom) => {
      const inputZoomLevel = document.querySelector(this.containerSelector + ' #input-zoom-level');
      if (inputZoomLevel) {
        inputZoomLevel.value = zoom
        document.getElementById('zoom-value').textContent = Math.round((zoom * 100)) + '%'
      }
    }

  }

  window.ImageEditor.prototype.initializeZoomEvents = zoom;
})();
