/**
 * Canvas zoom and workspace pan.
 */
(function () {
  'use strict';

  function zoom() {
    const editor = this;
    const minZoom = 0.05;
    const maxZoom = 3;
    const canvasHolder = document.querySelector(`${this.containerSelector} .canvas-holder`);
    const canvasContainer = this.canvas.upperCanvasEl.parentElement;
    const canvasContent = canvasContainer.parentElement;
    let pan = { x: 0, y: 0 };
    let spacePressed = false;
    let drag = null;
    let touchGesture = null;

    $(`${this.containerSelector} #footerbar .zoom-level-container`).append(`
      <button type="button" id="zoom-fit" title="${window.lang === 'ru' ? 'Вписать холст в свободную область' : 'Fit canvas into free space'}" aria-label="${window.lang === 'ru' ? 'Вписать холст в свободную область' : 'Fit canvas into free space'}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
          <path d="M344 0H488c13.3 0 24 10.7 24 24V168c0 9.7-5.8 18.5-14.8 22.2s-19.3 1.7-26.2-5.2l-39-39-87 87c-9.4 9.4-24.6 9.4-33.9 0l-32-32c-9.4-9.4-9.4-24.6 0-33.9l87-87L327 41c-6.9-6.9-8.9-17.2-5.2-26.2S334.3 0 344 0zM168 512H24c-13.3 0-24-10.7-24-24V344c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2l39 39 87-87c9.4-9.4 24.6-9.4 33.9 0l32 32c9.4 9.4 9.4 24.6 0 33.9l-87 87 39 39c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8z"/>
        </svg>
      </button>
      <input type="range" id="input-zoom-level" min="${minZoom}" max="${maxZoom}" step="0.05" value="1" oninput="updateZoomValue(this.value)">
      <div id="zoom-value">100%</div>
    `);

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
    const zoomValue = value => clamp(Number(value) || 1, minZoom, maxZoom);
    const holderPoint = (clientX, clientY) => {
      const bounds = canvasHolder.getBoundingClientRect();
      return { x: clientX - bounds.left, y: clientY - bounds.top };
    };
    const workspacePadding = () => (
      parseFloat(getComputedStyle(canvasHolder).getPropertyValue('--canvas-padding')) || 0
    );

    const workspaceRect = () => {
      const padding = workspacePadding();
      let right = canvasHolder.clientWidth - padding;
      let bottom = canvasHolder.clientHeight - padding;
      const panel = document.querySelector(
        `${editor.containerSelector} .toolpanel.visible:not(.closed)`,
      );

      if (panel) {
        const panelBounds = panel.getBoundingClientRect();
        if (window.matchMedia('(max-width: 820px)').matches) {
          bottom -= panelBounds.height + padding;
        } else {
          right -= panelBounds.width + padding;
        }
      }

      right = Math.max(padding + 1, right);
      bottom = Math.max(padding + 1, bottom);
      return {
        left: padding,
        top: padding,
        right,
        bottom,
        width: right - padding,
        height: bottom - padding,
      };
    };

    const pairElements = () => {
      const copy = canvasContent.querySelector('.strip-copy-preview:not([hidden])');
      const divider = canvasContent.querySelector('.strip-pair-divider:not([hidden])');
      return { copy, divider };
    };

    const contentSize = () => {
      const { copy, divider } = pairElements();
      const canvasWidth = editor.canvas.getWidth();
      const canvasHeight = editor.canvas.getHeight();
      const dividerWidth = divider ? divider.getBoundingClientRect().width : 0;
      const width = canvasWidth + (copy ? canvasWidth + dividerWidth : 0);

      if (copy) {
        copy.style.width = `${canvasWidth}px`;
        copy.style.height = `${canvasHeight}px`;
      }
      canvasContent.style.width = `${width}px`;
      canvasContent.style.height = `${canvasHeight}px`;
      return { width, height: canvasHeight };
    };

    const constrainedPan = (x, y) => {
      const area = workspaceRect();
      const size = contentSize();
      return {
        x: clamp(x, area.left - size.width + 1, area.right - 1),
        y: clamp(y, area.top - size.height + 1, area.bottom - 1),
      };
    };

    const applyPan = (x = pan.x, y = pan.y) => {
      pan = constrainedPan(x, y);
      canvasContent.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0)`;
      editor.canvas.calcOffset();
    };

    const resizeCanvas = value => {
      const nextZoom = zoomValue(value);
      editor.canvas.setZoom(nextZoom);
      editor.canvas.setWidth(editor.canvas.originalW * nextZoom);
      editor.canvas.setHeight(editor.canvas.originalH * nextZoom);
      editor.canvas.requestRenderAll();
      editor.inputZoomLevel(nextZoom);
      contentSize();
      return nextZoom;
    };

    this.inputZoomLevel = value => {
      const input = document.querySelector(`${this.containerSelector} #input-zoom-level`);
      const output = document.querySelector(`${this.containerSelector} #zoom-value`);
      if (input) input.value = value;
      if (output) output.textContent = `${Math.round(value * 100)}%`;
    };

    this.applyZoom = (value, anchor = null) => {
      const area = workspaceRect();
      const point = anchor || {
        x: area.left + (area.width / 2),
        y: area.top + (area.height / 2),
      };
      const oldSize = contentSize();
      const relativeX = oldSize.width ? (point.x - pan.x) / oldSize.width : 0.5;
      const relativeY = oldSize.height ? (point.y - pan.y) / oldSize.height : 0.5;

      resizeCanvas(value);
      const newSize = contentSize();
      applyPan(
        point.x - (relativeX * newSize.width),
        point.y - (relativeY * newSize.height),
      );
    };

    this.fitZoom = () => {
      const area = workspaceRect();
      const { copy, divider } = pairElements();
      const canvasCount = copy ? 2 : 1;
      const dividerWidth = divider ? divider.getBoundingClientRect().width : 0;
      const widthZoom = Math.max(1, area.width - dividerWidth)
        / (editor.canvas.originalW * canvasCount);
      const heightZoom = area.height / editor.canvas.originalH;
      const fittedZoom = clamp(Math.min(widthZoom, heightZoom), minZoom, maxZoom);

      resizeCanvas(Math.floor(fittedZoom * 10000) / 10000);
      const size = contentSize();
      applyPan(
        area.left + ((area.width - size.width) / 2),
        area.top + ((area.height - size.height) / 2),
      );
    };

    const movePan = (deltaX, deltaY) => {
      applyPan(pan.x + deltaX, pan.y + deltaY);
    };

    canvasHolder.addEventListener('wheel', event => {
      event.preventDefault();
      const deltaScale = event.deltaMode === 1
        ? 16
        : (event.deltaMode === 2 ? canvasHolder.clientHeight : 1);

      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-(event.deltaY * deltaScale) * 0.002);
        editor.applyZoom(
          editor.canvas.getZoom() * factor,
          holderPoint(event.clientX, event.clientY),
        );
        return;
      }

      let deltaX = event.deltaX * deltaScale;
      let deltaY = event.deltaY * deltaScale;
      if (event.shiftKey && Math.abs(deltaX) < Math.abs(deltaY)) {
        deltaX = deltaY;
        deltaY = 0;
      }
      movePan(-deltaX, -deltaY);
    }, { passive: false });

    canvasHolder.addEventListener('pointerdown', event => {
      const canDrag = event.button === 1 || (event.button === 0 && spacePressed);
      if (!canDrag) return;

      event.preventDefault();
      event.stopPropagation();
      drag = { x: event.clientX, y: event.clientY };
      canvasHolder.classList.add('is-panning');
    }, true);

    window.addEventListener('pointermove', event => {
      if (!drag) return;
      movePan(event.clientX - drag.x, event.clientY - drag.y);
      drag = { x: event.clientX, y: event.clientY };
    });

    const finishDrag = () => {
      drag = null;
      canvasHolder.classList.remove('is-panning');
    };
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);

    const touchDetails = touches => {
      const first = touches[0];
      const second = touches[1];
      return {
        distance: Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY),
        center: holderPoint(
          (first.clientX + second.clientX) / 2,
          (first.clientY + second.clientY) / 2,
        ),
      };
    };

    canvasHolder.addEventListener('touchstart', event => {
      if (event.touches.length !== 2) return;
      event.preventDefault();
      touchGesture = touchDetails(event.touches);
    }, { passive: false });

    canvasHolder.addEventListener('touchmove', event => {
      if (event.touches.length !== 2 || !touchGesture) return;
      event.preventDefault();
      const next = touchDetails(event.touches);
      editor.applyZoom(
        editor.canvas.getZoom() * (next.distance / touchGesture.distance),
        touchGesture.center,
      );
      movePan(
        next.center.x - touchGesture.center.x,
        next.center.y - touchGesture.center.y,
      );
      touchGesture = next;
    }, { passive: false });

    canvasHolder.addEventListener('touchend', event => {
      if (event.touches.length < 2) touchGesture = null;
    });
    canvasHolder.addEventListener('touchcancel', () => {
      touchGesture = null;
    });

    const isInteractive = target => target?.isContentEditable
      || Boolean(target?.closest?.('input, textarea, select, button, a, [role="button"]'));

    document.addEventListener('keydown', event => {
      if (event.code === 'Space' && !isInteractive(event.target)) {
        event.preventDefault();
        spacePressed = true;
        canvasHolder.classList.add('can-pan');
      }

      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        editor.applyZoom(editor.canvas.getZoom() + 0.25);
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        editor.applyZoom(editor.canvas.getZoom() - 0.25);
      } else if (event.key === '0') {
        event.preventDefault();
        editor.applyZoom(1);
      }
    });

    document.addEventListener('keyup', event => {
      if (event.code !== 'Space') return;
      spacePressed = false;
      canvasHolder.classList.remove('can-pan');
      finishDrag();
    });

    document.querySelector(`${this.containerSelector} #zoom-fit`).addEventListener(
      'click',
      () => editor.fitZoom(),
    );
    window.updateZoomValue = value => editor.applyZoom(parseFloat(value));
    window.addEventListener('resize', () => applyPan());

    const panelObserver = new MutationObserver(() => {
      requestAnimationFrame(() => applyPan());
    });
    document.querySelectorAll(`${this.containerSelector} .toolpanel`).forEach(panel => {
      panelObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
    });

    this.inputZoomLevel(this.canvas.getZoom());
    contentSize();
  }

  window.ImageEditor.prototype.initializeZoomEvents = zoom;
})();
