/**
 * initialize selection setting panel
 */
(function () {
  'use strict';
  const BorderStyleList = [{
    value: {
      strokeDashArray: [],
      strokeLineCap: 'butt'
    },
    label: "Stroke"
  }, {
    value: {
      strokeDashArray: [1, 10],
      strokeLineCap: 'butt'
    },
    label: 'Dash-1'
  }, {
    value: {
      strokeDashArray: [1, 10],
      strokeLineCap: 'round'
    },
    label: 'Dash-2'
  }, {
    value: {
      strokeDashArray: [15, 15],
      strokeLineCap: 'square'
    },
    label: 'Dash-3'
  }, {
    value: {
      strokeDashArray: [15, 15],
      strokeLineCap: 'round'
    },
    label: 'Dash-4'
  }, {
    value: {
      strokeDashArray: [25, 25],
      strokeLineCap: 'square'
    },
    label: 'Dash-5',
  }, {
    value: {
      strokeDashArray: [25, 25],
      strokeLineCap: 'round'
    },
    label: 'Dash-6',
  }, {
    value: {
      strokeDashArray: [1, 8, 16, 8, 1, 20],
      strokeLineCap: 'square'
    },
    label: 'Dash-7',
  }, {
    value: {
      strokeDashArray: [1, 8, 16, 8, 1, 20],
      strokeLineCap: 'round'
    },
    label: 'Dash-8',
  }]
  const AlignmentButtonList = [{
    pos: 'left',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)" stroke-width="1.2346"><rect x="14.815" y="48.16" width="85.185" height="24.691"></rect><rect x="14.815" y="87.025" width="45.679" height="24.691"></rect><rect y="34.877" width="8.642" height="90.123"></rect></g></svg>`
  }, {
    pos: 'center-h',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g stroke-width="1.2346"><rect x="7.4075" y="30.722" width="85.185" height="24.691"></rect><rect x="27.16" y="69.587" width="45.679" height="24.691"></rect><rect x="45.679" y="17.439" width="8.642" height="90.123"></rect></g></svg>`,
  }, {
    pos: 'right',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></svg>`,
  }, {
    pos: 'top',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)"><g transform="matrix(0 -1 -1 0 129.94 129.94)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></g></svg>`,
  }, {
    pos: 'center-v',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g stroke-width="1.2346"><rect transform="rotate(90)" x="19.908" y="-81.779" width="85.185" height="24.691"></rect><rect transform="rotate(90)" x="39.66" y="-42.913" width="45.679" height="24.691"></rect><rect transform="rotate(90)" x="58.179" y="-95.062" width="8.642" height="90.123"></rect></g></svg>`
  }, {
    pos: 'bottom',
    icon: `<svg enable-background="new 0 0 100 100" viewBox="0 0 100 125" xml:space="preserve"><g transform="translate(1.4305e-6 -17.438)"><g transform="rotate(90 50 79.938)" stroke-width="1.2346"><rect transform="scale(-1,1)" x="-85.185" y="48.16" width="85.185" height="24.691"></rect><rect transform="scale(-1,1)" x="-85.185" y="87.025" width="45.679" height="24.691"></rect><rect transform="scale(-1,1)" x="-100" y="34.877" width="8.642" height="90.123"></rect></g></g></svg>`
  }]
  var selectionSettings = function () {
    const _self = this;
   
    $(`${this.containerSelector} .main-panel`).append(`
      <div class="toolpanel" id="select-panel">
        <div class="content">
          <p class="title">
            ${window.lang == 'ru' ? 'Настройки объекта' : 'Selection Settings'}
          </p>
        </div>
      </div>`);

    const rangeNumberControl = (
      id,
      min,
      max,
      step,
      value,
      rangeMin = min,
      rangeMax = max,
    ) => `
      <div class="range-number-control">
        <input type="range" min="${rangeMin}" max="${rangeMax}" step="${step}"
          value="${value}" data-range-for="${id}">
        <input type="number" min="${min}" max="${max}" step="${step}"
          value="${value}" id="${id}">
      </div>
    `;

    const syncRangeControl = input => {
      if (!input?.id) return;

      const range = document.querySelector(
        `${_self.containerSelector} [data-range-for="${input.id}"]`,
      );
      const value = Number(input.value);
      if (!range || !Number.isFinite(value)) return;

      range.value = Math.max(
        Number(range.min),
        Math.min(Number(range.max), value),
      );
    };

    const validNumberInput = (input, value) => (
      Number.isFinite(value)
      && (input.min === '' || value >= Number(input.min))
      && (input.max === '' || value <= Number(input.max))
    );

    const setPanelValue = (selector, value, skippedInput = null) => {
      if (value === undefined || value === null) return;

      $(`${_self.containerSelector} .toolpanel#select-panel ${selector}`)
        .each(function () {
          if (this === skippedInput) return;
          $(this).val(value);
          syncRangeControl(this);
        });
    };

    const isTextObject = object => object?.type === 'i-text';
    const textOrigin = object => (
      object?.textAlign === 'left' || object?.textAlign === 'right'
        ? object.textAlign
        : 'center'
    );
    const objectPosition = object => (
      isTextObject(object)
        ? object.getPointByOrigin(textOrigin(object), 'center')
        : object.getCenterPoint()
    );

    const normalizeTextScale = object => {
      if (!isTextObject(object)) return false;

      const scaleX = Math.abs(Number(object.scaleX) || 1);
      const scaleY = Math.abs(Number(object.scaleY) || 1);
      const factor = (scaleX + scaleY) / 2;
      const position = objectPosition(object);
      const changed = Math.abs(factor - 1) > 0.0005;

      object.set({
        fontSize: Math.max(4, Math.min(2000, Math.round(
          (Number(object.fontSize) || 40) * factor,
        ))),
        scaleX: 1,
        scaleY: 1,
        strokeUniform: true,
        styles: {},
      });
      _self.refreshTextDimensions(object);
      object.setPositionByOrigin(position, textOrigin(object), 'center');
      object.setCoords();
      return changed;
    };
    this.normalizeTextScale = normalizeTextScale;

    const syncGeometryValues = (object, editedInput = null) => {
      if (!object) return;

      const setGeometryValue = (property, value) => {
        setPanelValue(
          `[data-geometry="${property}"]`,
          value,
          editedInput,
        );
      };
      const position = objectPosition(object);
      const width = Math.round(object.getScaledWidth());
      const height = Math.round(object.getScaledHeight());
      const scaleX = Number.isFinite(object.scaleX) ? object.scaleX : 1;
      const scaleY = Number.isFinite(object.scaleY) ? object.scaleY : 1;
      const roundedScaleX = Math.round(scaleX * 1000) / 1000;
      const roundedScaleY = Math.round(scaleY * 1000) / 1000;

      setGeometryValue('x', Math.round(position.x));
      setGeometryValue('y', Math.round(position.y));
      setGeometryValue('width', width);
      setGeometryValue('height', height);
      setGeometryValue('scaleX', roundedScaleX);
      setGeometryValue('scaleY', roundedScaleY);
      setGeometryValue('angle', Math.round((object.angle || 0) * 1000) / 1000);
      setGeometryValue('skewX', Math.round((object.skewX || 0) * 1000) / 1000);
      setGeometryValue('skewY', Math.round((object.skewY || 0) * 1000) / 1000);

      const sizeSummary = document.querySelector(
        `${_self.containerSelector} .geometry-size-summary`,
      );
      if (sizeSummary) {
        sizeSummary.textContent = `${window.lang == 'ru' ? 'Итоговый размер' : 'Final size'}: ${width} × ${height} px`;
      }

      $(`${_self.containerSelector} .toolpanel#select-panel [data-geometry="angle"]`)
        .prop('disabled', object.lockRotation === true);
    };

    // font section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="text-section">

          <h4>
            ${window.lang == 'ru' ? 'Стиль шрифта' : 'Font Style'}
          </h4>
          <div class="style">
            <button id="bold"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><path d="M218.133,144.853c20.587-14.4,35.2-37.653,35.2-59.52C253.333,37.227,216.107,0,168,0H34.667v298.667h150.187 c44.693,0,79.147-36.267,79.147-80.853C264,185.387,245.547,157.76,218.133,144.853z M98.667,53.333h64c17.707,0,32,14.293,32,32 s-14.293,32-32,32h-64V53.333z M173.333,245.333H98.667v-64h74.667c17.707,0,32,14.293,32,32S191.04,245.333,173.333,245.333z"></path></svg></button>
            <button id="italic"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><polygon points="106.667,0 106.667,64 153.92,64 80.747,234.667 21.333,234.667 21.333,298.667 192,298.667 192,234.667 144.747,234.667 217.92,64 277.333,64 277.333,0  "></polygon></svg></button>
            <button id="underline"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><path d="M192,298.667c70.72,0,128-57.28,128-128V0h-53.333v170.667c0,41.28-33.387,74.667-74.667,74.667 s-74.667-33.387-74.667-74.667V0H64v170.667C64,241.387,121.28,298.667,192,298.667z"></path><rect x="42.667" y="341.333" width="298.667" height="42.667"></rect></svg></button>
            <button id="linethrough"><svg id="Capa_1" x="0px" y="0px" viewBox="-70 -70 450 450" xml:space="preserve"><polygon points="149.333,160 234.667,160 234.667,96 341.333,96 341.333,32 42.667,32 42.667,96 149.333,96"></polygon><rect x="149.333" y="288" width="85.333" height="64"></rect><rect x="0" y="202.667" width="384" height="42.667"></rect></svg></button>
          </div>

          <div class="family">
            <div class="input-container">
              <label>
                ${window.lang == 'ru' ? 'Шрифт' : 'Font Family'}
              </label>
              <select id="font-family">
                <option value="">
                  ${window.lang == 'ru' ? 'Выберите шрифт' : 'Select Font'}
                </option>

                <optgroup id="local-font-options" label="${window.lang == 'ru' ? 'Шрифты шаблона' : 'Template fonts'}"></optgroup>

                <optgroup id="online-font-options" label="${window.lang == 'ru' ? 'Онлайн-шрифты' : 'Online fonts'}">
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Inter">Inter</option>
                <option value="Roboto Condensed">Roboto Condensed</option>
                <option value="Oswald">Oswald</option>
                <option value="Noto Sans">Noto Sans</option>
                <option value="Raleway">Raleway</option>
                <option value="Nunito Sans">Nunito Sans</option>
                <option value="Nunito">Nunito</option>
                
                <!-- Топ serif шрифты -->
                <option value="Playfair Display">Playfair Display</option>
                <option value="Roboto Slab" data-google-font-path="apache/robotoslab">Roboto Slab</option>
                <option value="Merriweather">Merriweather</option>
                <option value="Lora">Lora</option>
                
                <!-- Стильные/декоративные -->
                <option value="Pacifico">Pacifico</option>
                <option value="Lobster">Lobster</option>
                <option value="Rubik Vinyl">Rubik Vinyl</option>
                </optgroup>

              </select>
            </div>
            <button class="local-font-upload" id="local-font-upload" type="button">
              ${window.lang == 'ru' ? 'Загрузить файл шрифта' : 'Upload font file'}
            </button>
          </div>
          
          <div class="color">
            <div class="input-container">
              <label>
                  ${window.lang == 'ru' ? 'Цвет текста' : 'Text Color'}
              </label>
              <input id="color-picker" value="black">
            </div>
          </div>

          <div class="sizes">

            <div class="input-container">
              <label>
                ${window.lang == 'ru' ? 'Размер шрифта' : 'Font Size'}
              </label>
              ${rangeNumberControl('fontSize', 4, 2000, 1, 20, 4, 500)}
            </div>

            <div class="input-container">
              <label>
                ${window.lang == 'ru' ? 'Насыщенность' : 'Font Weight'}
              </label>
              ${rangeNumberControl('fontWeight', 100, 900, 10, 400)}
            </div>

            <div class="input-container">
              <label>
                ${window.lang == 'ru' ? 'Высота строки' : 'Line Height'}
              </label>
              ${rangeNumberControl('lineHeight', 0.5, 4, 0.05, 1.2)}
            </div>

            <div class="input-container">
              <label>
                ${window.lang == 'ru' ? 'Отступы символов' : 'Letter Spacing'}
              </label>
              ${rangeNumberControl('charSpacing', -2000, 2000, 10, 0)}
            </div>

            <div class="input-container">
              <label>
                ${window.lang == 'ru' ? 'Обводка снаружи' : 'Outside Outline'}
              </label>
              ${rangeNumberControl('textStrokeWidth', 0, 500, 1, 0, 0, 100)}
            </div>

          </div>

          <div class="color text-stroke-color">
            <div class="input-container">
              <label>
                ${window.lang == 'ru' ? 'Цвет обводки' : 'Outline Color'}
              </label>
              <input id="text-stroke-color-picker" value="#000000">
            </div>
          </div>

          <div class="align">
            <div class="input-container">
            <label>
              ${window.lang == 'ru' ? 'Положение текста' : 'Text Alignment'}
            </label>
            <select id="text-align">
              <option value="left">
                ${window.lang == 'ru' ? 'Слева' : 'Left'}
              </option>
              <option value="center">
                ${window.lang == 'ru' ? 'По центру' : 'Center'}
              </option>
              <option value="right">
                ${window.lang == 'ru' ? 'Справа' : 'Right'}
              </option>
            </select>
            </div>
          </div>

          <hr>
        </div>
      `);

      $(`${this.containerSelector} .toolpanel#select-panel .style button`).click(function () {
        let type = $(this).attr('id');
        switch (type) {
          case 'bold':
            const currentWeight = _self.getActiveFontStyle(_self.activeSelection, 'fontWeight');
            _self.setActiveFontStyle(
              _self.activeSelection,
              'fontWeight',
              currentWeight === 'bold' || Number(currentWeight) >= 600 ? 400 : 700,
            )
            break;
          case 'italic':
            if (_self.toggleTextItalic) {
              _self.toggleTextItalic(_self.activeSelection);
              return;
            }
            _self.setActiveFontStyle(_self.activeSelection, 'fontStyle', _self.getActiveFontStyle(_self.activeSelection, 'fontStyle') === 'italic' ? 'normal' : 'italic')
            break;
          case 'underline':
            _self.setActiveFontStyle(_self.activeSelection, 'underline', !_self.getActiveFontStyle(_self.activeSelection, 'underline'))
            break;
          case 'linethrough':
            _self.setActiveFontStyle(_self.activeSelection, 'linethrough', !_self.getActiveFontStyle(_self.activeSelection, 'linethrough'))
            break;
          default:
            break;
        }
        _self.setSelectionValues();
        _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed');
      })


      $(`${this.containerSelector} .toolpanel#select-panel .sizes #fontSize, ${this.containerSelector} .toolpanel#select-panel .sizes #fontWeight`).on('input change', function (event) {
        const value = parseFloat($(this).val());
        const type = $(this).attr('id');

        if (!validNumberInput(this, value) || !_self.activeSelection) {
          if (event.type === 'change') {
            _self.setSelectionValues();
          }
          return;
        }
        syncRangeControl(this);
        _self.setActiveFontStyle(_self.activeSelection, type, value);
        syncGeometryValues(_self.activeSelection);
        _self.canvas.renderAll();
        if (event.type === 'change') {
          _self.canvas.fire('object:property-realy-changed');
        }
      });

      $(`${this.containerSelector} .toolpanel#select-panel .sizes #lineHeight, ${this.containerSelector} .toolpanel#select-panel .sizes #charSpacing`).on('input change', function (event) {
        let value = parseFloat($(this).val());
        let type = $(this).attr('id');

        if (!validNumberInput(this, value) || !_self.activeSelection) {
          if (event.type === 'change') {
            _self.setSelectionValues();
          }
          return;
        }
        syncRangeControl(this);
        const currentValue = _self.activeSelection[type];
        if (value !== currentValue) {
          _self.setActiveFontStyle(_self.activeSelection, type, value);
          syncGeometryValues(_self.activeSelection);
          _self.canvas.renderAll();
        }
        if (event.type === 'change') {
          _self.canvas.fire('object:property-realy-changed');
        }
      })

      $(`${this.containerSelector} .toolpanel#select-panel [data-range-for]`)
        .on('input change', function (event) {
          const numberInput = document.querySelector(
            `${_self.containerSelector} #${this.dataset.rangeFor}`,
          );
          if (!numberInput) return;

          numberInput.value = this.value;
          $(numberInput).trigger(event.type);
        });

      $(`${this.containerSelector} .toolpanel#select-panel .align #text-align`).change(function () {
        const object = _self.activeSelection;
        const mode = $(this).val();
        if (!isTextObject(object)) return;

        const position = objectPosition(object);
        object.set({
          textAlign: mode,
          originX: mode,
          styles: {},
        });
        _self.refreshTextDimensions(object);
        object.setPositionByOrigin(position, mode, 'center');
        syncGeometryValues(object);
        _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed');
      })
      
      // Font family change handler
      $(`${this.containerSelector} .toolpanel#select-panel .family #font-family`).change(function() {
        const fontFamily = $(this).val();
        const object = _self.activeSelection;
        if (!fontFamily || !object) return;

        const fontAsset = _self.getFontAsset?.(fontFamily, object.fontStyle)
          || (!_self.isOnlineFontFamily?.(fontFamily)
            ? _self.getFontAsset?.(fontFamily, 'normal')
            : null);
        if (fontAsset) {
          _self.applyTextFontAsset(object, fontAsset);
          syncGeometryValues(object);
          _self.canvas.renderAll();
          _self.canvas.fire('object:property-realy-changed');
          return;
        }

        const $select = $(this);
        $select.prop('disabled', true);

        _self.cacheOnlineFont(
          fontFamily,
          object.fontStyle,
          object.fontWeight,
        ).then(asset => {
          if (!_self.canvas.contains(object)) return;

          _self.applyTextFontAsset(object, asset);
          _self.canvas.fire('object:property-realy-changed');

          if (_self.activeSelection === object) {
            _self.setSelectionValues();
          }
        }).catch(error => {
          console.warn('Could not load font:', fontFamily, error);
          if (_self.activeSelection === object) {
            $select.val(object.fontFamily || '');
          }
          _self.toast(
            window.lang == 'ru'
              ? 'Шрифт не загрузился — используйте локальный TTF/OTF'
              : 'Font could not load — use a local TTF/OTF',
            'Danger',
            3500,
          );
        }).finally(() => {
          $select.prop('disabled', false);
        });
      });

      $(`${this.containerSelector} .toolpanel#select-panel #local-font-upload`).click(() => {
        if (_self.chooseLocalFont) {
          _self.chooseLocalFont();
        }
      });

      $(`${this.containerSelector} .toolpanel#select-panel .color #color-picker`).spectrum({
        type: "color",
        showInput: "true",
        allowEmpty: "false"
      });

      $(`${this.containerSelector} .toolpanel#select-panel .color #color-picker`).change(function () {
        let color = $(this).val();
        _self.setActiveFontStyle(_self.activeSelection, 'fill', color)
        _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed');
      })

      $(`${this.containerSelector} .toolpanel#select-panel #text-stroke-color-picker`).spectrum({
        type: "color",
        showInput: "true",
        allowEmpty: "false"
      });

      $(`${this.containerSelector} .toolpanel#select-panel #text-stroke-color-picker`).change(function () {
        if (!_self.activeSelection) return;
        _self.setActiveFontStyle(_self.activeSelection, 'stroke', $(this).val());
        _self.activeSelection.set('paintFirst', 'stroke');
        _self.canvas.renderAll();
        _self.canvas.fire('object:property-realy-changed');
      });

      $(`${this.containerSelector} .toolpanel#select-panel #textStrokeWidth`).on('input change', function (event) {
        const value = parseFloat($(this).val());
        if (!validNumberInput(this, value) || !_self.activeSelection) {
          if (event.type === 'change') {
            _self.setSelectionValues();
          }
          return;
        }
        syncRangeControl(this);
        // Canvas strokes are centered on the glyph edge. Drawing a doubled
        // stroke first and the fill second makes `value` the visible outside
        // width, matching Pillow's photobooth renderer.
        if (!_self.activeSelection.stroke) {
          _self.setActiveFontStyle(_self.activeSelection, 'stroke', '#000000');
        }
        _self.setActiveFontStyle(_self.activeSelection, 'strokeWidth', value * 2);
        _self.activeSelection.set('paintFirst', 'stroke');
        _self.activeSelection.setCoords();
        syncGeometryValues(_self.activeSelection);
        _self.canvas.renderAll();
        if (event.type === 'change') {
          _self.canvas.fire('object:property-realy-changed');
        }
      });
    })();
    // end font section

    // Shared geometry for every selectable canvas object.
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content > .title`).after(`
        <div class="geometry-section">
          <h4>${window.lang == 'ru' ? 'Положение и размер' : 'Position and size'}</h4>
          <p class="section-hint geometry-hint">
            ${window.lang == 'ru' ? 'X и Y задают центр объекта.' : 'X and Y use the object center.'}
          </p>
          <div class="geometry-grid">
            <label><span>X</span><input type="number" step="1" data-geometry="x"></label>
            <label><span>Y</span><input type="number" step="1" data-geometry="y"></label>
            <label class="geometry-size-field"><span>${window.lang == 'ru' ? 'Ширина' : 'Width'}</span><input type="number" min="1" step="1" data-geometry="width"></label>
            <label class="geometry-size-field"><span>${window.lang == 'ru' ? 'Высота' : 'Height'}</span><input type="number" min="1" step="1" data-geometry="height"></label>
            <label class="geometry-axis-scale"><span>${window.lang == 'ru' ? 'Масштаб X' : 'Scale X'}</span><input type="number" min="0.01" max="100" step="0.01" data-geometry="scaleX"></label>
            <label class="geometry-axis-scale"><span>${window.lang == 'ru' ? 'Масштаб Y' : 'Scale Y'}</span><input type="number" min="0.01" max="100" step="0.01" data-geometry="scaleY"></label>
            <p class="geometry-size-summary"></p>
            <label><span>${window.lang == 'ru' ? 'Наклон X, °' : 'Skew X, °'}</span><input type="number" min="-89" max="89" step="1" data-geometry="skewX"></label>
            <label><span>${window.lang == 'ru' ? 'Наклон Y, °' : 'Skew Y, °'}</span><input type="number" min="-89" max="89" step="1" data-geometry="skewY"></label>
            <label class="geometry-angle"><span>${window.lang == 'ru' ? 'Поворот, °' : 'Rotation, °'}</span><input type="number" step="1" data-geometry="angle"></label>
          </div>
          <hr>
        </div>
      `);

      const updateGeometry = (input, preserveInput = false) => {
        const object = _self.activeSelection;
        const property = input.dataset.geometry;
        const value = Number(input.value);

        if (!object || !validNumberInput(input, value)) return false;

        if (property === 'x' || property === 'y') {
          const position = objectPosition(object);
          const origin = isTextObject(object) ? textOrigin(object) : 'center';
          object.setPositionByOrigin(new fabric.Point(
            property === 'x' ? value : position.x,
            property === 'y' ? value : position.y,
          ), origin, 'center');
        } else if (property === 'width' || property === 'height') {
          if (value <= 0) return false;
          const current = property === 'width'
            ? object.getScaledWidth()
            : object.getScaledHeight();
          if (!Number.isFinite(current) || current <= 0) return false;
          const scaleProperty = property === 'width' ? 'scaleX' : 'scaleY';
          object.set(scaleProperty, object[scaleProperty] * value / current);
        } else if (property === 'scaleX' || property === 'scaleY') {
          if (value <= 0) return false;
          const center = object.getCenterPoint();
          object.set(property, value);
          object.setPositionByOrigin(center, 'center', 'center');
        } else if (property === 'angle' || property === 'skewX' || property === 'skewY') {
          const position = objectPosition(object);
          const origin = isTextObject(object) ? textOrigin(object) : 'center';
          object.set(property, value);
          object.setPositionByOrigin(position, origin, 'center');
        }

        if (typeof _self.syncPhotoSymmetry === 'function') {
          _self.syncPhotoSymmetry(object);
        }
        object.setCoords();
        _self.canvas.requestRenderAll();
        syncGeometryValues(object, preserveInput ? input : null);
        return true;
      };

      $(`${this.containerSelector} .toolpanel#select-panel [data-geometry]`)
        .on('input', function () {
          if (this.value !== '') updateGeometry(this, true);
        })
        .on('change', function () {
          if (updateGeometry(this)) {
            _self.canvas.fire('object:property-realy-changed');
          } else {
            _self.setSelectionValues();
          }
        });
    })();

    // fill color section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="fill-section">
          <div class="tab-container">
            <div class="input-container">
              <label>
                <h4>Fill</h4>
              </label>
              <label>
                <div class="tabs">
                  <div class="tab-label" data-value="color-fill">
                    <button type="">Color</button>
                  </div>
                  <div class="tab-label" data-value="gradient-fill">
                    <button type="">Gradient</button>
                  </div>
                </div>
              </label>
            </div>
            <div class="tab-content" data-value="color-fill">
              <div class="input-container"><label>Color</label><input id="color-picker" value="${_self.activeSelection ? _self.activeSelection.fill : '#000000'}"></div>
            </div>
            <div class="tab-content" data-value="gradient-fill">
              <div id="gradient-picker"></div>
              <div class="gradient-orientation-container">
                <div class="input-container">
                  <label>Orientation</label>
                  <select id="select-orientation">
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
                <div id="angle-input-container" class="input-container">
                  <label>Angle</label>
                  <div class="custom-number-input">
                    <button class="decrease">-</button>
                    <input type="number" min="0" max="360" value="0" id="input-angle">
                    <button class="increase">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <hr>
        </div>
      `);

      $(`${this.containerSelector} .toolpanel#select-panel .content .tab-label`).click(function () {
        $(`${_self.containerSelector} .toolpanel#select-panel .content .tab-label`).removeClass('active');
        $(this).addClass('active');
        let target = $(this).data('value');
        $(this).closest('.tab-container').find('.tab-content').hide();
        $(this).closest('.tab-container').find(`.tab-content[data-value=${target}]`).show();
        if (target === 'color-fill') {
          let color = $(`${_self.containerSelector} .toolpanel#select-panel .fill-section #color-picker`).val();
          try {
            _self.canvas.getActiveObjects().forEach(obj => obj.set('fill', color))
            _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed')
          } catch (_) {
            console.log("can't update background color")
          }
        } else {
          updateGradientFill();
        }
      })

      $(`${_self.containerSelector} .toolpanel#select-panel .content .tab-label[data-value=color-fill]`).click();

      $(`${this.containerSelector} .toolpanel#select-panel .fill-section #color-picker`).spectrum({
        // flat: true,
        // showPalette: false,
        showButtons: false,
        type: "color",
        showInput: "true",
        allowEmpty: "false",
        move: function (color) {
          let hex = 'transparent';
          color && (hex = color.toRgbString()); // #ff0000
          _self.canvas.getActiveObjects().forEach(obj => obj.set('fill', hex))
          _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed')
        }
      });

      // Listen for changes to the input value and update the color picker
      $(`${this.containerSelector} .toolpanel#select-panel .fill-section #color-picker`).change(function () {
        const newColor = $(this).val(); // Get the new color value from the input
        $(this).spectrum('option', 'color', newColor); // Update the color picker's color option
      });

      const gp = new Grapick({
        el: `${this.containerSelector} .toolpanel#select-panel .fill-section #gradient-picker`,
        colorEl: '<input id="colorpicker"/>'
      });

      gp.setColorPicker(handler => {
        const el = handler.getEl().querySelector('#colorpicker');
        $(el).spectrum({
          showPalette: true,
          showButtons: false,
          type: "color",
          color: handler.getColor(),
          showAlpha: true,
          change(color) {
            handler.setColor(color.toRgbString());
          },
          move(color) {
            handler.setColor(color.toRgbString(), 0);
          }
        });
      });
      gp.addHandler(0, 'red');
      gp.addHandler(100, 'blue');



      const updateGradientFill = () => {

        let stops = gp.getHandlers();
        let orientation = $(`${this.containerSelector} .toolpanel#select-panel .content .gradient-orientation-container #select-orientation`).val();
        let angle = parseInt($(`${this.containerSelector} .toolpanel#select-panel .content .gradient-orientation-container #input-angle`).val());

        let gradient = _self.generateFabricGradientFromColorStops(stops, _self.activeSelection.width, _self.activeSelection.height, orientation, angle);
        _self.activeSelection.set('fill', gradient);
        _self.canvas.renderAll()
      }

      gp.on('change', complete => {
        updateGradientFill();
      })

      $(`${this.containerSelector} .toolpanel#select-panel .content .gradient-orientation-container #select-orientation`).change(function () {
        let type = $(this).val();
        console.log('orientation', type)
        if (type === 'radial') {
          $(this).closest('.gradient-orientation-container').find('#angle-input-container').hide();
        } else {
          $(this).closest('.gradient-orientation-container').find('#angle-input-container').show();
        }
        updateGradientFill();
      })

      $(`${this.containerSelector} .toolpanel#select-panel .content .gradient-orientation-container #input-angle`).change(function () {
        updateGradientFill();
      })

    })();
    // end fill color section

    // // border section
    // (() => {
    //   $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
    //     <div class="border-section">
    //       <h4>Border</h4>
    //       <div class="input-container"><label>Width</label>
    //         <div class="custom-number-input">
    //         <button class="decrease">-</button>
    //         <input type="number" min="0" value="0" id="input-border-width">
    //         <button class="increase">+</button>
    //         </div>
    //       </div>
    //       <div class="input-container"><label>Style</label><select id="input-border-style">${BorderStyleList.map(item => `<option value='${JSON.stringify(item.value)}'>${item.label}</option>`)}</select></div>
    //       <div class="input-container"><label>Corner Type</label><select id="input-corner-type"><option value="miter" selected>Square</option><option value="round">Round</option><option value="circle">Circle</option></select></div>
    //       <div class="input-container"><label>Color</label><input id="color-picker" value="black"></div>
    //       <hr>
    //     </div>
    //   `);

    //   $(`${this.containerSelector} .toolpanel#select-panel .border-section #color-picker`).spectrum({
    //     showButtons: false,
    //     type: "color",
    //     showInput: "true",
    //     allowEmpty: "false",
    //     move: function (color) {
    //       let hex = 'transparent';
    //       color && (hex = color.toRgbString()); // #ff0000
    //       _self.canvas.getActiveObjects().forEach(obj => obj.set('stroke', hex))
    //       _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed')
    //     }
    //   });
    //   // Listen for changes to the input value and update the color picker
    //   $(`${this.containerSelector} .toolpanel#select-panel .border-section #color-picker`).change(function () {
    //     const newColor = $(this).val(); // Get the new color value from the input
    //     $(this).spectrum('option', 'color', newColor); // Update the color picker's color option
    //   });

    //   $(`${this.containerSelector} .toolpanel#select-panel .border-section #input-border-width`).change(function () {
    //     let width = parseInt($(this).val());
    //     _self.canvas.getActiveObjects().forEach(obj => obj.set({
    //       strokeUniform: true,
    //       strokeWidth: width
    //     }))
    //     _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed')
    //   })

    //   $(`${this.containerSelector} .toolpanel#select-panel .border-section #input-border-style`).change(function () {
    //     try {
    //       let style = JSON.parse($(this).val());
    //       _self.canvas.getActiveObjects().forEach(obj => obj.set({
    //         strokeUniform: true,
    //         strokeDashArray: style.strokeDashArray,
    //         strokeLineCap: style.strokeLineCap
    //       }))
    //       _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed')
    //     } catch (_) { }
    //   })

    //   $(`${this.containerSelector} .toolpanel#select-panel .border-section #input-corner-type`).change(function () {
    //     let corner = $(this).val();
    //     _self.canvas.getActiveObjects().forEach(obj => obj.set('strokeLineJoin', corner))
    //     _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed')
    //   })
    // })();
    // // end border section



    // // alignment section
    // (() => {
    //   let buttons = ``;
    //   AlignmentButtonList.forEach(item => {
    //     buttons += `<button data-pos="${item.pos}">${item.icon}</button>`
    //   })
    //   $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
    //     <div class="alignment-section">
    //       <h4>Alignment</h4>
    //       ${buttons}
    //       <hr>
    //     </div>
    //   `);

    //   $(`${this.containerSelector} .toolpanel#select-panel .alignment-section button`).click(function () {
    //     let pos = $(this).data('pos');
    //     _self.alignObject(_self.canvas, _self.activeSelection, pos);
    //   })
    // })();
    // // end alignment section

    // object options section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="object-options">
          <h4>
            ${window.lang == 'ru' ? 'Свойства объекта' : 'Object Options'}
          </h4>
          <div class="object-option-actions">
          <button id="flip-h"><svg width="512" height="512" enable-background="new 0 0 16 16" viewBox="0 0 16 20" xml:space="preserve"><g transform="matrix(0 1.5365 1.5385 0 -5.0769 1.5495)"><rect x="5" y="8" width="1" height="1"></rect><rect x="7" y="8" width="1" height="1"></rect><rect x="9" y="8" width="1" height="1"></rect><rect x="1" y="8" width="1" height="1"></rect><rect x="3" y="8" width="1" height="1"></rect><path d="M 1,2 5.5,6 10,2 Z M 7.37,3 5.5,4.662 3.63,3 Z"></path><polygon points="10 15 5.5 11 1 15"></polygon></g></svg></button>
          <button id="flip-v"><svg width="512" height="512" enable-background="new 0 0 16 16" viewBox="0 0 16 20" xml:space="preserve"><g transform="matrix(1.5365 0 0 1.5385 -.45052 -3.0769)"><rect x="5" y="8" width="1" height="1"></rect><rect x="7" y="8" width="1" height="1"></rect><rect x="9" y="8" width="1" height="1"></rect><rect x="1" y="8" width="1" height="1"></rect><rect x="3" y="8" width="1" height="1"></rect><path d="M 1,2 5.5,6 10,2 Z M 7.37,3 5.5,4.662 3.63,3 Z"></path><polygon points="5.5 11 1 15 10 15"></polygon></g></svg></button>
          <button id="bring-fwd"><svg x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve"><g><path d="M10,10h686v686H10V10 M990,304v686H304V794h98v98h490V402h-98v-98H990z"></path></g></svg></button>
          <button id="bring-back"><svg enable-background="new 0 0 1000 1000" viewBox="0 0 1e3 1e3" xml:space="preserve"><path d="m990 990h-686v-686h686v686m-980-294v-686h686v680h-98v-582h-490v490h200v98z"></path><rect x="108.44" y="108" width="490" height="490" fill="#fff"></rect></svg></button>
          <button id="duplicate"><svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><g><path d="M42.667,256c0-59.52,35.093-110.827,85.547-134.827V75.2C53.653,101.44,0,172.48,0,256s53.653,154.56,128.213,180.8 v-45.973C77.76,366.827,42.667,315.52,42.667,256z"></path><path d="M320,64c-105.92,0-192,86.08-192,192s86.08,192,192,192s192-86.08,192-192S425.92,64,320,64z M320,405.333 c-82.347,0-149.333-66.987-149.333-149.333S237.653,106.667,320,106.667S469.333,173.653,469.333,256 S402.347,405.333,320,405.333z"></path><polygon points="341.333,170.667 298.667,170.667 298.667,234.667 234.667,234.667 234.667,277.333 298.667,277.333 298.667,341.333 341.333,341.333 341.333,277.333 405.333,277.333 405.333,234.667 341.333,234.667  "></polygon></g></g></g></svg></button>
          <button id="delete"><svg id="Layer_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path d="M425.298,51.358h-91.455V16.696c0-9.22-7.475-16.696-16.696-16.696H194.855c-9.22,0-16.696,7.475-16.696,16.696v34.662 H86.704c-9.22,0-16.696,7.475-16.696,16.696v51.357c0,9.22,7.475,16.696,16.696,16.696h5.072l15.26,359.906 c0.378,8.937,7.735,15.988,16.68,15.988h264.568c8.946,0,16.302-7.051,16.68-15.989l15.259-359.906h5.073 c9.22,0,16.696-7.475,16.696-16.696V68.054C441.994,58.832,434.519,51.358,425.298,51.358z M211.551,33.391h88.9v17.967h-88.9 V33.391z M372.283,478.609H139.719l-14.522-342.502h261.606L372.283,478.609z M408.602,102.715c-15.17,0-296.114,0-305.202,0 V84.749h305.202V102.715z"></path></g></g><g><g><path d="M188.835,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C205.53,194.779,198.055,187.304,188.835,187.304z"></path></g></g><g><g><path d="M255.998,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.474,16.696,16.696,16.696 c9.22,0,16.696-7.475,16.696-16.696V204C272.693,194.779,265.218,187.304,255.998,187.304z"></path></g></g><g><g><path d="M323.161,187.304c-9.22,0-16.696,7.475-16.696,16.696v206.714c0,9.22,7.475,16.696,16.696,16.696 s16.696-7.475,16.696-16.696V204C339.857,194.779,332.382,187.304,323.161,187.304z"></path></g></g></svg></button>
          </div>
          <hr>
        </div>
      `);
      // <button id="group"><svg width="248" height="249" viewBox="0 0 248 249"><g><rect fill="none" id="canvas_background" height="251" width="250" y="-1" x="-1"></rect><g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid"><rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"></rect></g></g><g><rect id="svg_1" height="213.999997" width="213.999997" y="18.040149" x="16.8611" stroke-width="14" stroke="#000" fill="none"></rect><ellipse ry="39.5" rx="39.5" id="svg_2" cy="87.605177" cx="90.239139" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></ellipse><rect id="svg_3" height="61.636373" width="61.636373" y="135.606293" x="133.750604" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></rect><rect id="svg_4" height="26.016205" width="26.016205" y="4.813006" x="3.999997" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_5" height="26.016205" width="26.016205" y="3.999999" x="217.820703" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_7" height="26.016205" width="26.016205" y="218.633712" x="3.999997" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect><rect id="svg_8" height="26.016205" width="26.016205" y="218.633712" x="217.820694" stroke-opacity="null" stroke-width="8" stroke="#000" fill="#000000"></rect></g></svg></button>
      // <button id="ungroup"><svg width="247.99999999999997" height="248.99999999999997" viewBox="0 0 248 249"><g><rect fill="none" id="canvas_background" height="251" width="250" y="-1" x="-1"></rect><g display="none" overflow="visible" y="0" x="0" height="100%" width="100%" id="canvasGrid"><rect fill="url(#gridpattern)" stroke-width="0" y="0" x="0" height="100%" width="100%"></rect></g></g><g><rect stroke-dasharray="20" id="svg_1" height="213.999997" width="213.999997" y="18.040149" x="16.8611" stroke-width="16" stroke="#000" fill="none"></rect><ellipse ry="39.5" rx="39.5" id="svg_2" cy="87.605177" cx="90.239139" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></ellipse><rect id="svg_3" height="61.636373" width="61.636373" y="135.606293" x="133.750604" stroke-opacity="null" stroke-width="5" stroke="#000" fill="#000000"></rect></g></svg></button>
          

      $(`${this.containerSelector} .toolpanel#select-panel .object-options #flip-h`).click(() => {
        this.activeSelection.set('flipX', !this.activeSelection.flipX);
        this.canvas.renderAll(), this.canvas.fire('object:property-realy-changed');
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #flip-v`).click(() => {
        this.activeSelection.set('flipY', !this.activeSelection.flipY);
        this.canvas.renderAll(), this.canvas.fire('object:property-realy-changed');
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #bring-fwd`).click(() => {
        if (this.moveObjectLayer) {
          this.moveObjectLayer(this.activeSelection, 'forward')
        } else {
          this.canvas.bringForward(this.activeSelection)
        }
        this.canvas.renderAll(), this.canvas.fire('object:property-realy-changed');
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #bring-back`).click(() => {
        if (this.moveObjectLayer) {
          this.moveObjectLayer(this.activeSelection, 'backward')
        } else {
          this.canvas.sendBackwards(this.activeSelection)
        }
        this.canvas.renderAll(), this.canvas.fire('object:property-realy-changed');
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #duplicate`).click(() => {
        this.duplicateActiveObjects?.();
      })
      $(`${this.containerSelector} .toolpanel#select-panel .object-options #delete`).click(() => {
        this.deleteActiveObjects();
      })
      // $(`${this.containerSelector} .toolpanel#select-panel .object-options #group`).click(() => {
      //   if (this.activeSelection.type !== 'activeSelection') return;
      //   this.canvas.getActiveObject().toGroup()
      //   this.canvas.requestRenderAll(), this.canvas.fire('object:property-realy-changed')
      // })
      // $(`${this.containerSelector} .toolpanel#select-panel .object-options #ungroup`).click(() => {
      //   if (this.activeSelection.type !== 'group') return;
      //   this.canvas.getActiveObject().toActiveSelection()
      //   this.canvas.requestRenderAll(), this.canvas.fire('object:property-realy-changed');
      // })
    })();
    // end object options section

    // effect section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="effect-section">
        
          <div class="input-container">
            <label>
              ${window.lang == 'ru' ? 'Прозрачность' : 'Opacity'}
            </label>
            <input id="opacity" type="range" min="0" max="1" value="1" step="0.01">
          </div>

          <div class="input-container">
            <label>
              ${window.lang == 'ru' ? 'Закругление' : 'Corner Radius'}
            </label>
            <input id="corner-radius" type="range" min="0" max="300" value="0">
          </div>
          
          <hr>
        </div>
      `);
      // <h4>Effect</h4>
      // <div class="input-container"><label>Blur</label><input class="effect" id="blur" type="range" min="0" max="100" value="50"></div>
      // <div class="input-container"><label>Brightness</label><input class="effect" id="brightness" type="range" min="0" max="100" value="50"></div>
      // <div class="input-container"><label>Saturation</label><input class="effect" id="saturation" type="range" min="0" max="100" value="50"></div>
      // <h5>Gamma</h5>
      // <div class="input-container"><label>Red</label><input class="effect" id="gamma.r" type="range" min="0" max="100" value="50"></div>
      // <div class="input-container"><label>Green</label><input class="effect" id="gamma.g" type="range" min="0" max="100" value="50"></div>
      // <div class="input-container"><label>Blue</label><input class="effect" id="gamma.b" type="range" min="0" max="100" value="50"></div>
      
      
      // Opcaity
      $(`${this.containerSelector} .toolpanel#select-panel .effect-section #opacity`)
        .on('input', function() { // Обновление в реальном времени
          let opacity = parseFloat($(this).val());
          _self.activeSelection.set('opacity', opacity);
          _self.canvas.renderAll();
        })
        .on('change', function() { // Сохранение в историю при отпускании
          _self.canvas.fire('object:property-realy-changed');
        });

      // Corner Raius
      $(`${this.containerSelector} .toolpanel#select-panel .effect-section #corner-radius`)
        .on('input', function() { // Обновление в реальном времени
          let radius = parseInt($(this).val());

          if (_self.activeSelection && _self.activeSelection.type === 'image') {
            
            const width = _self.activeSelection.width;
            const height = _self.activeSelection.height;
            const maxRadius = Math.sqrt(width * width + height * height) / 2;
            const scaledRadius = Math.pow(radius / 300, 2) * maxRadius;

            
            if (radius === 0) {
              _self.activeSelection.set('clipPath', null);
            } else {
              _self.activeSelection.set({
                clipPath: new fabric.Rect({
                  width: width,
                  height: height,
                  rx: scaledRadius,
                  ry: scaledRadius,
                  originX: 'center',
                  originY: 'center'
                }),
                dirty: true
              });
            }
            
            _self.canvas.renderAll();
          }
        })
        .on('change', function() { // Сохранение в историю при отпускании
          _self.canvas.fire('object:property-realy-changed');
        });


      $(`${this.containerSelector} .toolpanel#select-panel .effect-section .effect`).change(function () {
        let effect = $(this).attr('id');
        let value = parseFloat($(this).val());
        let currentEffect = _self.getCurrentEffect(_self.activeSelection);
        _self.activeSelection.filters = _self.getUpdatedFilter(currentEffect, effect, value);
        _self.activeSelection.applyFilters();
        _self.canvas.renderAll(), _self.canvas.fire('object:property-realy-changed')
      })
    })();
    // end effect section

    // animate section
    (() => {
      $(`${this.containerSelector} .toolpanel#select-panel .content`).append(`
        <div class="animate-section">
          <h4>Animation</h4>
          <div class="input-container">
            <label>Type</label>
            <select id="animate-type">
              <option value="none">None</option>
              <option value="slideInLeft">Slide from left</option>
              <option value="slideInRight">Slide from right</option>
              <option value="slideInTop">Slide from top</option>
              <option value="slideInBottom">Slide from bottom</option>
              <option value="fade">Fade</option>
              <option value="zoom">Zoom</option>
              <option value="spin">Spin</option>
              <option value="swing">Swing</option>
              <option value="float">Float</option>
              <option value="typewriter">Typewriter</option>
            </select>
          </div>
          <hr>
        </div>
      `);

      $(`${this.containerSelector} .toolpanel#select-panel .animate-section #animate-type`).change(function () {
        const animationType = $(this).val();
        const object = _self.activeSelection;
        if (!object) return;

        if (_self.animations.animations[animationType]) {
          object.set('animation', {
            type: animationType,
            duration: 1000,
            easing: 'easeInOutQuad'
          });
          _self.animations.animations[animationType](object);
        } else {
          object.set('animation', null);
        }

        _self.canvas.fire('object:property-realy-changed');
      });
    })();
    // end animate section

    this.setSelectionValues = () => {
      const _self = this;

      let count = _self.canvas.getActiveObjects().length

      if (count == 1) {
        let activeObject = _self.activeSelection;

        if (activeObject) {

          const {
            strokeWidth,
            stroke,
            strokeLineCap,
            cornerStyle,
            fill,
            fontFamily,
            fontSize,
            fontWeight,
            lineHeight,
            charSpacing,
            textAlign,
            type,
            animation,
            opacity,
            width,
            height,
            clipPath,
          } = activeObject;

          const setValue = setPanelValue;
          syncGeometryValues(activeObject);

          // Fill section
          setValue('.fill-section #color-picker', fill);

          // Border section
          setValue('.border-section #color-picker', stroke);
          setValue('.border-section #input-border-width', strokeWidth);
          if (strokeLineCap !== undefined && strokeLineCap !== null) {
            const borderStyleValue = JSON.stringify({
              strokeDashArray: activeObject.strokeDashArray ?? [],
              strokeLineCap: strokeLineCap
            });
            setValue('.border-section #input-border-style', borderStyleValue);
          }
          setValue('.border-section #input-corner-type', cornerStyle);

          if (type === 'i-text') {
            $(`${_self.containerSelector} .toolpanel#select-panel .geometry-hint`).text(
              window.lang == 'ru'
                ? 'X и Y задают якорь текста. Углы меняют размер шрифта; перенос строки создаёт только Enter.'
                : 'X and Y set the text anchor. Corners change font size; only Enter creates a line break.',
            );
            const align = textOrigin(activeObject);
            if (activeObject.originX !== align || activeObject.originY !== 'center') {
              const position = activeObject.getPointByOrigin(align, 'center');
              activeObject.set({ originX: align, originY: 'center' });
              activeObject.setPositionByOrigin(position, align, 'center');
            }
            activeObject.set({
              centeredRotation: false,
              strokeUniform: true,
              styles: {},
            });
            activeObject.setControlsVisibility({
              mt: false,
              mb: false,
              ml: false,
              mr: false,
            });
            // Text section
            if (activeObject.paintFirst !== 'stroke') {
              activeObject.set('paintFirst', 'stroke');
            }
            setValue('.text-section #font-family', fontFamily);
            setValue('.text-section #fontSize', fontSize);
            setValue('.text-section #fontWeight', fontWeight === 'bold' ? 700 : (Number(fontWeight) || 400));
            setValue('.text-section #lineHeight', lineHeight);
            setValue('.text-section #charSpacing', charSpacing);
            setValue('.text-section #text-align', textAlign);
            setValue('.text-section #color-picker', fill);
            setValue('.text-section #textStrokeWidth', (strokeWidth || 0) / 2);
            $(`${_self.containerSelector} .toolpanel#select-panel .text-section #color-picker`)
              .spectrum('set', fill || '#000000');
            $(`${_self.containerSelector} .toolpanel#select-panel #text-stroke-color-picker`)
              .spectrum('set', stroke || '#000000');
          }
          else {
            $(`${_self.containerSelector} .toolpanel#select-panel .geometry-hint`).text(
              window.lang == 'ru'
                ? 'X и Y задают центр объекта.'
                : 'X and Y use the object center.',
            );
          }
          // console.log(animation)
          if(animation) {
            setValue('.animate-section #animate-type', animation.type);
          }

          if (type === 'image') {
            // Opacity
            setValue('.effect-section #opacity', opacity);

            // Corner radius
            if (clipPath && clipPath.type === 'rect') {
              const maxRadius = Math.sqrt(width * width + height * height) / 2;
              const currentRadius = clipPath.rx; // текущий радиус из clipPath
              const sliderValue = Math.sqrt(currentRadius / maxRadius) * 300; // обратный расчет для ползунка
              setValue('.effect-section #corner-radius', sliderValue);
            } else {
              setValue('.effect-section #corner-radius', 0);
            }
          }

        }
      }
    }

    ['object:moving', 'object:scaling', 'object:resizing', 'object:rotating'].forEach(eventName => {
      _self.canvas.on(eventName, () => _self.setSelectionValues());
    });
    _self.canvas.on('text:changed', event => {
      if (event.target === _self.activeSelection) {
        event.target.set('styles', {});
        event.target.setCoords();
        syncGeometryValues(event.target);
      }
    });
    _self.canvas.on('object:modified', event => {
      const object = event.target || _self.activeSelection;
      if (object === _self.activeSelection) {
        normalizeTextScale(object);
        syncGeometryValues(object);
      }
    });
    _self.canvas.on('object:property-realy-changed', event => {
      const object = event.target || _self.activeSelection;
      if (object === _self.activeSelection) {
        syncGeometryValues(object);
      }
    });
  }

  window.ImageEditor.prototype.initializeSelectionSettings = selectionSettings;
})()
