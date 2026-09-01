/**
 * Canvas and background settings panel.
 */
(function () {
  'use strict';

  var canvasSettings = function () {
    const _self = this;
    const isRussian = window.lang === 'ru';
    const backgroundFillMarkup = layout => `
      <div class="background-fill-block">
        <div class="background-section-heading">
          ${isRussian ? 'Заливка под изображением' : 'Fill behind image'}
        </div>
        <p class="background-help">
          ${isRussian
            ? 'Цвет или градиент виден через прозрачные области PNG.'
            : 'The color or gradient shows through transparent PNG areas.'}
        </p>

        <div class="background-fill-tabs" role="tablist">
          <button class="active" type="button" data-background-fill-tab="color">
            ${isRussian ? 'Цвет' : 'Color'}
          </button>
          <button type="button" data-background-fill-tab="gradient">
            ${isRussian ? 'Градиент' : 'Gradient'}
          </button>
        </div>

        <div data-background-fill-panel="color">
          <label class="background-color-control">
            <input
              type="color"
              value="#ffffff"
              data-background-color-picker
              aria-label="${isRussian ? 'Цвет под фоном' : 'Color behind image'}"
            >
            <span data-background-color-value>#FFFFFF</span>
          </label>
        </div>

        <div data-background-fill-panel="gradient" hidden>
          <div class="background-gradient-picker" id="background-gradient-picker-${layout}"></div>
          <div class="background-gradient-options">
            <label>
              <span>${isRussian ? 'Тип' : 'Type'}</span>
              <select data-background-gradient-type>
                <option value="linear">${isRussian ? 'Линейный' : 'Linear'}</option>
                <option value="radial">${isRussian ? 'Радиальный' : 'Radial'}</option>
              </select>
            </label>
            <label data-background-gradient-angle-row>
              <span>${isRussian ? 'Угол' : 'Angle'}</span>
              <input data-background-gradient-angle type="number" min="0" max="360" value="0">
            </label>
          </div>
        </div>
      </div>
    `;
    const backgroundLayoutMarkup = (layout, label, size, mirrorControl = '') => `
      <section class="background-settings-section" data-background-layout-section="${layout}">
        <div class="background-layout-heading">
          <strong>${label}</strong>
          <span>${size}</span>
        </div>

        ${mirrorControl}

        <button class="background-primary-action" type="button" data-background-upload-layout="${layout}">
          ${isRussian ? 'Загрузить фон' : 'Upload background'}
        </button>

        <div class="background-file-card" data-background-file-card hidden>
          <div class="background-file-copy">
            <strong data-background-file-name></strong>
            <span data-background-file-details></span>
          </div>
          <button class="background-remove-action" type="button" data-background-remove-layout="${layout}">
            ${isRussian ? 'Удалить' : 'Remove'}
          </button>
        </div>

        <div class="background-fit-settings" data-background-fit-settings hidden>
          <span class="background-control-label">
            ${isRussian ? 'Размещение изображения' : 'Image placement'}
          </span>
          <div class="background-fit-buttons">
            <button
              type="button"
              data-background-fit="cover"
              title="${isRussian ? 'Без искажений, лишнее по краям обрезается' : 'Keep proportions and crop the edges'}"
            >
              ${isRussian ? 'Заполнить' : 'Cover'}
            </button>
            <button
              type="button"
              data-background-fit="stretch"
              title="${isRussian ? 'Показать картинку целиком, изменив пропорции' : 'Show the whole image and change its proportions'}"
            >
              ${isRussian ? 'Растянуть' : 'Stretch'}
            </button>
          </div>
        </div>

        ${backgroundFillMarkup(layout)}
      </section>
    `;
    const stripMirrorControl = `
      <label class="background-toggle-control background-strip-mirror-control">
        <span>
          <strong>${isRussian ? 'Зеркалить фон второй полоски' : 'Mirror the second strip background'}</strong>
          <small>${isRussian
            ? 'Содержимое фото и текста не отражается'
            : 'Photo and text contents stay readable'}</small>
        </span>
        <input id="strip-mirror-second" type="checkbox" checked>
      </label>
    `;

    $(`${this.containerSelector} .main-panel`).append(`
      <div class="toolpanel" id="background-panel">
        <div class="content">
          <p class="title">${isRussian ? 'Фоны макетов' : 'Layout backgrounds'}</p>
          <p class="background-panel-help">
            ${isRussian
              ? 'Оба макета настраиваются здесь независимо от открытого холста.'
              : 'Configure both layouts here without switching the open canvas.'}
          </p>
          ${backgroundLayoutMarkup('grid', 'Grid', '3688 × 2480 px')}
          ${backgroundLayoutMarkup('strips', 'Strips', '1240 × 3688 px', stripMirrorControl)}
        </div>
      </div>
    `);

    if (_self.canvasSizeBlock === false) {
      $(`${this.containerSelector} #background-panel .content`).prepend(`
        <div class="canvas-size-setting">
          <p>${isRussian ? 'Размер холста' : 'Canvas size'}</p>
          <div class="input-container">
            <label>${isRussian ? 'Ширина' : 'Width'}</label>
            <div class="custom-number-input">
              <button class="decrease" type="button">−</button>
              <input type="number" min="100" id="input-width" value="1360">
              <button class="increase" type="button">+</button>
            </div>
          </div>
          <div class="input-container">
            <label>${isRussian ? 'Высота' : 'Height'}</label>
            <div class="custom-number-input">
              <button class="decrease" type="button">−</button>
              <input type="number" min="100" id="input-height" value="768">
              <button class="increase" type="button">+</button>
            </div>
          </div>
        </div>
      `);

      const setDimension = () => {
        const width = Number($(`${this.containerSelector} #background-panel #input-width`).val());
        const height = Number($(`${this.containerSelector} #background-panel #input-height`).val());

        if (!Number.isFinite(width) || !Number.isFinite(height)) {
          return;
        }

        _self.canvas.setWidth(width);
        _self.canvas.setHeight(height);
        _self.canvas.originalW = width;
        _self.canvas.originalH = height;
        _self.canvas.requestRenderAll();
        _self.canvas.fire('object:modified');
      };

      $(`${this.containerSelector} #background-panel #input-width`).change(setDimension);
      $(`${this.containerSelector} #background-panel #input-height`).change(setDimension);
    }

    const backgroundFillControllers = {};
    ['grid', 'strips'].forEach(layout => {
      const section = document.querySelector(
        `${this.containerSelector} [data-background-layout-section="${layout}"]`,
      );
      const colorInput = section.querySelector('[data-background-color-picker]');
      const colorValue = section.querySelector('[data-background-color-value]');
      const fillTabs = section.querySelectorAll('[data-background-fill-tab]');
      const fillPanels = section.querySelectorAll('[data-background-fill-panel]');
      const gradientType = section.querySelector('[data-background-gradient-type]');
      const gradientAngle = section.querySelector('[data-background-gradient-angle]');
      const gradientAngleRow = section.querySelector('[data-background-gradient-angle-row]');
      const gradientPicker = new Grapick({
        el: `${this.containerSelector} #background-gradient-picker-${layout}`,
        colorEl: '<input class="background-gradient-color-picker">',
      });
      let activeFill = 'color';

      gradientPicker.setColorPicker(handler => {
        const input = handler.getEl().querySelector('.background-gradient-color-picker');
        $(input).spectrum({
          showPalette: false,
          showButtons: false,
          type: 'color',
          showInput: true,
          allowEmpty: false,
          color: window.spectrumInputColor(handler.getColor()),
          preferredFormat: 'hex8',
          showAlpha: true,
          change(color) {
            handler.setColor(window.colorToHex(color));
          },
          move(color) {
            handler.setColor(window.colorToHex(color), 0);
          },
        });
      });
      gradientPicker.addHandler(0, '#ffffff');
      gradientPicker.addHandler(100, '#6d5dfc');

      const state = () => ({
        type: activeFill,
        color: colorInput.value,
        gradient: {
          type: gradientType.value,
          angle: Number(gradientAngle.value) || 0,
          stops: gradientPicker.getHandlers().map(handler => ({
            color: window.colorToHex(handler.color) || '#000000',
            position: handler.position,
          })),
        },
      });
      const handledOutsideCanvas = () => (
        typeof _self.onBackgroundFillChange === 'function'
        && _self.onBackgroundFillChange(layout, state()) === true
      );
      const notifyBackgroundChange = () => {
        _self.canvas.fire('background:modified');
      };
      const applyColor = (notify = true, allowExternalHandler = true) => {
        const color = colorInput.value.toUpperCase();
        colorValue.textContent = color;
        if (allowExternalHandler && handledOutsideCanvas()) return;

        _self.canvas.setBackgroundColor(color);
        _self.canvas.requestRenderAll();
        if (notify) notifyBackgroundChange();
      };
      const applyGradient = (notify = true, allowExternalHandler = true) => {
        if (allowExternalHandler && handledOutsideCanvas()) return;

        _self.canvas.setBackgroundColor(_self.generateFabricGradientFromColorStops(
          gradientPicker.getHandlers(),
          _self.canvas.originalW,
          _self.canvas.originalH,
          gradientType.value,
          Number(gradientAngle.value) || 0,
        ));
        _self.canvas.requestRenderAll();
        if (notify) notifyBackgroundChange();
      };
      const renderFillType = fillType => {
        activeFill = fillType;
        fillTabs.forEach(tab => {
          tab.classList.toggle('active', tab.dataset.backgroundFillTab === fillType);
        });
        fillPanels.forEach(panel => {
          panel.hidden = panel.dataset.backgroundFillPanel !== fillType;
        });
      };
      const applyFill = (notify = true, allowExternalHandler = true) => {
        if (activeFill === 'gradient') {
          applyGradient(notify, allowExternalHandler);
        } else {
          applyColor(notify, allowExternalHandler);
        }
      };
      const setState = (nextState, applyToCanvas = true) => {
        if (!nextState) return;

        if (/^#[0-9a-f]{6}$/i.test(nextState.color || '')) {
          colorInput.value = nextState.color;
          colorValue.textContent = nextState.color.toUpperCase();
        }
        if (nextState.gradient) {
          gradientType.value = nextState.gradient.type === 'radial' ? 'radial' : 'linear';
          gradientAngle.value = Number(nextState.gradient.angle) || 0;
          gradientAngleRow.hidden = gradientType.value === 'radial';
          if (Array.isArray(nextState.gradient.stops) && nextState.gradient.stops.length) {
            gradientPicker.clear({ silent: true });
            nextState.gradient.stops.forEach(stop => {
              gradientPicker.addHandler(
                Number(stop.position) || 0,
                window.colorToHex(stop.color) || '#000000',
                0,
                { silent: true },
              );
            });
            gradientPicker.updatePreview();
          }
        }
        renderFillType(nextState.type === 'gradient' ? 'gradient' : 'color');
        if (applyToCanvas) applyFill(false, false);
      };

      fillTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          renderFillType(tab.dataset.backgroundFillTab);
          applyFill();
        });
      });
      colorInput.addEventListener('input', () => applyColor());
      colorInput.addEventListener('change', () => applyColor());
      gradientPicker.on('change', () => {
        if (activeFill === 'gradient') applyGradient();
      });
      gradientType.addEventListener('change', () => {
        gradientAngleRow.hidden = gradientType.value === 'radial';
        if (activeFill === 'gradient') applyGradient();
      });
      gradientAngle.addEventListener('input', () => {
        if (activeFill === 'gradient') applyGradient();
      });
      renderFillType('color');
      backgroundFillControllers[layout] = { getState: state, setState };
    });

    _self.getBackgroundFillState = layout => (
      backgroundFillControllers[layout]?.getState() || null
    );
    _self.setBackgroundFillState = (layout, state, applyToCanvas = true) => {
      backgroundFillControllers[layout]?.setState(state, applyToCanvas);
    };

    if (_self.trim) {
      const trim = {
        left: Number(_self.trim.left) || 0,
        top: Number(_self.trim.top) || 0,
        right: Number(_self.trim.right) || 0,
        bottom: Number(_self.trim.bottom) || 0,
      };
      let canvasWidth = _self.canvas.originalW;
      let canvasHeight = _self.canvas.originalH;
      const visibleWidth = canvasWidth - trim.left - trim.right;
      const visibleHeight = canvasHeight - trim.top - trim.bottom;

      $(`${this.containerSelector} .main-panel`).append(`
        <div class="toolpanel" id="trim-panel">
          <div class="content">
            <p class="title">${isRussian ? 'Обрезка печати' : 'Print trim'}</p>
            <p class="photo-layout-help" id="trim-context-note"></p>

            <section class="trim-settings-section">
              <label class="trim-visibility-control">
                <span>
                  <strong>${isRussian ? 'Показывать обрезку' : 'Show print trim'}</strong>
                  <small>${isRussian
                    ? 'Только в редакторе, в файл не попадёт'
                    : 'Editor preview only, never exported'}</small>
                </span>
                <input id="trim-preview-visible" type="checkbox" checked>
              </label>

              <div class="trim-mode-buttons" role="group" aria-label="${isRussian ? 'Режим просмотра' : 'Preview mode'}">
                <button class="active" type="button" data-trim-mode="zones">
                  ${isRussian ? 'Зоны обрезки' : 'Trim areas'}
                </button>
                <button type="button" data-trim-mode="cut">
                  ${isRussian ? 'После резки' : 'After cutting'}
                </button>
              </div>
            </section>

            <section class="trim-settings-section">
              <div class="trim-values-heading">
                <div class="background-section-heading" id="trim-values-title">
                  ${isRussian ? 'Обрезаемые края' : 'Trimmed edges'}
                </div>
                <button id="trim-values-lock" type="button" aria-pressed="false">
                  ${isRussian ? 'Изменить' : 'Edit'}
                </button>
              </div>
              <div class="trim-values-grid">
                <label><span>${isRussian ? 'Слева' : 'Left'}</span><input type="number" min="0" step="1" value="${trim.left}" data-trim-side="left" readonly></label>
                <label><span>${isRussian ? 'Сверху' : 'Top'}</span><input type="number" min="0" step="1" value="${trim.top}" data-trim-side="top" readonly></label>
                <label><span>${isRussian ? 'Справа' : 'Right'}</span><input type="number" min="0" step="1" value="${trim.right}" data-trim-side="right" readonly></label>
                <label><span>${isRussian ? 'Снизу' : 'Bottom'}</span><input type="number" min="0" step="1" value="${trim.bottom}" data-trim-side="bottom" readonly></label>
              </div>
              <p id="trim-values-error" class="trim-values-error" hidden></p>
              <p class="trim-unit-note">${isRussian ? 'Значения в пикселях' : 'Values in pixels'}</p>

              <div class="background-section-heading trim-visible-heading">
                ${isRussian ? 'Видимая область' : 'Visible area'}
              </div>
              <div class="trim-values-grid trim-visible-values">
                <label><span>${isRussian ? 'Ширина' : 'Width'}</span><input id="trim-visible-width" type="number" value="${visibleWidth}" readonly></label>
                <label><span>${isRussian ? 'Высота' : 'Height'}</span><input id="trim-visible-height" type="number" value="${visibleHeight}" readonly></label>
              </div>
              <p class="trim-raster-note" id="trim-raster-note">
                ${isRussian
                  ? `Полный файл остаётся ${canvasWidth} × ${canvasHeight} px.`
                  : `The full file remains ${canvasWidth} × ${canvasHeight} px.`}
              </p>
            </section>

            <section class="trim-settings-section" id="trim-color-controls">
              <div class="background-section-heading">
                ${isRussian ? 'Вид зон' : 'Area appearance'}
              </div>
              <label class="trim-color-control">
                <span>${isRussian ? 'Цвет' : 'Color'}</span>
                <span class="trim-color-input">
                  <input id="trim-preview-color" type="color" value="#ff2d55">
                  <output id="trim-preview-color-value">#FF2D55</output>
                </span>
              </label>
              <label class="trim-opacity-control">
                <span>${isRussian ? 'Непрозрачность' : 'Opacity'}</span>
                <span class="trim-opacity-input">
                  <input id="trim-preview-opacity" type="range" min="0" max="100" step="1" value="75">
                  <output id="trim-preview-opacity-value">75%</output>
                </span>
              </label>
            </section>
          </div>
        </div>
      `);

      const canvasContainer = _self.canvas.upperCanvasEl.parentElement;
      canvasContainer.insertAdjacentHTML('beforeend', `
        <div class="trim-preview-overlay" hidden aria-hidden="true">
          <span class="trim-preview-zone trim-preview-left"></span>
          <span class="trim-preview-zone trim-preview-top"></span>
          <span class="trim-preview-zone trim-preview-right"></span>
          <span class="trim-preview-zone trim-preview-bottom"></span>
          <span class="trim-visible-frame"></span>
        </div>
      `);

      const trimOverlay = canvasContainer.querySelector('.trim-preview-overlay');
      const visibleInput = document.querySelector(
        `${this.containerSelector} #trim-preview-visible`,
      );
      const modeButtons = document.querySelectorAll(
        `${this.containerSelector} [data-trim-mode]`,
      );
      const colorInput = document.querySelector(
        `${this.containerSelector} #trim-preview-color`,
      );
      const colorValue = document.querySelector(
        `${this.containerSelector} #trim-preview-color-value`,
      );
      const opacityInput = document.querySelector(
        `${this.containerSelector} #trim-preview-opacity`,
      );
      const opacityValue = document.querySelector(
        `${this.containerSelector} #trim-preview-opacity-value`,
      );
      const colorControls = document.querySelector(
        `${this.containerSelector} #trim-color-controls`,
      );
      const toolbarButton = document.querySelector(
        `${this.containerSelector} #toolbar #trim`,
      );
      const trimInputs = {};
      document.querySelectorAll(
        `${this.containerSelector} [data-trim-side]`,
      ).forEach(input => {
        trimInputs[input.dataset.trimSide] = input;
      });
      const visibleWidthInput = document.querySelector(
        `${this.containerSelector} #trim-visible-width`,
      );
      const visibleHeightInput = document.querySelector(
        `${this.containerSelector} #trim-visible-height`,
      );
      const valuesLockButton = document.querySelector(
        `${this.containerSelector} #trim-values-lock`,
      );
      const valuesTitle = document.querySelector(
        `${this.containerSelector} #trim-values-title`,
      );
      const valuesError = document.querySelector(
        `${this.containerSelector} #trim-values-error`,
      );
      const contextNote = document.querySelector(
        `${this.containerSelector} #trim-context-note`,
      );
      const rasterNote = document.querySelector(
        `${this.containerSelector} #trim-raster-note`,
      );
      let trimMode = 'zones';
      let trimValuesUnlocked = false;
      let trimValuesEditable = true;
      let trimDisplay = null;

      const normalizeTrimValues = getValue => {
        const next = {};

        for (const side of ['left', 'top', 'right', 'bottom']) {
          const value = Number(getValue(side));

          if (!Number.isInteger(value) || value < 0) {
            return null;
          }

          next[side] = value;
        }

        if (
          next.left + next.right >= canvasWidth
          || next.top + next.bottom >= canvasHeight
        ) {
          return null;
        }

        return next;
      };
      const readTrimInputs = () => normalizeTrimValues(
        side => trimInputs[side].value,
      );

      const setTrimValuesValidity = valid => {
        valuesError.hidden = valid;
        valuesError.textContent = valid
          ? ''
          : (isRussian
            ? 'Края должны быть целыми неотрицательными числами и оставлять видимую область.'
            : 'Edges must be non-negative integers and leave a visible area.');
        Object.values(trimInputs).forEach(input => {
          input.classList.toggle('invalid', !valid);
        });
      };

      const renderTrimValues = (renderInputs = false) => {
        const currentVisibleWidth = canvasWidth - trim.left - trim.right;
        const currentVisibleHeight = canvasHeight - trim.top - trim.bottom;
        const shownTrim = trimDisplay?.trim || trim;
        const shownWidth = trimDisplay?.width || canvasWidth;
        const shownHeight = trimDisplay?.height || canvasHeight;

        if (renderInputs) {
          Object.entries(trimInputs).forEach(([side, input]) => {
            input.value = shownTrim[side];
          });
        }

        visibleWidthInput.value = shownWidth - shownTrim.left - shownTrim.right;
        visibleHeightInput.value = shownHeight - shownTrim.top - shownTrim.bottom;
        canvasContainer.style.setProperty(
          '--trim-left',
          `${(trim.left / canvasWidth) * 100}%`,
        );
        canvasContainer.style.setProperty(
          '--trim-top',
          `${(trim.top / canvasHeight) * 100}%`,
        );
        canvasContainer.style.setProperty(
          '--trim-right',
          `${(trim.right / canvasWidth) * 100}%`,
        );
        canvasContainer.style.setProperty(
          '--trim-bottom',
          `${(trim.bottom / canvasHeight) * 100}%`,
        );

        Object.assign(_self.trim, trim, {
          visible_size: [currentVisibleWidth, currentVisibleHeight],
        });
        _self.canvas.printTrim = {
          ...trim,
          visible_size: [currentVisibleWidth, currentVisibleHeight],
        };
      };

      const applyTrimValues = (notify = true, addToHistory = false) => {
        const next = readTrimInputs();

        if (!next) {
          setTrimValuesValidity(false);
          return false;
        }

        setTrimValuesValidity(true);
        Object.assign(trim, next);
        renderTrimValues();

        if (notify) {
          _self.canvas.fire('trim:modified');
        }
        if (addToHistory) {
          _self.canvas._historySaveAction();
        }

        return true;
      };

      const setTrimValuesUnlocked = unlocked => {
        trimValuesUnlocked = trimValuesEditable && unlocked;
        Object.values(trimInputs).forEach(input => {
          input.readOnly = !trimValuesUnlocked;
        });
        valuesLockButton.classList.toggle('active', trimValuesUnlocked);
        valuesLockButton.setAttribute(
          'aria-pressed',
          String(trimValuesUnlocked),
        );
        valuesLockButton.textContent = trimValuesUnlocked
          ? (isRussian ? 'Готово' : 'Done')
          : (isRussian ? 'Изменить' : 'Edit');

        if (trimValuesUnlocked) {
          trimInputs.left.focus();
          trimInputs.left.select();
        }
      };

      const applyTrimPreview = (notify = true) => {
        const visible = visibleInput.checked;
        const opacity = Math.max(0, Math.min(100, Number(opacityInput.value)));
        const showZones = visible && trimMode === 'zones';
        const showCut = visible && trimMode === 'cut';

        trimOverlay.hidden = !showZones;
        trimOverlay.style.setProperty('--trim-color', colorInput.value);
        trimOverlay.style.setProperty('--trim-opacity', opacity / 100);
        canvasContainer.classList.toggle('trim-cut-preview', showCut);
        colorControls.hidden = trimMode === 'cut';
        colorValue.textContent = colorInput.value.toUpperCase();
        opacityValue.textContent = `${opacity}%`;
        toolbarButton.setAttribute('aria-pressed', String(visible));
        modeButtons.forEach(button => {
          button.classList.toggle('active', button.dataset.trimMode === trimMode);
        });

        if (notify) {
          _self.canvas.fire('trim:modified');
        }
      };

      _self.getTrimPreviewState = () => ({
        visible: visibleInput.checked,
        mode: trimMode,
        color: colorInput.value,
        opacity: Number(opacityInput.value),
      });

      _self.getPrintTrimState = () => ({
        ...trim,
        visible_size: [
          canvasWidth - trim.left - trim.right,
          canvasHeight - trim.top - trim.bottom,
        ],
      });

      _self.setPrintTrimState = (state, notify = false) => {
        if (!state) {
          return false;
        }

        const next = normalizeTrimValues(side => state[side]);
        if (!next) {
          return false;
        }

        Object.assign(trim, next);
        setTrimValuesValidity(true);
        renderTrimValues(true);

        if (notify) {
          _self.canvas.fire('trim:modified');
        }

        return true;
      };

      _self.setTrimContext = state => {
        if (
          !state
          || !Number.isFinite(Number(state.width))
          || !Number.isFinite(Number(state.height))
        ) {
          return false;
        }

        canvasWidth = Math.round(Number(state.width));
        canvasHeight = Math.round(Number(state.height));
        const displayWidth = Math.round(Number(state.display?.width));
        const displayHeight = Math.round(Number(state.display?.height));
        const displayTrim = state.display?.trim;
        const hasDisplay = (
          Number.isInteger(displayWidth)
          && displayWidth > 0
          && Number.isInteger(displayHeight)
          && displayHeight > 0
          && ['left', 'top', 'right', 'bottom'].every(side => (
            Number.isInteger(Number(displayTrim?.[side]))
            && Number(displayTrim[side]) >= 0
          ))
          && Number(displayTrim.left) + Number(displayTrim.right) < displayWidth
          && Number(displayTrim.top) + Number(displayTrim.bottom) < displayHeight
        );
        trimDisplay = hasDisplay ? {
          width: displayWidth,
          height: displayHeight,
          trim: Object.fromEntries(
            ['left', 'top', 'right', 'bottom'].map(side => [side, Number(displayTrim[side])]),
          ),
        } : null;
        trimValuesEditable = state.editable !== false;
        setTrimValuesUnlocked(false);
        valuesLockButton.disabled = !trimValuesEditable;
        valuesLockButton.hidden = !trimValuesEditable;
        contextNote.textContent = state.note || '';
        contextNote.hidden = !contextNote.textContent;
        valuesTitle.textContent = trimDisplay
          ? (isRussian ? 'Trim полного печатного листа' : 'Complete print sheet trim')
          : (isRussian ? 'Обрезаемые края' : 'Trimmed edges');
        const shownWidth = trimDisplay?.width || canvasWidth;
        const shownHeight = trimDisplay?.height || canvasHeight;
        rasterNote.textContent = isRussian
          ? `Полный файл остаётся ${shownWidth} × ${shownHeight} px.`
          : `The full file remains ${shownWidth} × ${shownHeight} px.`;

        const next = normalizeTrimValues(side => state.trim?.[side] ?? 0);
        if (!next) {
          return false;
        }
        Object.assign(trim, next);
        setTrimValuesValidity(true);
        renderTrimValues(true);
        applyTrimPreview(false);
        return true;
      };

      _self.setTrimPreviewState = state => {
        if (!state) {
          return;
        }

        visibleInput.checked = state.visible === true;
        trimMode = state.mode === 'cut' ? 'cut' : 'zones';

        if (/^#[0-9a-f]{6}$/i.test(state.color || '')) {
          colorInput.value = state.color;
        }

        if (Number.isFinite(Number(state.opacity))) {
          opacityInput.value = Math.max(0, Math.min(100, Number(state.opacity)));
        }

        applyTrimPreview(false);
      };

      _self.setTrimPreviewVisible = visible => {
        visibleInput.checked = visible === true;
        applyTrimPreview();
      };

      visibleInput.addEventListener('change', applyTrimPreview);
      colorInput.addEventListener('input', applyTrimPreview);
      opacityInput.addEventListener('input', applyTrimPreview);
      valuesLockButton.addEventListener('click', () => {
        if (!trimValuesEditable) {
          return;
        }
        if (trimValuesUnlocked && !applyTrimValues()) {
          renderTrimValues(true);
          setTrimValuesValidity(true);
        }
        setTrimValuesUnlocked(!trimValuesUnlocked);
      });
      Object.values(trimInputs).forEach(input => {
        input.addEventListener('input', () => {
          applyTrimValues();
        });
        input.addEventListener('change', () => {
          if (!applyTrimValues(true, true)) {
            renderTrimValues(true);
            setTrimValuesValidity(true);
          }
        });
      });
      modeButtons.forEach(button => {
        button.addEventListener('click', () => {
          trimMode = button.dataset.trimMode;
          applyTrimPreview();
        });
      });
      _self.canvas.on('trim:history', event => {
        _self.setPrintTrimState(event.trim, true);
      });
      renderTrimValues(true);
      applyTrimPreview(false);
    }
  };

  window.ImageEditor.prototype.initializeCanvasSettingPanel = canvasSettings;
})();
