/**
 * Canvas and background settings panel.
 */
(function () {
  'use strict';

  var canvasSettings = function () {
    const _self = this;
    const isRussian = window.lang === 'ru';

    $(`${this.containerSelector} .main-panel`).append(`
      <div class="toolpanel" id="background-panel">
        <div class="content">
          <p class="title">${isRussian ? 'Фон макета' : 'Canvas background'}</p>

          <section class="background-settings-section">
            <div class="background-section-heading">
              ${isRussian ? 'Фоновое изображение' : 'Background image'}
            </div>
            <p class="background-help">
              ${isRussian
                ? 'Фон занимает весь макет и не выделяется как обычный объект.'
                : 'The background fills the canvas and cannot be selected as a regular object.'}
            </p>

            <button id="background-upload-button" class="background-primary-action" type="button">
              ${isRussian ? 'Выбрать фоновое изображение' : 'Choose background image'}
            </button>

            <div id="background-file-card" class="background-file-card" hidden>
              <div class="background-file-copy">
                <strong id="background-file-name"></strong>
                <span id="background-file-details"></span>
              </div>
              <button id="background-remove-button" class="background-remove-action" type="button">
                ${isRussian ? 'Удалить' : 'Remove'}
              </button>
            </div>

            <div id="background-fit-settings" class="background-fit-settings" hidden>
              <span class="background-control-label">
                ${isRussian ? 'Размещение' : 'Placement'}
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
          </section>

          <section class="background-settings-section">
            <div class="background-section-heading">
              ${isRussian ? 'Заливка под фоном' : 'Fill behind image'}
            </div>
            <p class="background-help">
              ${isRussian
                ? 'Она лежит под изображением и видна через прозрачные области PNG.'
                : 'It sits below the image and shows through transparent areas of a PNG.'}
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
                  id="background-color-picker"
                  type="color"
                  value="#ffffff"
                  aria-label="${isRussian ? 'Цвет под фоном' : 'Color behind image'}"
                >
                <span id="background-color-value">#FFFFFF</span>
              </label>
            </div>

            <div data-background-fill-panel="gradient" hidden>
              <div id="background-gradient-picker"></div>
              <div class="background-gradient-options">
                <label>
                  <span>${isRussian ? 'Тип' : 'Type'}</span>
                  <select id="background-gradient-type">
                    <option value="linear">${isRussian ? 'Линейный' : 'Linear'}</option>
                    <option value="radial">${isRussian ? 'Радиальный' : 'Radial'}</option>
                  </select>
                </label>
                <label id="background-gradient-angle-row">
                  <span>${isRussian ? 'Угол' : 'Angle'}</span>
                  <input id="background-gradient-angle" type="number" min="0" max="360" value="0">
                </label>
              </div>
            </div>
          </section>
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

    const colorInput = document.querySelector(
      `${this.containerSelector} #background-color-picker`,
    );
    const colorValue = document.querySelector(
      `${this.containerSelector} #background-color-value`,
    );
    const fillTabs = document.querySelectorAll(
      `${this.containerSelector} [data-background-fill-tab]`,
    );
    const fillPanels = document.querySelectorAll(
      `${this.containerSelector} [data-background-fill-panel]`,
    );
    const gradientType = document.querySelector(
      `${this.containerSelector} #background-gradient-type`,
    );
    const gradientAngle = document.querySelector(
      `${this.containerSelector} #background-gradient-angle`,
    );
    const gradientAngleRow = document.querySelector(
      `${this.containerSelector} #background-gradient-angle-row`,
    );
    let activeFill = 'color';

    const notifyBackgroundChange = () => {
      _self.canvas.fire('background:modified');
    };

    const applyBackgroundColor = (notify = true) => {
      const color = colorInput.value.toUpperCase();
      colorValue.textContent = color;

      // Fabric renders backgroundColor first and backgroundImage above it.
      // Using the setter also keeps the color in PNG export.
      _self.canvas.setBackgroundColor(color);
      _self.canvas.requestRenderAll();

      if (notify) {
        notifyBackgroundChange();
      }
    };

    const gradientPicker = new Grapick({
      el: `${this.containerSelector} #background-gradient-picker`,
      colorEl: '<input class="background-gradient-color-picker">',
    });

    gradientPicker.setColorPicker(handler => {
      const input = handler.getEl().querySelector('.background-gradient-color-picker');

      $(input).spectrum({
        showPalette: false,
        showButtons: false,
        type: 'color',
        showInput: true,
        allowEmpty: false,
        color: handler.getColor(),
        showAlpha: true,
        change(color) {
          handler.setColor(color.toRgbString());
        },
        move(color) {
          handler.setColor(color.toRgbString(), 0);
        },
      });
    });

    gradientPicker.addHandler(0, '#ffffff');
    gradientPicker.addHandler(100, '#6d5dfc');

    const applyBackgroundGradient = (notify = true) => {
      const gradient = _self.generateFabricGradientFromColorStops(
        gradientPicker.getHandlers(),
        _self.canvas.originalW,
        _self.canvas.originalH,
        gradientType.value,
        Number(gradientAngle.value) || 0,
      );

      _self.canvas.setBackgroundColor(gradient);
      _self.canvas.requestRenderAll();

      if (notify) {
        notifyBackgroundChange();
      }
    };

    const setFillType = (fillType, notify = true) => {
      activeFill = fillType;

      fillTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.backgroundFillTab === fillType);
      });
      fillPanels.forEach(panel => {
        panel.hidden = panel.dataset.backgroundFillPanel !== fillType;
      });

      if (fillType === 'gradient') {
        applyBackgroundGradient(notify);
      } else {
        applyBackgroundColor(notify);
      }
    };

    _self.getBackgroundFillState = () => ({
      type: activeFill,
      color: colorInput.value,
      gradient: {
        type: gradientType.value,
        angle: Number(gradientAngle.value) || 0,
        stops: gradientPicker.getHandlers().map(handler => ({
          color: handler.color,
          position: handler.position,
        })),
      },
    });

    _self.setBackgroundFillState = state => {
      if (!state) {
        return;
      }

      if (/^#[0-9a-f]{6}$/i.test(state.color || '')) {
        colorInput.value = state.color;
        colorValue.textContent = state.color.toUpperCase();
      }

      if (state.gradient) {
        gradientType.value = state.gradient.type === 'radial' ? 'radial' : 'linear';
        gradientAngle.value = Number(state.gradient.angle) || 0;
        gradientAngleRow.hidden = gradientType.value === 'radial';

        if (Array.isArray(state.gradient.stops) && state.gradient.stops.length) {
          gradientPicker.clear({ silent: true });
          state.gradient.stops.forEach(stop => {
            gradientPicker.addHandler(
              Number(stop.position) || 0,
              stop.color,
              0,
              { silent: true },
            );
          });
          gradientPicker.updatePreview();
        }
      }

      setFillType(state.type === 'gradient' ? 'gradient' : 'color', false);
    };

    fillTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        setFillType(tab.dataset.backgroundFillTab);
      });
    });
    colorInput.addEventListener('input', applyBackgroundColor);
    colorInput.addEventListener('change', applyBackgroundColor);
    gradientPicker.on('change', () => {
      if (activeFill === 'gradient') {
        applyBackgroundGradient();
      }
    });
    gradientType.addEventListener('change', () => {
      gradientAngleRow.hidden = gradientType.value === 'radial';
      if (activeFill === 'gradient') {
        applyBackgroundGradient();
      }
    });
    gradientAngle.addEventListener('input', () => {
      if (activeFill === 'gradient') {
        applyBackgroundGradient();
      }
    });
    applyBackgroundColor(false);

    if (_self.trim) {
      const trim = {
        left: Number(_self.trim.left) || 0,
        top: Number(_self.trim.top) || 0,
        right: Number(_self.trim.right) || 0,
        bottom: Number(_self.trim.bottom) || 0,
      };
      const canvasWidth = _self.canvas.originalW;
      const canvasHeight = _self.canvas.originalH;
      const visibleWidth = canvasWidth - trim.left - trim.right;
      const visibleHeight = canvasHeight - trim.top - trim.bottom;

      $(`${this.containerSelector} .main-panel`).append(`
        <div class="toolpanel" id="trim-panel">
          <div class="content">
            <p class="title">${isRussian ? 'Обрезка печати' : 'Print trim'}</p>

            <section class="trim-settings-section">
              <label class="trim-visibility-control">
                <span>
                  <strong>${isRussian ? 'Показывать обрезку' : 'Show print trim'}</strong>
                  <small>${isRussian
                    ? 'Только в редакторе, в файл не попадёт'
                    : 'Editor preview only, never exported'}</small>
                </span>
                <input id="trim-preview-visible" type="checkbox">
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
                <div class="background-section-heading">
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
              <p class="trim-raster-note">
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
      const valuesError = document.querySelector(
        `${this.containerSelector} #trim-values-error`,
      );
      let trimMode = 'zones';
      let trimValuesUnlocked = false;

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

        if (renderInputs) {
          Object.entries(trimInputs).forEach(([side, input]) => {
            input.value = trim[side];
          });
        }

        visibleWidthInput.value = currentVisibleWidth;
        visibleHeightInput.value = currentVisibleHeight;
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
        trimValuesUnlocked = unlocked;
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
        toolbarButton.classList.toggle('preview-enabled', visible);
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
