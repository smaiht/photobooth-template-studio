/**
 * Editable photo slots for photobooth layouts.
 */
(function () {
  'use strict';

  const SLOT_KIND = 'photo-slot';
  const MIN_SLOT_SIZE = 40;
  const PLACEHOLDER_TYPES = new Set(['gray', 'white', 'image']);
  const ASPECT_RATIOS = [
    { id: '3:2', value: 3 / 2 },
    { id: '2:3', value: 2 / 3 },
    { id: '4:3', value: 4 / 3 },
    { id: '3:4', value: 3 / 4 },
    { id: '1:1', value: 1 },
    { id: '16:9', value: 16 / 9 },
    { id: '9:16', value: 9 / 16 },
    { id: 'free', value: null },
  ];

  const matchingAspectRatio = (width, height) => {
    const ratio = width / height;
    return ASPECT_RATIOS.find(option => (
      option.value
      && Math.abs(ratio - option.value) / option.value < 0.002
    ))?.id || 'free';
  };

  const escapeHTML = value => String(value).replace(/[&<>"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[character]);

  function photoLayout() {
    const _self = this;
    const config = this.photoLayout;

    if (!config?.presets?.length) {
      return;
    }

    const isRussian = window.lang === 'ru';
    const canvas = this.canvas;
    let canvasWidth = canvas.originalW;
    let canvasHeight = canvas.originalH;
    const maxPhotos = Math.max(1, Number(config.maxPhotos) || 12);
    let defaultPreset = config.presets.find(
      preset => preset.id === config.defaultPreset,
    ) || config.presets[0];
    let defaultGeometry = defaultPreset.slots[0];
    let activeProfile = 'grid';
    let symmetryAvailable = true;
    let columnAvailable = false;
    let layoutUnlocked = false;
    let slotsVisible = true;
    let aspectRatioId = defaultPreset.aspectRatio || matchingAspectRatio(
      defaultGeometry.width,
      defaultGeometry.height,
    );
    let symmetryEnabled = false;
    let symmetryOffsetX = 0;
    let symmetryOffsetY = 0;
    let symmetryAxesVisible = true;
    let columnEnabled = false;
    let columnGap = 0;
    let pairedTrim = null;
    let pendingImageIndex = null;

    const presetButtons = config.presets.map(preset => `
      <button type="button" data-photo-preset="${escapeHTML(preset.id)}" data-photo-profiles="${escapeHTML((preset.profiles || ['grid']).join(','))}">
        ${escapeHTML(preset.label)}
      </button>
    `).join('');
    const aspectRatioOptions = ASPECT_RATIOS.map(option => `
      <option value="${option.id}">
        ${option.value ? option.id : (isRussian ? 'Свободно' : 'Free')}
      </option>
    `).join('');
    const measurementCard = (side, title) => `
      <div class="photo-measurement-card" data-photo-measurement="${side}"${side === 'right' ? ' hidden' : ''}>
        <div class="photo-layout-heading">
          <div class="background-section-heading" data-photo-measurement-title>${title}</div>
          <output class="photo-layout-bounds-size" data-photo-bounds-size>—</output>
        </div>
        <div class="photo-distance-table">
          <div class="photo-distance-head"></div>
          <div class="photo-distance-head">L</div>
          <div class="photo-distance-head">T</div>
          <div class="photo-distance-head">R</div>
          <div class="photo-distance-head">B</div>
          <div class="photo-distance-label">${isRussian ? 'До края' : 'To edge'}</div>
          ${['left', 'top', 'right', 'bottom'].map(edge => `
            <output data-photo-distance="edge-${edge}">—</output>
          `).join('')}
          <div class="photo-distance-label">${isRussian ? 'До красной' : 'To red line'}</div>
          ${['left', 'top', 'right', 'bottom'].map(edge => `
            <output data-photo-distance="trim-${edge}">—</output>
          `).join('')}
        </div>
        <p class="photo-trim-reference" data-photo-trim-reference></p>
      </div>
    `;

    $(`${this.containerSelector} .main-panel`).append(`
      <div class="toolpanel" id="photo-layout-panel">
        <div class="content">
          <p class="title">${isRussian ? 'Расположение фотографий' : 'Photo layout'}</p>

          <button id="photo-layout-lock" class="photo-layout-edit-button" type="button" aria-pressed="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.25V20h2.75L17.81 8.94l-2.75-2.75L4 17.25Zm15.71-10.04a1 1 0 0 0 0-1.42l-1.5-1.5a1 1 0 0 0-1.42 0l-1.17 1.17 2.75 2.75 1.34-1Z"/></svg>
            <span>
              <strong id="photo-layout-edit-title">${isRussian ? 'Редактировать расположение' : 'Edit photo layout'}</strong>
              <small id="photo-layout-lock-help">${isRussian
                ? 'Включает поля, перемещение фото и хендлы осей.'
                : 'Enables fields, photo movement and axis handles.'}</small>
            </span>
          </button>

          <section class="photo-layout-section">
            <label class="photo-layout-visibility-control">
              <span>
                <strong>${isRussian ? 'Показывать фотослоты' : 'Show photo slots'}</strong>
                <small>${isRussian
                  ? 'Скрывает только предпросмотр, расположение сохраняется.'
                  : 'Hides only the preview; the layout stays intact.'}</small>
              </span>
              <input id="photo-layout-visible" type="checkbox" checked>
            </label>
          </section>

          <section class="photo-layout-section">
            <div class="background-section-heading">
              ${isRussian ? 'Пресеты' : 'Presets'}
            </div>
            <p class="photo-layout-help" id="photo-layout-preset-help">
              ${isRussian
                ? 'Стартовый 2 × 2 точно повторяет текущий grid-конфиг.'
                : 'The initial 2 × 2 preset exactly matches the current grid config.'}
            </p>
            <div class="photo-layout-presets">${presetButtons}</div>
          </section>

          <section class="photo-layout-section" id="photo-symmetry-section">
            <label class="photo-layout-visibility-control">
              <span>
                <strong>${isRussian ? 'Зеркальная симметрия' : 'Mirror symmetry'}</strong>
                <small>${isRussian
                  ? 'Фото 1 — ведущее; до четырёх слотов отражаются относительно двух осей.'
                  : 'Photo 1 is the master; up to four slots mirror around two axes.'}</small>
              </span>
              <input id="photo-symmetry-enabled" type="checkbox">
            </label>
            <div id="photo-symmetry-settings" class="photo-symmetry-settings" hidden>
              <label class="photo-layout-visibility-control photo-symmetry-visibility-control">
                <span>
                  <strong>${isRussian ? 'Показывать оси' : 'Show axes'}</strong>
                  <small>${isRussian
                    ? 'Линии служат только для предпросмотра и не экспортируются.'
                    : 'The lines are preview-only and are never exported.'}</small>
                </span>
                <input id="photo-symmetry-axes-visible" type="checkbox" checked>
              </label>
              <div class="photo-layout-heading">
                <div class="background-section-heading">
                  ${isRussian ? 'Смещение осей от центра' : 'Axis offset from center'}
                </div>
                <button id="photo-symmetry-center" type="button">
                  ${isRussian ? 'По центру' : 'Center'}
                </button>
              </div>
              <div class="photo-layout-size-grid">
                <label><span>X</span><input id="photo-symmetry-offset-x" type="number" step="1" readonly></label>
                <label><span>Y</span><input id="photo-symmetry-offset-y" type="number" step="1" readonly></label>
              </div>
              <div class="photo-symmetry-distances">
                <div class="background-section-heading">
                  ${isRussian ? 'Расстояние между фото' : 'Distance between photos'}
                </div>
                <dl>
                  <div><dt>${isRussian ? 'По горизонтали' : 'Horizontal'}</dt><dd id="photo-symmetry-gap-x">—</dd></div>
                  <div><dt>${isRussian ? 'По вертикали' : 'Vertical'}</dt><dd id="photo-symmetry-gap-y">—</dd></div>
                </dl>
              </div>
              <p class="photo-layout-help photo-symmetry-help">
                ${isRussian
                  ? '0 / 0 — центр холста. В режиме редактирования тяните хендлы за его краями.'
                  : '0 / 0 is the canvas center. In edit mode, drag the handles outside its edges.'}
              </p>
            </div>
          </section>

          <section class="photo-layout-section" id="photo-column-section" hidden>
            <label class="photo-layout-visibility-control">
              <span>
                <strong>${isRussian ? 'Ровная вертикальная колонка' : 'Even vertical column'}</strong>
                <small>${isRussian
                  ? 'Фото 1 — ведущее. Остальные повторяют его X, размер и интервал.'
                  : 'Photo 1 is the master. The others follow its X, size and spacing.'}</small>
              </span>
              <input id="photo-column-enabled" type="checkbox">
            </label>
            <div id="photo-column-settings" class="photo-column-settings" hidden>
              <div class="background-section-heading">
                ${isRussian ? 'Положение и интервал' : 'Position and spacing'}
              </div>
              <div class="photo-column-values">
                <label><span>${isRussian ? 'X всех' : 'All X'}</span><input id="photo-column-x" type="number" min="0" step="1" readonly></label>
                <label><span>${isRussian ? 'Y первого' : 'First Y'}</span><input id="photo-column-y" type="number" min="0" step="1" readonly></label>
                <label><span>${isRussian ? 'Интервал Y' : 'Y gap'}</span><input id="photo-column-gap" type="number" min="0" step="1" readonly></label>
              </div>
              <p class="photo-layout-help photo-column-help">
                ${isRussian
                  ? 'Двигайте и меняйте фото 1 на холсте — вся колонка пересчитается сразу.'
                  : 'Move or resize photo 1 on the canvas and the whole column updates immediately.'}
              </p>
            </div>
          </section>

          <section class="photo-layout-section">
            <div class="background-section-heading">
              ${isRussian ? 'Геометрия' : 'Geometry'}
            </div>

            <label class="photo-layout-field photo-aspect-field">
              <span>${isRussian ? 'Пропорции' : 'Aspect ratio'}</span>
              <select id="photo-layout-aspect" disabled>${aspectRatioOptions}</select>
            </label>
            <p class="photo-layout-help photo-aspect-help">
              ${isRussian
                ? 'При стандартной пропорции вторая сторона пересчитывается автоматически.'
                : 'With a standard ratio, the other side is recalculated automatically.'}
            </p>

            <label class="photo-layout-field photo-count-field">
              <span>${isRussian ? 'Количество фото' : 'Photo count'}</span>
              <input id="photo-layout-count" type="number" min="1" max="${maxPhotos}" step="1" readonly>
            </label>

            <div class="background-section-heading photo-common-size-heading">
              ${isRussian ? 'Размер всех фото' : 'Size of all photos'}
            </div>
            <div class="photo-layout-size-grid">
              <label><span>${isRussian ? 'Ширина' : 'Width'}</span><input id="photo-layout-width" type="number" min="${MIN_SLOT_SIZE}" max="${canvasWidth}" step="1" readonly></label>
              <label><span>${isRussian ? 'Высота' : 'Height'}</span><input id="photo-layout-height" type="number" min="${MIN_SLOT_SIZE}" max="${canvasHeight}" step="1" readonly></label>
            </div>
            <p class="photo-layout-help photo-common-size-help">
              ${isRussian
                ? 'Если размеры различаются, поля будут пустыми.'
                : 'The fields are empty when slot sizes differ.'}
            </p>
            <p id="photo-layout-error" class="photo-layout-error" hidden></p>
          </section>

          <section class="photo-layout-section" id="photo-layout-measurements">
            ${measurementCard(
              'left',
              isRussian ? 'Отступы всей раскладки' : 'Whole layout clearances',
            )}
            ${measurementCard(
              'right',
              isRussian ? 'Правая полоса' : 'Right strip',
            )}
            <p class="photo-layout-help photo-measurements-help">
              ${isRussian
                ? 'Считается по крайним фото. Минус означает, что фото пересекло красную границу.'
                : 'Measured from the outermost photos. A negative value means a photo crossed the red boundary.'}
            </p>
          </section>

          <section class="photo-layout-section">
            <div class="background-section-heading">
              ${isRussian ? 'Каждое фото' : 'Individual photos'}
            </div>
            <p class="photo-layout-help">
              ${isRussian
                ? 'Координаты считаются от левого верхнего угла полного растра.'
                : 'Coordinates start at the top-left of the full raster.'}
            </p>
            <div id="photo-slot-list" class="photo-slot-list"></div>
          </section>
        </div>
      </div>
      <input id="photo-slot-image-input" type="file" accept="image/jpeg,image/png,image/webp" hidden>
    `);

    const panel = document.querySelector(
      `${this.containerSelector} #photo-layout-panel`,
    );
    const lockButton = panel.querySelector('#photo-layout-lock');
    const lockButtonTitle = panel.querySelector('#photo-layout-edit-title');
    const lockHelp = panel.querySelector('#photo-layout-lock-help');
    const visibilityInput = panel.querySelector('#photo-layout-visible');
    const aspectRatioSelect = panel.querySelector('#photo-layout-aspect');
    const countInput = panel.querySelector('#photo-layout-count');
    const commonWidthInput = panel.querySelector('#photo-layout-width');
    const commonHeightInput = panel.querySelector('#photo-layout-height');
    const symmetryInput = panel.querySelector('#photo-symmetry-enabled');
    const symmetrySettings = panel.querySelector('#photo-symmetry-settings');
    const symmetryCenterButton = panel.querySelector('#photo-symmetry-center');
    const symmetryOffsetXInput = panel.querySelector('#photo-symmetry-offset-x');
    const symmetryOffsetYInput = panel.querySelector('#photo-symmetry-offset-y');
    const symmetryAxesVisibilityInput = panel.querySelector('#photo-symmetry-axes-visible');
    const symmetryGapX = panel.querySelector('#photo-symmetry-gap-x');
    const symmetryGapY = panel.querySelector('#photo-symmetry-gap-y');
    const columnSection = panel.querySelector('#photo-column-section');
    const columnInput = panel.querySelector('#photo-column-enabled');
    const columnSettings = panel.querySelector('#photo-column-settings');
    const columnXInput = panel.querySelector('#photo-column-x');
    const columnYInput = panel.querySelector('#photo-column-y');
    const columnGapInput = panel.querySelector('#photo-column-gap');
    const errorElement = panel.querySelector('#photo-layout-error');
    const slotList = panel.querySelector('#photo-slot-list');
    const measurementUI = Object.fromEntries(['left', 'right'].map(side => {
      const card = panel.querySelector(`[data-photo-measurement="${side}"]`);
      return [side, {
        card,
        title: card.querySelector('[data-photo-measurement-title]'),
        boundsSize: card.querySelector('[data-photo-bounds-size]'),
        distances: Object.fromEntries(
          [...card.querySelectorAll('[data-photo-distance]')].map(output => [
            output.dataset.photoDistance,
            output,
          ]),
        ),
        trimReference: card.querySelector('[data-photo-trim-reference]'),
      }];
    }));
    const imageInput = document.querySelector(
      `${this.containerSelector} #photo-slot-image-input`,
    );
    const presetButtonElements = panel.querySelectorAll('[data-photo-preset]');
    const presetHelp = panel.querySelector('#photo-layout-preset-help');
    const symmetrySection = panel.querySelector('#photo-symmetry-section');
    const canvasContainer = canvas.upperCanvasEl.parentElement;
    const canvasContent = canvasContainer.parentElement;

    canvasContent.classList.add('photo-symmetry-host');
    canvasContent.insertAdjacentHTML('beforeend', `
      <div class="photo-symmetry-overlay" hidden>
        <span class="photo-symmetry-line photo-symmetry-line-x" data-symmetry-line="x"></span>
        <span class="photo-symmetry-line photo-symmetry-line-y" data-symmetry-line="y"></span>
        <button class="photo-symmetry-handle photo-symmetry-handle-x" type="button" data-symmetry-axis="x" aria-label="${isRussian ? 'Переместить вертикальную ось' : 'Move vertical axis'}"></button>
        <button class="photo-symmetry-handle photo-symmetry-handle-y" type="button" data-symmetry-axis="y" aria-label="${isRussian ? 'Переместить горизонтальную ось' : 'Move horizontal axis'}"></button>
      </div>
    `);

    const symmetryOverlay = canvasContent.querySelector('.photo-symmetry-overlay');
    const symmetryLines = symmetryOverlay.querySelectorAll('[data-symmetry-line]');
    const symmetryHandles = symmetryOverlay.querySelectorAll('[data-symmetry-axis]');

    aspectRatioSelect.value = aspectRatioId;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const getSlots = () => canvas.getObjects()
      .filter(object => object.kind === SLOT_KIND)
      .sort((a, b) => a.photoIndex - b.photoIndex);

    // Fabric's getScaledWidth/Height includes stroke padding. Photo geometry is
    // the actual slot box, so read its scaled model dimensions directly.
    const slotGeometry = slot => ({
      photo_index: slot.photoIndex,
      x: Math.round(slot.left),
      y: Math.round(slot.top),
      width: Math.max(MIN_SLOT_SIZE, Math.round(Math.abs(slot.width * (slot.scaleX || 1)))),
      height: Math.max(MIN_SLOT_SIZE, Math.round(Math.abs(slot.height * (slot.scaleY || 1)))),
    });

    const presetSupportsProfile = preset => (
      (preset.profiles || ['grid']).includes(activeProfile)
    );

    const slotPreview = slot => ({
      type: PLACEHOLDER_TYPES.has(slot.previewType) ? slot.previewType : 'gray',
      fileName: slot.previewFileName || null,
    });

    const aspectRatioValue = () => ASPECT_RATIOS.find(
      option => option.id === aspectRatioId,
    )?.value || null;

    const fitGeometryToAspectRatio = (geometry, changedSide = 'width') => {
      const ratio = aspectRatioValue();
      if (!ratio) {
        return geometry;
      }

      let width = Math.max(MIN_SLOT_SIZE, Number(geometry.width));
      let height = Math.max(MIN_SLOT_SIZE, Number(geometry.height));

      if (changedSide === 'height') {
        width = height * ratio;
      } else {
        height = width / ratio;
      }

      const shrink = Math.min(1, canvasWidth / width, canvasHeight / height);
      width *= shrink;
      height *= shrink;

      const grow = Math.max(1, MIN_SLOT_SIZE / width, MIN_SLOT_SIZE / height);
      return {
        ...geometry,
        width: Math.round(width * grow),
        height: Math.round(height * grow),
      };
    };

    const fitSlotPreview = (slot, width, height) => {
      const scaleX = slot.scaleX || 1;
      const scaleY = slot.scaleY || 1;
      const objects = slot.getObjects();
      const image = objects.find(object => object.kind === 'photo-preview-image');
      const number = objects.find(object => object.kind === 'photo-slot-number');

      if (image) {
        const imageScale = Math.min(width / image.width, height / image.height);
        image.set({
          scaleX: imageScale / scaleX,
          scaleY: imageScale / scaleY,
        });

        const badge = objects.find(object => object.kind === 'photo-slot-badge');
        const radius = Math.max(18, Math.min(56, width / 8, height / 8));
        const badgeX = (-width / 2) + radius + 18;
        const badgeY = (-height / 2) + radius + 18;

        badge?.set({
          left: badgeX / scaleX,
          top: badgeY / scaleY,
          scaleX: radius / badge.radius / scaleX,
          scaleY: radius / badge.radius / scaleY,
        });
        number?.set({
          left: badgeX / scaleX,
          top: badgeY / scaleY,
          scaleX: (radius * 1.25) / number.fontSize / scaleX,
          scaleY: (radius * 1.25) / number.fontSize / scaleY,
        });
      } else if (number) {
        const fontSize = Math.max(40, Math.min(width, height) * 0.24);
        number.set({
          scaleX: fontSize / number.fontSize / scaleX,
          scaleY: fontSize / number.fontSize / scaleY,
        });
      }

      slot.dirty = true;
    };

    const setSlotGeometry = (slot, geometry) => {
      const width = clamp(Math.round(geometry.width), MIN_SLOT_SIZE, canvasWidth);
      const height = clamp(Math.round(geometry.height), MIN_SLOT_SIZE, canvasHeight);
      const x = clamp(Math.round(geometry.x), 0, canvasWidth - width);
      const y = clamp(Math.round(geometry.y), 0, canvasHeight - height);

      slot.set({
        left: x,
        top: y,
        scaleX: width / slot.width,
        scaleY: height / slot.height,
      });
      fitSlotPreview(slot, width, height);
      slot.setCoords();
    };

    const symmetryAxisX = () => (canvasWidth / 2) + symmetryOffsetX;
    const symmetryAxisY = () => (canvasHeight / 2) + symmetryOffsetY;

    const setSymmetryAxes = (axisX, axisY) => {
      symmetryOffsetX = Math.round(
        clamp(axisX, MIN_SLOT_SIZE, canvasWidth - MIN_SLOT_SIZE) - (canvasWidth / 2),
      );
      symmetryOffsetY = Math.round(
        clamp(axisY, MIN_SLOT_SIZE, canvasHeight - MIN_SLOT_SIZE) - (canvasHeight / 2),
      );
    };

    const deriveSymmetryAxes = geometries => {
      const master = geometries[0];

      if (!master) {
        setSymmetryAxes(canvasWidth / 2, canvasHeight / 2);
        return;
      }

      const right = geometries[1];
      const bottom = geometries[2];
      setSymmetryAxes(
        right
          ? ((master.x + master.width) + right.x) / 2
          : canvasWidth / 2,
        bottom
          ? ((master.y + master.height) + bottom.y) / 2
          : canvasHeight / 2,
      );
    };

    const normalizeMasterGeometry = (geometry, slotCount) => {
      const mirrorsRight = slotCount >= 2;
      const mirrorsDown = slotCount >= 3;
      const axisX = symmetryAxisX();
      const axisY = symmetryAxisY();
      const minimumX = mirrorsRight ? Math.max(0, (2 * axisX) - canvasWidth) : 0;
      const minimumY = mirrorsDown ? Math.max(0, (2 * axisY) - canvasHeight) : 0;
      const maximumWidth = mirrorsRight ? axisX - minimumX : canvasWidth;
      const maximumHeight = mirrorsDown ? axisY - minimumY : canvasHeight;
      let width = clamp(Math.round(geometry.width), MIN_SLOT_SIZE, maximumWidth);
      let height = clamp(Math.round(geometry.height), MIN_SLOT_SIZE, maximumHeight);
      const ratio = aspectRatioValue();

      if (ratio) {
        const scale = Math.min(1, maximumWidth / width, maximumHeight / height);
        width = Math.max(MIN_SLOT_SIZE, Math.round(width * scale));
        height = Math.max(MIN_SLOT_SIZE, Math.round(width / ratio));

        if (height > maximumHeight) {
          height = Math.max(MIN_SLOT_SIZE, Math.round(maximumHeight));
          width = Math.max(MIN_SLOT_SIZE, Math.round(height * ratio));
        }
      }

      width = Math.min(width, maximumWidth);
      height = Math.min(height, maximumHeight);

      return {
        ...geometry,
        x: Math.round(clamp(
          geometry.x,
          minimumX,
          mirrorsRight ? axisX - width : canvasWidth - width,
        )),
        y: Math.round(clamp(
          geometry.y,
          minimumY,
          mirrorsDown ? axisY - height : canvasHeight - height,
        )),
        width: Math.round(width),
        height: Math.round(height),
      };
    };

    const mirroredGeometries = (master, slotCount) => {
      const mirroredX = Math.round((2 * symmetryAxisX()) - master.x - master.width);
      const mirroredY = Math.round((2 * symmetryAxisY()) - master.y - master.height);

      return [
        master,
        { ...master, x: mirroredX },
        { ...master, y: mirroredY },
        { ...master, x: mirroredX, y: mirroredY },
      ].slice(0, slotCount);
    };

    const stampSymmetryState = (slots = getSlots()) => {
      slots.forEach(slot => {
        slot.photoSymmetryEnabled = symmetryEnabled;
        slot.photoSymmetryOffsetX = symmetryOffsetX;
        slot.photoSymmetryOffsetY = symmetryOffsetY;
      });
    };

    const applySymmetryGeometry = masterGeometry => {
      const slots = getSlots();

      if (!symmetryEnabled || !slots.length || slots.length > 4) {
        stampSymmetryState(slots);
        return;
      }

      const master = normalizeMasterGeometry(
        masterGeometry || slotGeometry(slots[0]),
        slots.length,
      );
      mirroredGeometries(master, slots.length).forEach((geometry, index) => {
        setSlotGeometry(slots[index], geometry);
      });
      stampSymmetryState(slots);
    };

    const columnInfo = geometries => {
      const first = geometries[0];
      if (!first) return { enabled: false, gap: 0 };
      if (geometries.length === 1) return { enabled: true, gap: 0 };

      const gaps = geometries.slice(1).map((geometry, index) => (
        geometry.y - geometries[index].y - geometries[index].height
      ));
      const gap = Math.round(gaps[0]);
      const aligned = geometries.every(geometry => (
        Math.round(geometry.x) === Math.round(first.x)
        && Math.round(geometry.width) === Math.round(first.width)
        && Math.round(geometry.height) === Math.round(first.height)
      ));

      return {
        enabled: aligned && gap >= 0 && gaps.every(value => Math.round(value) === gap),
        gap: Math.max(0, gap),
      };
    };

    const maximumColumnGap = slotCount => (
      slotCount > 1
        ? Math.max(0, Math.floor(
          (canvasHeight - (slotCount * MIN_SLOT_SIZE)) / (slotCount - 1),
        ))
        : 0
    );

    const maximumColumnGapForHeight = (height, slotCount, startY = 0) => (
      slotCount > 1
        ? Math.max(0, Math.floor(
          (canvasHeight - startY - (slotCount * height)) / (slotCount - 1),
        ))
        : 0
    );

    const normalizeColumnMaster = (geometry, slotCount) => {
      const count = Math.max(1, slotCount);
      columnGap = clamp(Math.round(columnGap), 0, maximumColumnGap(count));
      const maximumHeight = Math.max(
        MIN_SLOT_SIZE,
        Math.floor((canvasHeight - ((count - 1) * columnGap)) / count),
      );
      let width = clamp(Math.round(geometry.width), MIN_SLOT_SIZE, canvasWidth);
      let height = clamp(Math.round(geometry.height), MIN_SLOT_SIZE, maximumHeight);
      const ratio = aspectRatioValue();

      if (ratio) {
        height = Math.round(width / ratio);
        if (height > maximumHeight) {
          height = maximumHeight;
          width = Math.round(height * ratio);
        }
        if (width > canvasWidth) {
          width = canvasWidth;
          height = Math.round(width / ratio);
        }
        width = Math.max(MIN_SLOT_SIZE, width);
        height = Math.max(MIN_SLOT_SIZE, Math.min(maximumHeight, height));
      }

      const totalHeight = (count * height) + ((count - 1) * columnGap);
      return {
        ...geometry,
        x: Math.round(clamp(geometry.x, 0, canvasWidth - width)),
        y: Math.round(clamp(geometry.y, 0, canvasHeight - totalHeight)),
        width,
        height,
      };
    };

    const stampColumnState = (slots = getSlots()) => {
      slots.forEach(slot => {
        slot.photoColumnEnabled = columnEnabled;
        slot.photoColumnGap = columnGap;
      });
    };

    const applyColumnGeometry = masterGeometry => {
      const slots = getSlots();

      if (!columnEnabled || !slots.length) {
        stampColumnState(slots);
        return;
      }

      const master = normalizeColumnMaster(
        masterGeometry || slotGeometry(slots[0]),
        slots.length,
      );
      slots.forEach((slot, index) => {
        setSlotGeometry(slot, {
          ...master,
          y: master.y + (index * (master.height + columnGap)),
        });
      });
      stampColumnState(slots);
    };

    const constrainedAxisValue = (axis, value) => {
      const slots = getSlots();
      const master = slots[0] && slotGeometry(slots[0]);

      if (!master) {
        return axis === 'x' ? canvasWidth / 2 : canvasHeight / 2;
      }

      if (axis === 'x' && slots.length >= 2) {
        return clamp(value, master.x + master.width, (canvasWidth + master.x) / 2);
      }
      if (axis === 'y' && slots.length >= 3) {
        return clamp(value, master.y + master.height, (canvasHeight + master.y) / 2);
      }

      return clamp(value, 0, axis === 'x' ? canvasWidth : canvasHeight);
    };

    const createSlot = (geometry, photoIndex, previewType = 'gray', image = null, fileName = null) => {
      const width = Math.max(MIN_SLOT_SIZE, Math.round(geometry.width));
      const height = Math.max(MIN_SLOT_SIZE, Math.round(geometry.height));
      const type = PLACEHOLDER_TYPES.has(previewType) ? previewType : 'gray';
      const children = [new fabric.Rect({
        left: 0,
        top: 0,
        originX: 'center',
        originY: 'center',
        width,
        height,
        strokeWidth: 0,
        fill: type === 'white' ? '#ffffff' : '#d9dde5',
        kind: 'photo-slot-background',
        selectable: false,
        evented: false,
      })];

      if (type === 'image' && image) {
        const scale = Math.min(width / image.width, height / image.height);
        image.set({
          left: 0,
          top: 0,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          kind: 'photo-preview-image',
          selectable: false,
          evented: false,
        });
        children.push(image);
      }

      if (type === 'image' && image) {
        const radius = Math.max(18, Math.min(56, width / 8, height / 8));
        const badgeX = (-width / 2) + radius + 18;
        const badgeY = (-height / 2) + radius + 18;
        children.push(
          new fabric.Circle({
            left: badgeX,
            top: badgeY,
            originX: 'center',
            originY: 'center',
            radius,
            fill: 'rgba(17, 24, 39, 0.72)',
            kind: 'photo-slot-badge',
            selectable: false,
            evented: false,
          }),
          new fabric.Text(String(photoIndex + 1), {
            left: badgeX,
            top: badgeY,
            originX: 'center',
            originY: 'center',
            fontFamily: 'Arial, sans-serif',
            fontSize: radius * 1.25,
            fontWeight: '700',
            fill: '#ffffff',
            kind: 'photo-slot-number',
            selectable: false,
            evented: false,
          }),
        );
      } else {
        children.push(new fabric.Text(String(photoIndex + 1), {
          left: 0,
          top: 0,
          originX: 'center',
          originY: 'center',
          fontFamily: 'Arial, sans-serif',
          fontSize: Math.max(40, Math.min(width, height) * 0.24),
          fontWeight: '700',
          fill: type === 'white' ? '#9299a6' : '#697180',
          kind: 'photo-slot-number',
          selectable: false,
          evented: false,
        }));
      }

      const slot = new fabric.Group(children, {
        left: geometry.x,
        top: geometry.y,
        originX: 'left',
        originY: 'top',
        kind: SLOT_KIND,
        photoIndex,
        previewType: type,
        previewFileName: fileName,
        photoAspectRatio: aspectRatioId,
        photoSymmetryEnabled: symmetryEnabled,
        photoSymmetryOffsetX: symmetryOffsetX,
        photoSymmetryOffsetY: symmetryOffsetY,
        photoColumnEnabled: columnEnabled,
        photoColumnGap: columnGap,
        visible: slotsVisible,
        editorLocked: !layoutUnlocked || !slotsVisible,
        selectable: layoutUnlocked && slotsVisible,
        evented: layoutUnlocked && slotsVisible,
        lockRotation: true,
        lockScalingFlip: true,
        lockSkewingX: true,
        lockSkewingY: true,
        strokeWidth: 0,
        objectCaching: false,
      });
      slot.setControlsVisibility({ mtr: false, deleteControl: false });
      setSlotGeometry(slot, geometry);
      return slot;
    };

    const setSlotsLocked = () => {
      getSlots().forEach(slot => {
        const isFollower = (symmetryEnabled || columnEnabled) && slot.photoIndex !== 0;
        const obsoleteBorder = slot.getObjects().find(
          object => object.kind === 'photo-slot-border',
        );
        if (obsoleteBorder) {
          obsoleteBorder.visible = false;
        }
        slot.photoAspectRatio = aspectRatioId;
        slot.photoSymmetryEnabled = symmetryEnabled;
        slot.photoSymmetryOffsetX = symmetryOffsetX;
        slot.photoSymmetryOffsetY = symmetryOffsetY;
        slot.photoColumnEnabled = columnEnabled;
        slot.photoColumnGap = columnGap;
        slot.visible = slotsVisible;
        slot.editorLocked = !layoutUnlocked || !slotsVisible || isFollower;
        slot.selectable = layoutUnlocked && slotsVisible && !isFollower;
        slot.evented = layoutUnlocked && slotsVisible && !isFollower;
        slot.setControlsVisibility({ mtr: false, deleteControl: false });
      });
    };

    const photoLayerPosition = () => {
      const objects = canvas.getObjects();
      const firstSlotIndex = objects.findIndex(object => object.kind === SLOT_KIND);

      if (firstSlotIndex === -1) {
        return 0;
      }

      return objects.slice(0, firstSlotIndex)
        .filter(object => object.kind !== SLOT_KIND).length;
    };

    const arrangePhotoLayer = (position = photoLayerPosition()) => {
      const slots = getSlots();
      const otherObjects = canvas.getObjects()
        .filter(object => object.kind !== SLOT_KIND);
      const layerPosition = clamp(position, 0, otherObjects.length);
      const order = [
        ...otherObjects.slice(0, layerPosition),
        ...slots,
        ...otherObjects.slice(layerPosition),
      ];

      order.forEach((object, index) => canvas.moveTo(object, index));
    };

    const mutateLayout = (mutation, recordHistory = true) => {
      const wasProcessing = canvas.historyProcessing;
      const layerPosition = photoLayerPosition();
      canvas.historyProcessing = true;

      try {
        mutation();
      } finally {
        canvas.historyProcessing = wasProcessing;
      }

      arrangePhotoLayer(layerPosition);
      setSlotsLocked();
      canvas.requestRenderAll();

      if (recordHistory && !wasProcessing) {
        canvas.fire('object:modified', { target: getSlots()[0] });
      } else {
        canvas.fire('photo-layout:modified');
      }
    };

    const presetMatches = (preset, slots = getSlots()) => (
      preset.slots.length === slots.length
      && preset.slots.every((geometry, index) => {
        const current = slotGeometry(slots[index]);
        return ['x', 'y', 'width', 'height'].every(
          property => current[property] === geometry[property],
        );
      })
    );

    const activePresetId = () => (
      config.presets.find(preset => (
        presetSupportsProfile(preset) && presetMatches(preset)
      ))?.id || null
    );

    const renderPresetState = () => {
      const activeId = activePresetId();
      presetButtonElements.forEach(button => {
        button.classList.toggle('active', button.dataset.photoPreset === activeId);
      });
    };

    const renderCommonSize = slots => {
      const geometries = slots.map(slotGeometry);
      const commonWidth = geometries[0]?.width;
      const commonHeight = geometries[0]?.height;
      const sameWidth = geometries.every(item => item.width === commonWidth);
      const sameHeight = geometries.every(item => item.height === commonHeight);

      commonWidthInput.value = sameWidth && commonWidth ? commonWidth : '';
      commonHeightInput.value = sameHeight && commonHeight ? commonHeight : '';
      commonWidthInput.placeholder = sameWidth ? '' : (isRussian ? 'разные' : 'mixed');
      commonHeightInput.placeholder = sameHeight ? '' : (isRussian ? 'разные' : 'mixed');
    };

    const renderSymmetryControls = () => {
      const slots = getSlots();
      const master = slots[0] && slotGeometry(slots[0]);
      const unavailable = slots.length > 4;
      const canEdit = symmetryEnabled && layoutUnlocked && slotsVisible;
      const showAxes = symmetryEnabled && symmetryAxesVisible && slotsVisible;
      const axisX = symmetryAxisX();
      const axisY = symmetryAxisY();

      symmetryInput.checked = symmetryEnabled;
      symmetryInput.disabled = unavailable;
      countInput.max = symmetryEnabled ? Math.min(4, maxPhotos) : maxPhotos;
      symmetryInput.title = unavailable
        ? (isRussian
          ? 'Одна пара осей поддерживает до 4 фотослотов.'
          : 'One pair of axes supports up to 4 photo slots.')
        : '';
      symmetrySettings.hidden = !symmetryEnabled;
      symmetryAxesVisibilityInput.checked = symmetryAxesVisible;
      symmetryCenterButton.disabled = !canEdit || slots.length < 2;
      symmetryOffsetXInput.readOnly = !canEdit || slots.length < 2;
      symmetryOffsetYInput.readOnly = !canEdit || slots.length < 3;
      symmetryOffsetXInput.value = symmetryOffsetX;
      symmetryOffsetYInput.value = symmetryOffsetY;
      symmetryGapX.textContent = slots.length >= 2 && master
        ? `${Math.max(0, Math.round(
          slotGeometry(slots[1]).x - master.x - master.width,
        ))} px`
        : '—';
      symmetryGapY.textContent = slots.length >= 3 && master
        ? `${Math.max(0, Math.round(
          slotGeometry(slots[2]).y - master.y - master.height,
        ))} px`
        : '—';

      if (master) {
        const minimumX = slots.length >= 2 ? master.x + master.width : 0;
        const maximumX = slots.length >= 2 ? (canvasWidth + master.x) / 2 : canvasWidth;
        const minimumY = slots.length >= 3 ? master.y + master.height : 0;
        const maximumY = slots.length >= 3 ? (canvasHeight + master.y) / 2 : canvasHeight;
        symmetryOffsetXInput.min = Math.ceil(minimumX - (canvasWidth / 2));
        symmetryOffsetXInput.max = Math.floor(maximumX - (canvasWidth / 2));
        symmetryOffsetYInput.min = Math.ceil(minimumY - (canvasHeight / 2));
        symmetryOffsetYInput.max = Math.floor(maximumY - (canvasHeight / 2));
      }

      symmetryOverlay.hidden = !showAxes || slots.length < 2;
      symmetryLines.forEach(lineElement => {
        const minimumSlots = lineElement.dataset.symmetryLine === 'x' ? 2 : 3;
        lineElement.hidden = slots.length < minimumSlots;
      });
      symmetryHandles.forEach(handleElement => {
        const minimumSlots = handleElement.dataset.symmetryAxis === 'x' ? 2 : 3;
        handleElement.hidden = !canEdit || slots.length < minimumSlots;
      });
      symmetryOverlay.style.setProperty(
        '--photo-symmetry-x',
        `${(axisX / canvasWidth) * 100}%`,
      );
      symmetryOverlay.style.setProperty(
        '--photo-symmetry-y',
        `${(axisY / canvasHeight) * 100}%`,
      );
    };

    const renderColumnControls = () => {
      const slots = getSlots();
      const master = slots[0] && slotGeometry(slots[0]);
      const canEdit = columnEnabled && layoutUnlocked && slotsVisible && Boolean(master);

      columnSection.hidden = !columnAvailable;
      columnInput.checked = columnEnabled;
      columnInput.disabled = !columnAvailable || !slots.length;
      columnSettings.hidden = !columnEnabled;
      [columnXInput, columnYInput, columnGapInput].forEach(input => {
        input.readOnly = !canEdit;
      });

      if (!master) {
        columnXInput.value = '';
        columnYInput.value = '';
        columnGapInput.value = '';
        return;
      }

      const totalHeight = (slots.length * master.height)
        + (Math.max(0, slots.length - 1) * columnGap);
      columnXInput.value = master.x;
      columnXInput.max = Math.max(0, canvasWidth - master.width);
      columnYInput.value = master.y;
      columnYInput.max = Math.max(0, canvasHeight - totalHeight);
      columnGapInput.value = columnGap;
      columnGapInput.max = maximumColumnGapForHeight(
        master.height,
        slots.length,
        master.y,
      );
    };

    const renderMeasurements = () => {
      const geometries = getSlots().map(slotGeometry);
      const stripPair = activeProfile === 'strips' && Boolean(pairedTrim);
      const leftTrim = {
        left: Number(canvas.printTrim?.left) || 0,
        top: Number(canvas.printTrim?.top) || 0,
        right: Number(canvas.printTrim?.right) || 0,
        bottom: Number(canvas.printTrim?.bottom) || 0,
      };

      measurementUI.left.title.textContent = stripPair
        ? (isRussian ? 'Левая полоса' : 'Left strip')
        : (isRussian ? 'Отступы всей раскладки' : 'Whole layout clearances');
      measurementUI.right.card.hidden = !stripPair;

      const renderSide = (side, sideGeometries, trim, cutSide = null) => {
        const ui = measurementUI[side];
        const trimValue = edge => (
          edge === cutSide
            ? (isRussian ? 'разрез' : 'cut')
            : `${trim[edge]} px`
        );

        ui.trimReference.textContent = isRussian
          ? `Красная граница: L ${trimValue('left')} · T ${trimValue('top')} · R ${trimValue('right')} · B ${trimValue('bottom')}`
          : `Red boundary: L ${trimValue('left')} · T ${trimValue('top')} · R ${trimValue('right')} · B ${trimValue('bottom')}`;

        if (!sideGeometries.length) {
          ui.boundsSize.textContent = '—';
          Object.values(ui.distances).forEach(output => {
            output.textContent = '—';
            output.classList.remove('outside');
          });
          return;
        }

        const bounds = {
          left: Math.min(...sideGeometries.map(geometry => geometry.x)),
          top: Math.min(...sideGeometries.map(geometry => geometry.y)),
          right: Math.max(...sideGeometries.map(geometry => geometry.x + geometry.width)),
          bottom: Math.max(...sideGeometries.map(geometry => geometry.y + geometry.height)),
        };
        const distances = {
          'edge-left': bounds.left,
          'edge-top': bounds.top,
          'edge-right': canvasWidth - bounds.right,
          'edge-bottom': canvasHeight - bounds.bottom,
          'trim-left': bounds.left - trim.left,
          'trim-top': bounds.top - trim.top,
          'trim-right': (canvasWidth - trim.right) - bounds.right,
          'trim-bottom': (canvasHeight - trim.bottom) - bounds.bottom,
        };

        ui.boundsSize.textContent = `${bounds.right - bounds.left} × ${bounds.bottom - bounds.top} px`;
        Object.entries(distances).forEach(([key, value]) => {
          ui.distances[key].textContent = `${Math.round(value)} px`;
          ui.distances[key].classList.toggle('outside', value < 0);
        });
      };

      renderSide('left', geometries, leftTrim, stripPair ? 'right' : null);
      if (stripPair) {
        const rightGeometries = geometries.map(geometry => ({
          ...geometry,
          x: canvasWidth - geometry.x - geometry.width,
        }));
        renderSide('right', rightGeometries, pairedTrim, 'left');
      }
    };

    const renderSlotCards = () => {
      const slots = getSlots();
      const activeObject = canvas.getActiveObject();

      slotList.innerHTML = slots.map(slot => {
        const geometry = slotGeometry(slot);
        const geometryEditable = layoutUnlocked
          && (!(symmetryEnabled || columnEnabled) || slot.photoIndex === 0);
        const preview = slotPreview(slot);
        const previewLabel = preview.type === 'image'
          ? (preview.fileName || (isRussian ? 'Своя картинка' : 'Custom image'))
          : (preview.type === 'white'
            ? (isRussian ? 'Белый' : 'White')
            : (isRussian ? 'Серый' : 'Gray'));
        const safePreviewLabel = escapeHTML(previewLabel);

        return `
          <article class="photo-slot-card${activeObject === slot ? ' selected' : ''}${(symmetryEnabled || columnEnabled) && slot.photoIndex !== 0 ? ' layout-follower' : ''}" data-photo-index="${slot.photoIndex}">
            <header>
              <strong>${isRussian ? 'Фото' : 'Photo'} ${slot.photoIndex + 1}</strong>
              <span title="${safePreviewLabel}">${safePreviewLabel}</span>
            </header>
            <div class="photo-slot-values">
              <label><span>X</span><input type="number" min="0" max="${canvasWidth}" step="1" value="${geometry.x}" data-slot-property="x" ${geometryEditable ? '' : 'readonly'}></label>
              <label><span>Y</span><input type="number" min="0" max="${canvasHeight}" step="1" value="${geometry.y}" data-slot-property="y" ${geometryEditable ? '' : 'readonly'}></label>
              <label><span>W</span><input type="number" min="${MIN_SLOT_SIZE}" max="${canvasWidth}" step="1" value="${geometry.width}" data-slot-property="width" ${geometryEditable ? '' : 'readonly'}></label>
              <label><span>H</span><input type="number" min="${MIN_SLOT_SIZE}" max="${canvasHeight}" step="1" value="${geometry.height}" data-slot-property="height" ${geometryEditable ? '' : 'readonly'}></label>
            </div>
            <div class="photo-slot-preview-actions">
              <button class="${preview.type === 'gray' ? 'active' : ''}" type="button" data-placeholder="gray">${isRussian ? 'Серый' : 'Gray'}</button>
              <button class="${preview.type === 'white' ? 'active' : ''}" type="button" data-placeholder="white">${isRussian ? 'Белый' : 'White'}</button>
              <button class="${preview.type === 'image' ? 'active' : ''}" type="button" data-placeholder="image">${isRussian ? 'Картинка' : 'Image'}</button>
            </div>
          </article>
        `;
      }).join('');

      countInput.value = slots.length;
      aspectRatioSelect.value = aspectRatioId;
      renderCommonSize(slots);
      renderPresetState();
      renderSymmetryControls();
      renderColumnControls();
      renderMeasurements();
    };

    const showError = message => {
      errorElement.textContent = message || '';
      errorElement.hidden = !message;
    };

    const setSymmetryEnabled = (enabled, recordHistory = true) => {
      const slots = getSlots();
      const nextEnabled = enabled === true;

      if (nextEnabled && slots.length > 4) {
        symmetryInput.checked = false;
        showError(isRussian
          ? 'Для одной пары осей можно использовать не больше 4 фотослотов.'
          : 'One pair of axes can control no more than 4 photo slots.');
        return false;
      }

      if (nextEnabled === symmetryEnabled) {
        renderSymmetryControls();
        return true;
      }

      mutateLayout(() => {
        symmetryEnabled = nextEnabled;

        if (symmetryEnabled) {
          columnEnabled = false;
          deriveSymmetryAxes(slots.map(slotGeometry));
          applySymmetryGeometry();
        } else {
          stampSymmetryState(slots);
        }
        stampColumnState(slots);
      }, recordHistory);

      const activeObject = canvas.getActiveObject();
      if (
        symmetryEnabled
        && activeObject?.kind === SLOT_KIND
        && activeObject.photoIndex !== 0
      ) {
        canvas.setActiveObject(getSlots()[0]);
      }

      showError(null);
      renderSlotCards();
      return true;
    };

    const setColumnEnabled = (enabled, recordHistory = true) => {
      const slots = getSlots();
      const nextEnabled = columnAvailable && enabled === true && slots.length > 0;

      if (nextEnabled === columnEnabled) {
        renderColumnControls();
        return true;
      }

      mutateLayout(() => {
        columnEnabled = nextEnabled;

        if (columnEnabled) {
          symmetryEnabled = false;
          const current = slots.map(slotGeometry);
          columnGap = current.length > 1
            ? Math.max(0, Math.round(current[1].y - current[0].y - current[0].height))
            : 0;
          applyColumnGeometry(current[0]);
        } else {
          stampColumnState(slots);
        }
        stampSymmetryState(slots);
      }, recordHistory);

      showError(null);
      renderSlotCards();
      return true;
    };

    const applyGeometries = (
      geometries,
      recordHistory = true,
      nextAspectRatio = aspectRatioId,
      nextSymmetry = null,
      nextColumn = null,
    ) => {
      if (ASPECT_RATIOS.some(option => option.id === nextAspectRatio)) {
        aspectRatioId = nextAspectRatio;
      }

      if (nextSymmetry) {
        symmetryEnabled = symmetryAvailable
          && nextSymmetry.enabled === true
          && geometries.length <= 4;
        const requestedOffsetX = Number.isFinite(Number(nextSymmetry.offset_x))
          ? Math.round(Number(nextSymmetry.offset_x))
          : 0;
        const requestedOffsetY = Number.isFinite(Number(nextSymmetry.offset_y))
          ? Math.round(Number(nextSymmetry.offset_y))
          : 0;
        setSymmetryAxes(
          (canvasWidth / 2) + requestedOffsetX,
          (canvasHeight / 2) + requestedOffsetY,
        );
      }

      const derivedColumn = columnInfo(geometries);
      if (columnAvailable) {
        columnEnabled = nextColumn
          ? nextColumn.enabled === true
          : derivedColumn.enabled;
        columnGap = nextColumn && Number.isFinite(Number(nextColumn.gap))
          ? Math.max(0, Math.round(Number(nextColumn.gap)))
          : derivedColumn.gap;
      } else {
        columnEnabled = false;
      }
      if (symmetryEnabled) {
        columnEnabled = false;
      }

      let symmetryWasDisabled = false;

      mutateLayout(() => {
        const slots = getSlots();

        slots.slice(geometries.length).forEach(slot => canvas.remove(slot));
        geometries.forEach((geometry, index) => {
          const existing = slots[index];

          if (existing) {
            existing.photoIndex = index;
            existing.photoAspectRatio = aspectRatioId;
            setSlotGeometry(existing, geometry);
          } else {
            canvas.add(createSlot(geometry, index));
          }
        });

        if (symmetryEnabled && geometries.length > 4) {
          symmetryEnabled = false;
          symmetryWasDisabled = true;
          stampSymmetryState();
          stampColumnState();
        } else if (symmetryEnabled) {
          if (!nextSymmetry) {
            deriveSymmetryAxes(getSlots().map(slotGeometry));
          }
          applySymmetryGeometry();
          stampColumnState();
        } else if (columnEnabled) {
          applyColumnGeometry();
          stampSymmetryState();
        } else {
          stampSymmetryState();
          stampColumnState();
        }
      }, recordHistory);
      showError(symmetryWasDisabled
        ? (isRussian
          ? 'Симметрия выключена: одна пара осей поддерживает до 4 фотослотов.'
          : 'Symmetry was disabled: one pair of axes supports up to 4 photo slots.')
        : null);
      renderSlotCards();
    };

    const applyPreset = (preset, recordHistory = true) => {
      const presetAspectRatio = preset.aspectRatio || matchingAspectRatio(
        preset.slots[0].width,
        preset.slots[0].height,
      );
      applyGeometries(preset.slots, recordHistory, presetAspectRatio);
    };

    const autoGrid = count => {
      const matchingPreset = config.presets.find(preset => {
        const presetAspectRatio = preset.aspectRatio || matchingAspectRatio(
          preset.slots[0].width,
          preset.slots[0].height,
        );
        return presetSupportsProfile(preset)
          && preset.slots.length === count
          && presetAspectRatio === aspectRatioId;
      });

      if (matchingPreset) {
        return matchingPreset.slots;
      }

      const bounds = {
        left: canvas.printTrim?.left || 0,
        top: canvas.printTrim?.top || 0,
        right: canvas.printTrim?.right || 0,
        bottom: canvas.printTrim?.bottom || 0,
      };
      const gap = Math.round(Math.min(canvasWidth, canvasHeight) * 0.02);
      const firstSlot = getSlots()[0];
      const aspectRatio = aspectRatioValue()
        || (firstSlot
          ? slotGeometry(firstSlot).width / slotGeometry(firstSlot).height
          : defaultGeometry.width / defaultGeometry.height);
      const availableWidth = canvasWidth - bounds.left - bounds.right;
      const availableHeight = canvasHeight - bounds.top - bounds.bottom;
      const columns = Math.min(
        count,
        Math.max(1, Math.ceil(Math.sqrt(count * availableWidth / availableHeight))),
      );
      const rows = Math.ceil(count / columns);
      const cellWidth = (availableWidth - (gap * (columns - 1))) / columns;
      const cellHeight = (availableHeight - (gap * (rows - 1))) / rows;
      const width = Math.floor(Math.min(cellWidth, cellHeight * aspectRatio));
      const height = Math.floor(width / aspectRatio);

      return Array.from({ length: count }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        return {
          x: Math.round(bounds.left + (column * (cellWidth + gap)) + ((cellWidth - width) / 2)),
          y: Math.round(bounds.top + (row * (cellHeight + gap)) + ((cellHeight - height) / 2)),
          width,
          height,
        };
      });
    };

    const setLayoutUnlocked = (unlocked, keepPanel = true) => {
      layoutUnlocked = unlocked === true && slotsVisible;
      countInput.max = symmetryEnabled ? Math.min(4, maxPhotos) : maxPhotos;
      countInput.readOnly = !layoutUnlocked;
      commonWidthInput.readOnly = !layoutUnlocked;
      commonHeightInput.readOnly = !layoutUnlocked;
      aspectRatioSelect.disabled = !layoutUnlocked;
      lockButton.disabled = !slotsVisible;
      lockButton.classList.toggle('active', layoutUnlocked);
      lockButton.setAttribute('aria-pressed', String(layoutUnlocked));
      lockButtonTitle.textContent = layoutUnlocked
        ? (isRussian ? 'Завершить редактирование' : 'Finish editing')
        : (isRussian ? 'Редактировать расположение' : 'Edit photo layout');
      lockHelp.textContent = !slotsVisible
        ? (isRussian
          ? 'Сначала включите показ фотослотов.'
          : 'Show the photo slots before editing them.')
        : (layoutUnlocked
          ? (isRussian
            ? (symmetryEnabled || columnEnabled
              ? 'Двигайте и растягивайте фото 1 — остальные следуют за ним.'
              : 'Слоты можно двигать и растягивать прямо на холсте.')
            : (symmetryEnabled || columnEnabled
              ? 'Move and resize photo 1; the others follow it.'
              : 'Slots can now be moved and resized directly on the canvas.'))
          : (isRussian
            ? 'Включите режим, чтобы менять расположение, размеры и оси.'
            : 'Enable edit mode to change positions, sizes and axes.'));
      setSlotsLocked();

      if (!layoutUnlocked && canvas.getActiveObject()?.kind === SLOT_KIND) {
        canvas.discardActiveObject();
        if (keepPanel) {
          panel.classList.add('visible');
          $(`${_self.containerSelector} #toolbar button`).removeClass('active');
          $(`${_self.containerSelector} #toolbar #photo-layout`).addClass('active');
          _self.activeTool = 'photo-layout';
        }
      }

      canvas.requestRenderAll();
      renderSlotCards();
    };

    const applyAspectRatio = (nextId, recordHistory = true) => {
      if (
        nextId === aspectRatioId
        || !ASPECT_RATIOS.some(option => option.id === nextId)
      ) {
        return;
      }

      aspectRatioId = nextId;
      mutateLayout(() => {
        const slots = getSlots();
        slots.forEach(slot => {
          slot.photoAspectRatio = aspectRatioId;
        });

        if (symmetryEnabled) {
          applySymmetryGeometry(
            fitGeometryToAspectRatio(slotGeometry(slots[0]), 'width'),
          );
        } else if (columnEnabled) {
          applyColumnGeometry(
            fitGeometryToAspectRatio(slotGeometry(slots[0]), 'width'),
          );
        } else {
          slots.forEach(slot => {
            setSlotGeometry(
              slot,
              fitGeometryToAspectRatio(slotGeometry(slot), 'width'),
            );
          });
        }
      }, recordHistory);
      showError(null);
      renderSlotCards();
    };

    const setSlotsVisible = (visible, notify = true) => {
      slotsVisible = visible !== false;
      visibilityInput.checked = slotsVisible;
      setLayoutUnlocked(slotsVisible && layoutUnlocked);

      if (notify) {
        canvas.fire('photo-layout:view');
      }
    };

    _self.getPhotoLayoutViewState = () => ({
      visible: slotsVisible,
      axesVisible: symmetryAxesVisible,
      editing: layoutUnlocked,
    });
    _self.setPhotoLayoutViewState = state => {
      if (typeof state?.visible === 'boolean') {
        setSlotsVisible(state.visible, false);
      }
      if (typeof state?.axesVisible === 'boolean') {
        symmetryAxesVisible = state.axesVisible;
        symmetryAxesVisibilityInput.checked = symmetryAxesVisible;
        renderSymmetryControls();
      }
      setLayoutUnlocked(state?.editing === true);
    };

    const applyCommonSize = (property, recordHistory = false) => {
      const input = property === 'width' ? commonWidthInput : commonHeightInput;
      const value = Number(input.value);
      const maximum = property === 'width' ? canvasWidth : canvasHeight;

      if (
        !Number.isInteger(value)
        || value < MIN_SLOT_SIZE
        || value > maximum
      ) {
        return false;
      }

      const slots = getSlots();

      if (symmetryEnabled) {
        const masterGeometry = slotGeometry(slots[0]);
        applySymmetryGeometry(fitGeometryToAspectRatio(
          { ...masterGeometry, [property]: value },
          property,
        ));
      } else if (columnEnabled) {
        const masterGeometry = slotGeometry(slots[0]);
        applyColumnGeometry(fitGeometryToAspectRatio(
          { ...masterGeometry, [property]: value },
          property,
        ));
      } else {
        slots.forEach(slot => {
          const geometry = slotGeometry(slot);
          setSlotGeometry(slot, fitGeometryToAspectRatio(
            { ...geometry, [property]: value },
            property,
          ));
        });
      }
      canvas.requestRenderAll();
      canvas.fire(recordHistory ? 'object:modified' : 'photo-layout:modified', {
        target: slots[0],
      });
      slots.forEach(updateSlotCardValues);
      renderCommonSize(slots);
      renderSymmetryControls();
      renderColumnControls();
      renderMeasurements();
      showError(null);
      renderPresetState();
      return true;
    };

    const applySlotCard = (card, changedProperty, recordHistory = false) => {
      const slot = getSlots().find(
        item => item.photoIndex === Number(card.dataset.photoIndex),
      );

      if (!slot) {
        return false;
      }
      if ((symmetryEnabled || columnEnabled) && slot.photoIndex !== 0) {
        return false;
      }

      const values = {};
      card.querySelectorAll('[data-slot-property]').forEach(input => {
        values[input.dataset.slotProperty] = Number(input.value);
      });

      if (changedProperty === 'width' || changedProperty === 'height') {
        if (
          !Number.isInteger(values[changedProperty])
          || values[changedProperty] < MIN_SLOT_SIZE
        ) {
          card.classList.add('invalid');
          return false;
        }
        Object.assign(
          values,
          fitGeometryToAspectRatio(values, changedProperty),
        );
      }

      if (
        !['x', 'y', 'width', 'height'].every(property => Number.isInteger(values[property]))
        || values.x < 0
        || values.y < 0
        || values.width < MIN_SLOT_SIZE
        || values.height < MIN_SLOT_SIZE
        || values.x + values.width > canvasWidth
        || values.y + values.height > canvasHeight
      ) {
        card.classList.add('invalid');
        return false;
      }

      card.classList.remove('invalid');
      setSlotGeometry(slot, values);
      if (symmetryEnabled) {
        applySymmetryGeometry(slotGeometry(slot));
        getSlots().forEach(updateSlotCardValues);
      } else if (columnEnabled) {
        applyColumnGeometry(slotGeometry(slot));
        getSlots().forEach(updateSlotCardValues);
      } else {
        updateSlotCardValues(slot);
      }
      canvas.requestRenderAll();
      canvas.fire(recordHistory ? 'object:modified' : 'photo-layout:modified', {
        target: slot,
      });
      renderCommonSize(getSlots());
      renderSymmetryControls();
      renderColumnControls();
      renderMeasurements();
      renderPresetState();
      return true;
    };

    const replaceSlot = (slot, previewType, image = null, fileName = null) => {
      const geometry = slotGeometry(slot);
      const index = slot.photoIndex;

      mutateLayout(() => {
        canvas.remove(slot);
        const replacement = createSlot(
          geometry,
          index,
          previewType,
          image,
          fileName,
        );
        canvas.add(replacement);
        if (layoutUnlocked && (!(symmetryEnabled || columnEnabled) || index === 0)) {
          canvas.setActiveObject(replacement);
        }
      });
      renderSlotCards();
    };

    const readFileAsDataURL = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

    const loadImage = source => new Promise((resolve, reject) => {
      fabric.Image.fromURL(source, image => {
        if (!image?.width || !image?.height) {
          reject(new Error('Could not decode image'));
          return;
        }
        resolve(image);
      });
    });

    const updateSlotCardValues = slot => {
      const card = slotList.querySelector(`[data-photo-index="${slot.photoIndex}"]`);
      if (!card) {
        return;
      }

      const geometry = slotGeometry(slot);
      card.querySelectorAll('[data-slot-property]').forEach(input => {
        input.value = geometry[input.dataset.slotProperty];
      });
    };

    const renderSymmetryGeometry = () => {
      const slots = getSlots();
      applySymmetryGeometry();
      slots.forEach(updateSlotCardValues);
      renderCommonSize(slots);
      renderPresetState();
      renderSymmetryControls();
      renderMeasurements();
      canvas.requestRenderAll();
    };

    const applySymmetryAxis = (axis, absoluteValue, recordHistory = false) => {
      if (!symmetryEnabled || !layoutUnlocked || !Number.isFinite(absoluteValue)) {
        renderSymmetryControls();
        return false;
      }

      const value = Math.round(constrainedAxisValue(axis, absoluteValue));
      if (axis === 'x') {
        symmetryOffsetX = value - (canvasWidth / 2);
      } else {
        symmetryOffsetY = value - (canvasHeight / 2);
      }

      renderSymmetryGeometry();
      canvas.fire(recordHistory ? 'object:modified' : 'photo-layout:modified', {
        target: getSlots()[0],
      });
      return true;
    };

    const centerSymmetryAxes = () => {
      if (!symmetryEnabled || !layoutUnlocked) {
        return;
      }

      setSymmetryAxes(canvasWidth / 2, canvasHeight / 2);
      renderSymmetryGeometry();
      canvas.fire('object:modified', { target: getSlots()[0] });
    };

    const applyColumnValue = (property, value, recordHistory = false) => {
      const slots = getSlots();
      const master = slots[0] && slotGeometry(slots[0]);

      if (
        !columnEnabled
        || !layoutUnlocked
        || !master
        || !Number.isInteger(value)
      ) {
        renderColumnControls();
        return false;
      }

      const totalHeight = (slots.length * master.height)
        + (Math.max(0, slots.length - 1) * columnGap);
      const limits = {
        x: [0, Math.max(0, canvasWidth - master.width)],
        y: [0, Math.max(0, canvasHeight - totalHeight)],
        gap: [0, maximumColumnGapForHeight(master.height, slots.length, master.y)],
      }[property];
      if (!limits || value < limits[0] || value > limits[1]) {
        renderColumnControls();
        return false;
      }

      if (property === 'gap') {
        columnGap = value;
        applyColumnGeometry(master);
      } else {
        applyColumnGeometry({ ...master, [property]: value });
      }

      getSlots().forEach(updateSlotCardValues);
      renderCommonSize(getSlots());
      renderColumnControls();
      renderMeasurements();
      renderPresetState();
      canvas.requestRenderAll();
      canvas.fire(recordHistory ? 'object:modified' : 'photo-layout:modified', {
        target: getSlots()[0],
      });
      showError(null);
      return true;
    };

    _self.syncPhotoSymmetry = object => {
      if (
        object?.kind !== SLOT_KIND
        || object.photoIndex !== 0
      ) {
        return false;
      }

      if (symmetryEnabled) {
        applySymmetryGeometry(slotGeometry(object));
      } else if (columnEnabled) {
        applyColumnGeometry(slotGeometry(object));
      } else {
        return false;
      }
      getSlots().forEach(updateSlotCardValues);
      renderCommonSize(getSlots());
      renderPresetState();
      renderSymmetryControls();
      renderColumnControls();
      renderMeasurements();
      canvas.requestRenderAll();
      return true;
    };

    _self.getPhotoLayoutState = () => {
      const slots = getSlots();
      const sizes = slots.map(slotGeometry);
      const sameSize = sizes.every(
        item => item.width === sizes[0]?.width && item.height === sizes[0]?.height,
      );

      return {
        preset: activePresetId(),
        aspect_ratio: aspectRatioId,
        symmetry: {
          enabled: symmetryEnabled,
          offset_x: symmetryOffsetX,
          offset_y: symmetryOffsetY,
        },
        column: {
          enabled: columnEnabled,
          gap: columnGap,
        },
        photo_count: slots.length,
        photo_size_px: sameSize && sizes.length
          ? { width: sizes[0].width, height: sizes[0].height }
          : null,
        photos: sizes,
      };
    };

    _self.syncPhotoLayoutMeasurements = renderMeasurements;

    _self.setPhotoLayoutProfile = profile => {
      if (
        !profile
        || !Number.isFinite(Number(profile.width))
        || !Number.isFinite(Number(profile.height))
      ) {
        return false;
      }

      const nextDefault = config.presets.find(
        preset => preset.id === profile.defaultPreset,
      );
      if (!nextDefault) {
        return false;
      }

      canvasWidth = Math.round(Number(profile.width));
      canvasHeight = Math.round(Number(profile.height));
      defaultPreset = nextDefault;
      defaultGeometry = defaultPreset.slots[0];
      activeProfile = profile.id || 'grid';
      symmetryAvailable = profile.symmetry !== false;
      columnAvailable = profile.column === true;
      pairedTrim = profile.pairedTrim ? {
        left: Number(profile.pairedTrim.left) || 0,
        top: Number(profile.pairedTrim.top) || 0,
        right: Number(profile.pairedTrim.right) || 0,
        bottom: Number(profile.pairedTrim.bottom) || 0,
      } : null;

      commonWidthInput.max = canvasWidth;
      commonHeightInput.max = canvasHeight;
      presetButtonElements.forEach(button => {
        const profiles = button.dataset.photoProfiles.split(',');
        button.hidden = !profiles.includes(activeProfile);
      });
      symmetrySection.hidden = !symmetryAvailable;
      if (!symmetryAvailable && symmetryEnabled) {
        symmetryEnabled = false;
        stampSymmetryState();
      }
      columnSection.hidden = !columnAvailable;
      if (!columnAvailable && columnEnabled) {
        columnEnabled = false;
        stampColumnState();
      }
      presetHelp.textContent = profile.help || (isRussian
        ? 'Выберите стартовое расположение фотографий.'
        : 'Choose an initial photo layout.');
      renderSlotCards();
      renderPresetState();
      renderSymmetryControls();
      renderColumnControls();
      renderMeasurements();
      return true;
    };

    _self.resetPhotoLayout = (recordHistory = false) => {
      applyPreset(defaultPreset, recordHistory);
    };

    _self.setPhotoLayoutState = state => {
      const photos = state?.photos;

      if (
        !Array.isArray(photos)
        || photos.length < 1
        || photos.length > maxPhotos
        || photos.some(photo => (
          !photo
          || !['x', 'y', 'width', 'height'].every(
            property => Number.isFinite(Number(photo[property])),
          )
        ))
      ) {
        return false;
      }

      const savedAspectRatio = ASPECT_RATIOS.some(
        option => option.id === state.aspect_ratio,
      )
        ? state.aspect_ratio
        : matchingAspectRatio(photos[0].width, photos[0].height);

      applyGeometries(photos.map(photo => ({
        x: Number(photo.x),
        y: Number(photo.y),
        width: Number(photo.width),
        height: Number(photo.height),
      })), true, savedAspectRatio, {
        enabled: state.symmetry?.enabled === true,
        offset_x: state.symmetry?.offset_x,
        offset_y: state.symmetry?.offset_y,
      }, state.column ? {
        enabled: state.column.enabled === true,
        gap: state.column.gap,
      } : null);
      return true;
    };

    _self.syncPhotoLayout = (ensureDefault = true) => {
      const slots = getSlots();

      if (!slots.length && ensureDefault) {
        applyPreset(defaultPreset, false);
      } else if (slots.length) {
        const savedAspectRatio = slots[0]?.photoAspectRatio;
        aspectRatioId = ASPECT_RATIOS.some(
          option => option.id === savedAspectRatio,
        )
          ? savedAspectRatio
          : matchingAspectRatio(
            slotGeometry(slots[0]).width,
            slotGeometry(slots[0]).height,
          );
        aspectRatioSelect.value = aspectRatioId;
        symmetryEnabled = symmetryAvailable
          && slots.length <= 4
          && slots[0]?.photoSymmetryEnabled === true;
        const savedColumnEnabled = slots[0]?.photoColumnEnabled;
        columnEnabled = columnAvailable
          && !symmetryEnabled
          && (
            savedColumnEnabled === true
            || (savedColumnEnabled == null && columnInfo(slots.map(slotGeometry)).enabled)
          );
        columnGap = Number.isFinite(Number(slots[0]?.photoColumnGap))
          ? Math.max(0, Math.round(Number(slots[0].photoColumnGap)))
          : columnInfo(slots.map(slotGeometry)).gap;
        const savedOffsetX = Number.isFinite(Number(slots[0]?.photoSymmetryOffsetX))
          ? Math.round(Number(slots[0].photoSymmetryOffsetX))
          : 0;
        const savedOffsetY = Number.isFinite(Number(slots[0]?.photoSymmetryOffsetY))
          ? Math.round(Number(slots[0].photoSymmetryOffsetY))
          : 0;
        setSymmetryAxes(
          (canvasWidth / 2) + savedOffsetX,
          (canvasHeight / 2) + savedOffsetY,
        );
        arrangePhotoLayer();
        setSlotsLocked();
        renderSlotCards();
        canvas.requestRenderAll();
      } else {
        symmetryEnabled = false;
        columnEnabled = false;
        columnGap = 0;
        setSymmetryAxes(canvasWidth / 2, canvasHeight / 2);
        renderSlotCards();
      }
    };

    _self.moveObjectLayer = (object, direction) => {
      if (!object || !['forward', 'backward'].includes(direction)) {
        return;
      }

      arrangePhotoLayer();
      const objects = canvas.getObjects();
      const objectIndex = objects.indexOf(object);
      const slots = getSlots();

      if (objectIndex === -1 || !slots.length) {
        canvas[direction === 'forward' ? 'bringForward' : 'sendBackwards'](object);
        return;
      }

      if (object.kind === SLOT_KIND) {
        const position = photoLayerPosition();
        const otherObjectCount = objects.length - slots.length;
        arrangePhotoLayer(clamp(
          position + (direction === 'forward' ? 1 : -1),
          0,
          otherObjectCount,
        ));
      } else {
        const adjacentObject = objects[
          objectIndex + (direction === 'forward' ? 1 : -1)
        ];

        if (adjacentObject?.kind === SLOT_KIND) {
          const slotIndexes = slots.map(slot => objects.indexOf(slot));
          canvas.moveTo(
            object,
            direction === 'forward'
              ? Math.max(...slotIndexes)
              : Math.min(...slotIndexes),
          );
        } else {
          canvas[direction === 'forward' ? 'bringForward' : 'sendBackwards'](object);
        }
      }

      canvas.requestRenderAll();
    };

    presetButtonElements.forEach(button => {
      button.addEventListener('click', () => {
        const preset = config.presets.find(
          item => item.id === button.dataset.photoPreset,
        );
        if (preset) {
          applyPreset(preset);
        }
      });
    });

    lockButton.addEventListener('click', () => {
      setLayoutUnlocked(!layoutUnlocked);
      canvas.fire('photo-layout:view');
    });
    visibilityInput.addEventListener('change', () => {
      setSlotsVisible(visibilityInput.checked);
    });
    symmetryInput.addEventListener('change', () => {
      setSymmetryEnabled(symmetryInput.checked);
    });
    columnInput.addEventListener('change', () => {
      setColumnEnabled(columnInput.checked);
    });
    symmetryAxesVisibilityInput.addEventListener('change', () => {
      symmetryAxesVisible = symmetryAxesVisibilityInput.checked;
      renderSymmetryControls();
      canvas.fire('photo-layout:view');
    });
    symmetryCenterButton.addEventListener('click', centerSymmetryAxes);
    [
      [symmetryOffsetXInput, 'x'],
      [symmetryOffsetYInput, 'y'],
    ].forEach(([input, axis]) => {
      input.addEventListener('input', () => {
        if (input.value.trim() === '') {
          return;
        }
        const center = axis === 'x' ? canvasWidth / 2 : canvasHeight / 2;
        applySymmetryAxis(axis, center + Number(input.value));
      });
      input.addEventListener('change', () => {
        const center = axis === 'x' ? canvasWidth / 2 : canvasHeight / 2;
        if (
          input.value.trim() === ''
          || !applySymmetryAxis(axis, center + Number(input.value), true)
        ) {
          renderSymmetryControls();
        }
      });
    });
    [
      [columnXInput, 'x'],
      [columnYInput, 'y'],
      [columnGapInput, 'gap'],
    ].forEach(([input, property]) => {
      input.addEventListener('input', () => {
        if (input.value.trim() !== '') {
          applyColumnValue(property, Number(input.value));
        }
      });
      input.addEventListener('change', () => {
        if (
          input.value.trim() === ''
          || !applyColumnValue(property, Number(input.value), true)
        ) {
          renderColumnControls();
        }
      });
    });
    aspectRatioSelect.addEventListener('change', () => {
      applyAspectRatio(aspectRatioSelect.value);
    });

    countInput.addEventListener('change', () => {
      const count = Number(countInput.value);
      const allowedMax = symmetryEnabled ? Math.min(4, maxPhotos) : maxPhotos;

      if (!Number.isInteger(count) || count < 1 || count > allowedMax) {
        showError(isRussian
          ? `Количество должно быть от 1 до ${allowedMax}.`
          : `Count must be between 1 and ${allowedMax}.`);
        countInput.value = getSlots().length;
        return;
      }

      if (columnEnabled) {
        const master = slotGeometry(getSlots()[0]);
        const geometries = Array.from({ length: count }, (_, index) => ({
          ...master,
          y: master.y + (index * (master.height + columnGap)),
        }));
        applyGeometries(
          geometries,
          true,
          aspectRatioId,
          null,
          { enabled: true, gap: columnGap },
        );
      } else {
        applyGeometries(autoGrid(count));
      }
    });

    symmetryHandles.forEach(axisElement => {
      let changed = false;

      const moveAxis = event => {
        if (!axisElement.hasPointerCapture(event.pointerId)) {
          return;
        }

        const axis = axisElement.dataset.symmetryAxis;
        const bounds = canvasContainer.getBoundingClientRect();
        const value = axis === 'x'
          ? ((event.clientX - bounds.left) / bounds.width) * canvasWidth
          : ((event.clientY - bounds.top) / bounds.height) * canvasHeight;
        changed = applySymmetryAxis(axis, value) || changed;
      };

      const finishAxisMove = event => {
        if (!axisElement.hasPointerCapture(event.pointerId)) {
          return;
        }

        axisElement.releasePointerCapture(event.pointerId);
        if (changed) {
          canvas.fire('object:modified', { target: getSlots()[0] });
        }
        changed = false;
      };

      axisElement.addEventListener('pointerdown', event => {
        if (!symmetryEnabled || !layoutUnlocked) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        changed = false;
        axisElement.setPointerCapture(event.pointerId);
      });
      axisElement.addEventListener('pointermove', moveAxis);
      axisElement.addEventListener('pointerup', finishAxisMove);
      axisElement.addEventListener('pointercancel', finishAxisMove);
    });

    [
      [commonWidthInput, 'width'],
      [commonHeightInput, 'height'],
    ].forEach(([input, property]) => {
      input.addEventListener('input', () => applyCommonSize(property));
      input.addEventListener('change', () => {
        if (!applyCommonSize(property, true)) {
          showError(isRussian
            ? 'Введите целый размер, который помещается на холсте.'
            : 'Enter an integer size that fits on the canvas.');
          renderCommonSize(getSlots());
        }
      });
    });

    slotList.addEventListener('input', event => {
      const input = event.target.closest('[data-slot-property]');
      if (input && layoutUnlocked) {
        applySlotCard(
          input.closest('.photo-slot-card'),
          input.dataset.slotProperty,
        );
      }
    });

    slotList.addEventListener('change', event => {
      const input = event.target.closest('[data-slot-property]');
      if (input && layoutUnlocked) {
        const card = input.closest('.photo-slot-card');
        if (!applySlotCard(card, input.dataset.slotProperty, true)) {
          renderSlotCards();
        }
      }
    });

    slotList.addEventListener('click', event => {
      const button = event.target.closest('[data-placeholder]');
      if (!button) {
        return;
      }

      const card = button.closest('.photo-slot-card');
      const slot = getSlots().find(
        item => item.photoIndex === Number(card.dataset.photoIndex),
      );
      if (!slot) {
        return;
      }

      if (button.dataset.placeholder === 'image') {
        pendingImageIndex = slot.photoIndex;
        imageInput.click();
      } else if (slot.previewType !== button.dataset.placeholder) {
        replaceSlot(slot, button.dataset.placeholder);
      }
    });

    imageInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      const index = pendingImageIndex;
      pendingImageIndex = null;

      if (!file || index === null) {
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        _self.toast(
          isRussian ? 'Выберите JPG, PNG или WEBP' : 'Choose JPG, PNG or WEBP',
          'Danger',
          3000,
        );
        return;
      }

      try {
        const slot = getSlots().find(item => item.photoIndex === index);
        if (!slot) {
          return;
        }
        const image = await loadImage(await readFileAsDataURL(file));
        replaceSlot(slot, 'image', image, file.name);
      } catch (error) {
        console.error('[template-studio] photo preview error', error);
        _self.toast(
          isRussian ? 'Не удалось прочитать изображение' : 'Could not read image',
          'Danger',
          3000,
        );
      }
    });

    const handleSlotSelection = event => {
      const slot = event.selected?.find(object => object.kind === SLOT_KIND);
      if (!slot) {
        if (layoutUnlocked) {
          setLayoutUnlocked(false, false);
        }
        return;
      }
      if (!layoutUnlocked) {
        return;
      }

      document.querySelectorAll(`${_self.containerSelector} .toolpanel`).forEach(item => {
        item.classList.remove('visible', 'closed');
      });
      panel.classList.add('visible');
      $(`${_self.containerSelector} #toolbar button`).removeClass('active');
      $(`${_self.containerSelector} #toolbar #photo-layout`).addClass('active');
      _self.activeTool = 'photo-layout';
      renderSlotCards();
    };

    canvas.on('selection:created', handleSlotSelection);
    canvas.on('selection:updated', handleSlotSelection);
    canvas.on('selection:cleared', () => {
      if (layoutUnlocked) {
        setLayoutUnlocked(false, false);
      }
      renderSlotCards();
    });
    canvas.on('object:moving', event => {
      if (event.target?.kind === SLOT_KIND) {
        if (!(symmetryEnabled || columnEnabled) || event.target.photoIndex !== 0) {
          setSlotGeometry(event.target, slotGeometry(event.target));
          updateSlotCardValues(event.target);
        } else {
          _self.syncPhotoSymmetry(event.target);
        }
        renderColumnControls();
        renderMeasurements();
      }
    });
    canvas.on('object:scaling', event => {
      if (event.target?.kind === SLOT_KIND) {
        const changedSide = ['mt', 'mb'].includes(event.transform?.corner)
          ? 'height'
          : 'width';
        const geometry = fitGeometryToAspectRatio(
          slotGeometry(event.target),
          changedSide,
        );

        if (symmetryEnabled && event.target.photoIndex === 0) {
          applySymmetryGeometry(geometry);
          getSlots().forEach(updateSlotCardValues);
          renderCommonSize(getSlots());
          renderPresetState();
          renderSymmetryControls();
          canvas.requestRenderAll();
        } else if (columnEnabled && event.target.photoIndex === 0) {
          applyColumnGeometry(geometry);
          getSlots().forEach(updateSlotCardValues);
          renderCommonSize(getSlots());
          renderPresetState();
          renderColumnControls();
          renderMeasurements();
          canvas.requestRenderAll();
        } else {
          setSlotGeometry(event.target, geometry);
          updateSlotCardValues(event.target);
          renderMeasurements();
        }
      }
    });
    canvas.on('object:modified', event => {
      if (!event.target || event.target.kind === SLOT_KIND) {
        renderSlotCards();
      }
    });
    canvas.on('trim:modified', renderMeasurements);
    canvas.on('trim:history', renderMeasurements);
    canvas.on('history:undo', () => _self.syncPhotoLayout(false));
    canvas.on('history:redo', () => _self.syncPhotoLayout(false));

    document.querySelector(`${_self.containerSelector} #toolbar`)
      .addEventListener('click', event => {
        const button = event.target.closest('button');
        if (
          button
          && layoutUnlocked
          && (
            button.id !== 'photo-layout'
            || panel.classList.contains('visible')
          )
        ) {
          setLayoutUnlocked(false, false);
        }
      });

    applyPreset(defaultPreset, false);
    canvas.clearHistory();
    canvas._historySaveAction();
  }

  window.ImageEditor.prototype.initializePhotoLayout = photoLayout;
})();
