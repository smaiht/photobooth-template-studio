(function () {
  'use strict';

  function colorByte(value) {
    return Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, '0');
  }

  function colorToHex(value) {
    const source = typeof value === 'string' ? value.trim().toLowerCase() : '';
    const hex = source.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);

    if (hex) {
      const digits = hex[1].length <= 4
        ? [...hex[1]].map(character => character + character).join('')
        : hex[1];
      return `#${digits}`;
    }

    const color = value && typeof value.toRgb === 'function'
      ? value
      : window.tinycolor?.(value);
    if (
      !color
      || typeof color.toRgb !== 'function'
      || (typeof color.isValid === 'function' && !color.isValid())
    ) {
      return null;
    }

    const rgba = color.toRgb();
    if (![rgba.r, rgba.g, rgba.b].every(Number.isFinite)) return null;

    const alpha = colorByte((Number.isFinite(rgba.a) ? rgba.a : 1) * 255);
    const rgb = `${colorByte(rgba.r)}${colorByte(rgba.g)}${colorByte(rgba.b)}`;
    return `#${rgb}${alpha === 'ff' ? '' : alpha}`;
  }

  function spectrumInputColor(value) {
    const hex = colorToHex(value);
    if (!hex) return value;

    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
      a: hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1,
    };
  }

  window.colorToHex = colorToHex;
  window.spectrumInputColor = spectrumInputColor;

  // Spectrum 2.0.10 uses legacy #aarrggbb. Keep its UI in CSS #rrggbbaa,
  // which is also the format consumed by the photobooth renderer.
  if (window.tinycolor?.prototype) {
    window.tinycolor.prototype.toHex8 = function () {
      const rgba = this.toRgb();
      return `${colorByte(rgba.r)}${colorByte(rgba.g)}${colorByte(rgba.b)}`
        + colorByte((Number.isFinite(rgba.a) ? rgba.a : 1) * 255);
    };
  }

  const prepareSpectrumTextInput = input => {
    const hex = colorToHex(input.value);
    if (hex?.length === 9) {
      input.value = `#${hex.slice(7, 9)}${hex.slice(1, 7)}`;
    }
  };

  document.addEventListener('change', event => {
    if (event.target.matches?.('.sp-container .sp-input')) {
      prepareSpectrumTextInput(event.target);
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches?.('.sp-container .sp-input')) {
      prepareSpectrumTextInput(event.target);
    }
  }, true);
  document.addEventListener('paste', event => {
    if (event.target.matches?.('.sp-container .sp-input')) {
      setTimeout(() => prepareSpectrumTextInput(event.target));
    }
  }, true);

  const PRINT_WIDTH = 3688;
  const PRINT_HEIGHT = 2480;
  const STRIP_WIDTH = PRINT_HEIGHT / 2;
  const STRIP_HEIGHT = PRINT_WIDTH;
  const PRINT_TRIM = {
    left: 40,
    top: 50,
    right: 55,
    bottom: 55,
  };
  const DEFAULT_TRIM_PREVIEW = {
    visible: true,
    mode: 'zones',
    color: '#ff2d55',
    opacity: 75,
  };
  const PHOTO_LAYOUT = {
    defaultPreset: 'grid-2x2',
    maxPhotos: 12,
    presets: [
      {
        id: 'grid-2x2',
        label: '2 × 2',
        profiles: ['grid'],
        aspectRatio: '3:2',
        slots: [
          { x: 312, y: 110, width: 1500, height: 1000 },
          { x: 1862, y: 110, width: 1500, height: 1000 },
          { x: 312, y: 1160, width: 1500, height: 1000 },
          { x: 1862, y: 1160, width: 1500, height: 1000 },
        ],
      },
      {
        id: 'single',
        label: '1 большое',
        profiles: ['grid'],
        aspectRatio: 'free',
        slots: [
          { x: 312, y: 110, width: 3050, height: 2050 },
        ],
      },
      {
        id: 'strips-4',
        label: '4 фото',
        profiles: ['strips'],
        aspectRatio: '3:2',
        slots: [
          { x: 114, y: 129, width: 1068, height: 712 },
          { x: 114, y: 900, width: 1068, height: 712 },
          { x: 114, y: 1671, width: 1068, height: 712 },
          { x: 114, y: 2442, width: 1068, height: 712 },
        ],
      },
    ],
  };
  const LAYOUT_PROFILES = {
    grid: {
      id: 'grid',
      label: 'Грид',
      width: PRINT_WIDTH,
      height: PRINT_HEIGHT,
      defaultPreset: 'grid-2x2',
      symmetry: true,
      column: false,
    },
    strips: {
      id: 'strips',
      label: 'Стрипсы',
      width: STRIP_WIDTH,
      height: STRIP_HEIGHT,
      defaultPreset: 'strips-4',
      symmetry: false,
      column: true,
    },
  };
  const DEFAULT_LAYOUT_LABELS = {
    grid: 'Открытка',
    strips: '2 полоски',
  };
  const DRAFT_KEY = 'current-project-v3';
  const BACKGROUND_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);
  const FONT_FILE_PATTERN = /\.(?:ttf|otf)$/i;
  const GOOGLE_FONTS_RAW = 'https://raw.githubusercontent.com/google/fonts/main';
  const BUNDLED_FONTS = [
    {
      family: 'Comfortaa',
      label: 'Comfortaa',
      fileName: 'Comfortaa-VariableFont_wght.ttf',
      fontStyle: 'normal',
      weightMin: 300,
      weightMax: 700,
    },
    {
      family: 'Great Vibes',
      label: 'Great Vibes',
      fileName: 'GreatVibes-Regular.ttf',
      fontStyle: 'normal',
      weightMin: 400,
      weightMax: 400,
    },
    {
      family: 'Shantell Sans',
      label: 'Shantell Sans',
      fileName: 'ShantellSans-VariableFont_BNCE,INFM,SPAC,wght.ttf',
      fontStyle: 'normal',
      weightMin: 300,
      weightMax: 800,
    },
    {
      family: 'Shantell Sans',
      label: 'Shantell Sans',
      fileName: 'ShantellSans-Italic-VariableFont_BNCE,INFM,SPAC,wght.ttf',
      fontStyle: 'italic',
      weightMin: 300,
      weightMax: 800,
    },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadFabricImage(source) {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(source, image => {
        if (
          !image ||
          !Number.isFinite(image.width) ||
          !Number.isFinite(image.height) ||
          image.width < 1 ||
          image.height < 1
        ) {
          reject(new Error('Could not decode background image'));
          return;
        }
        resolve(image);
      });
    });
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  function dataURLToBytes(dataURL) {
    const separator = dataURL.indexOf(',');
    const header = dataURL.slice(0, separator);
    const body = dataURL.slice(separator + 1);
    const binary = /;base64/i.test(header) ? atob(body) : decodeURIComponent(body);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function crc32(bytes) {
    if (!crc32.table) {
      crc32.table = new Uint32Array(256);
      for (let value = 0; value < 256; value += 1) {
        let entry = value;
        for (let bit = 0; bit < 8; bit += 1) {
          entry = (entry >>> 1) ^ (entry & 1 ? 0xedb88320 : 0);
        }
        crc32.table[value] = entry >>> 0;
      }
    }

    let crc = 0xffffffff;

    for (const byte of bytes) {
      crc = crc32.table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function zipFiles(files) {
    const encoder = new TextEncoder();
    const now = new Date();
    const year = Math.max(1980, now.getFullYear());
    const dosTime = (now.getHours() << 11)
      | (now.getMinutes() << 5)
      | Math.floor(now.getSeconds() / 2);
    const dosDate = ((year - 1980) << 9)
      | ((now.getMonth() + 1) << 5)
      | now.getDate();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach(file => {
      const name = encoder.encode(file.name);
      const data = file.data instanceof Uint8Array
        ? file.data
        : new Uint8Array(file.data);
      const checksum = crc32(data);
      const local = new Uint8Array(30 + name.length + data.length);
      const localView = new DataView(local.buffer);

      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, dosTime, true);
      localView.setUint16(12, dosDate, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, name.length, true);
      local.set(name, 30);
      local.set(data, 30 + name.length);
      localParts.push(local);

      const central = new Uint8Array(46 + name.length);
      const centralView = new DataView(central.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, dosTime, true);
      centralView.setUint16(14, dosDate, true);
      centralView.setUint32(16, checksum, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, name.length, true);
      centralView.setUint32(42, offset, true);
      central.set(name, 46);
      centralParts.push(central);
      offset += local.length;
    });

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, offset, true);

    return new Blob([...localParts, ...centralParts, end], {
      type: 'application/zip',
    });
  }

  function mimeTypeForName(name) {
    const extension = name.split('.').pop()?.toLowerCase();
    return {
      json: 'application/json',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      ttf: 'font/ttf',
      otf: 'font/otf',
    }[extension] || 'application/octet-stream';
  }

  function normalizedArchivePath(path) {
    const normalized = String(path || '').replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalized || normalized.split('/').some(part => part === '..')) {
      throw new Error('Invalid file path in template package');
    }
    return normalized;
  }

  async function inflateRaw(bytes) {
    if (!globalThis.DecompressionStream) {
      throw new Error('This browser cannot unpack compressed ZIP files');
    }
    const stream = new Blob([bytes]).stream().pipeThrough(
      new DecompressionStream('deflate-raw'),
    );
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzipFiles(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const minimumEnd = Math.max(0, bytes.length - 65557);
    let endOffset = -1;

    for (let offset = bytes.length - 22; offset >= minimumEnd; offset -= 1) {
      if (view.getUint32(offset, true) === 0x06054b50) {
        endOffset = offset;
        break;
      }
    }
    if (endOffset === -1) {
      throw new Error('ZIP central directory was not found');
    }

    const entryCount = view.getUint16(endOffset + 10, true);
    let offset = view.getUint32(endOffset + 16, true);
    const decoder = new TextDecoder('utf-8');
    const files = new Map();

    for (let index = 0; index < entryCount; index += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) {
        throw new Error('ZIP central directory is damaged');
      }
      const flags = view.getUint16(offset + 8, true);
      const method = view.getUint16(offset + 10, true);
      const checksum = view.getUint32(offset + 16, true);
      const compressedSize = view.getUint32(offset + 20, true);
      const unpackedSize = view.getUint32(offset + 24, true);
      const nameLength = view.getUint16(offset + 28, true);
      const extraLength = view.getUint16(offset + 30, true);
      const commentLength = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = normalizedArchivePath(decoder.decode(
        bytes.subarray(offset + 46, offset + 46 + nameLength),
      ));

      offset += 46 + nameLength + extraLength + commentLength;
      if (name.endsWith('/')) continue;
      if (flags & 1) throw new Error('Encrypted ZIP files are not supported');
      if (![0, 8].includes(method)) {
        throw new Error(`ZIP compression method ${method} is not supported`);
      }
      if (view.getUint32(localOffset, true) !== 0x04034b50) {
        throw new Error(`ZIP entry is damaged: ${name}`);
      }
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.subarray(dataOffset, dataOffset + compressedSize);
      const data = method === 0 ? new Uint8Array(compressed) : await inflateRaw(compressed);

      if (data.length !== unpackedSize || crc32(data) !== checksum) {
        throw new Error(`ZIP entry is damaged: ${name}`);
      }
      files.set(name, data);
    }
    return files;
  }

  function folderFiles(fileList) {
    const files = new Map();
    [...fileList].forEach(file => {
      const path = normalizedArchivePath(file.webkitRelativePath || file.name);
      files.set(path, file);
    });
    return files;
  }

  async function packageFileBytes(value) {
    return value instanceof Uint8Array
      ? value
      : new Uint8Array(await value.arrayBuffer());
  }

  async function packageFile(value, name) {
    if (value instanceof File) return value;
    return new File([value], name, { type: mimeTypeForName(name) });
  }

  function downloadBlob(blob, fileName) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function start() {
    const buttons = [
      'select',
      'text',
      'photo-layout',
      'trim',
      'background',
      'upload-image',
      'export-template',
      'create-tools',
      'download-image',
      'animation',
      'undo',
      'redo',
      'clear',
      'fullscreen',
    ];
    const translate = (russian, english) => (
      window.lang === 'ru' ? russian : english
    );
    const backgroundInput = document.createElement('input');
    const fontInput = document.createElement('input');
    const fontAssets = new Map();
    const onlineFontAssetLoads = new Map();
    const textTypes = new Set(['i-text']);
    const backgroundState = {
      fileName: null,
      fileSize: null,
      sourceWidth: null,
      sourceHeight: null,
      fitMode: 'cover',
    };
    const layoutDocuments = {
      grid: null,
      strips: null,
    };
    const layoutLabels = { ...DEFAULT_LAYOUT_LABELS };
    let activeLayout = 'grid';
    let pendingBackgroundLayout = null;
    let activeBackgroundFillState = null;
    let mirrorSecondStrip = true;
    let projectTrim = { ...PRINT_TRIM };
    let projectName = 'template';
    let isSwitchingLayout = false;
    let isRestoringDraft = true;
    let draftSaveTimer = null;
    let draftSaveQueue = Promise.resolve();
    let draftSaveErrorShown = false;
    let importBusy = false;

    backgroundInput.id = 'background-file-input';
    backgroundInput.type = 'file';
    backgroundInput.accept = 'image/jpeg,image/png,image/webp';
    backgroundInput.hidden = true;
    document.body.appendChild(backgroundInput);

    fontInput.id = 'template-font-file-input';
    fontInput.type = 'file';
    fontInput.accept = '.ttf,.otf,font/ttf,font/otf';
    fontInput.hidden = true;
    document.body.appendChild(fontInput);

    const imgEditor = new ImageEditor('#image-editor-container', {
      buttons,
      shapes: [],
      images: [],
      dimensions: {
        width: PRINT_WIDTH,
        height: PRINT_HEIGHT,
      },
      trim: PRINT_TRIM,
      photoLayout: PHOTO_LAYOUT,
      templates: [],
      canvasSizeBlock: true,
    });

    const layoutTabs = [...document.querySelectorAll('[data-layout-tab]')];
    const canvasLayoutName = document.querySelector('#canvas-layout-name');
    const canvasLayoutSize = document.querySelector('#canvas-layout-size');
    const canvasContainer = imgEditor.canvas.upperCanvasEl.parentElement;
    const canvasContent = canvasContainer.parentElement;

    canvasContent.insertAdjacentHTML('beforeend', `
      <div class="strip-pair-divider" hidden aria-hidden="true"></div>
      <div class="strip-copy-preview" id="strip-copy-preview" hidden>
        <canvas id="strip-copy-canvas"></canvas>
        <div class="trim-preview-overlay strip-copy-trim-overlay" hidden>
          <span class="trim-preview-zone trim-preview-left"></span>
          <span class="trim-preview-zone trim-preview-top"></span>
          <span class="trim-preview-zone trim-preview-right"></span>
          <span class="trim-preview-zone trim-preview-bottom"></span>
          <span class="trim-visible-frame"></span>
        </div>
      </div>
    `);

    const stripPairDivider = canvasContent.querySelector('.strip-pair-divider');
    const stripCopyPreview = canvasContent.querySelector('#strip-copy-preview');
    const stripCopyTrimOverlay = stripCopyPreview.querySelector('.strip-copy-trim-overlay');
    const stripCopyCanvas = new fabric.StaticCanvas('strip-copy-canvas', {
      enableRetinaScaling: imgEditor.canvas.enableRetinaScaling,
      renderOnAddRemove: false,
      selection: false,
      skipOffscreen: false,
    });

    function setTrimCSS(element, trim) {
      element.style.setProperty('--trim-left', `${(trim.left / STRIP_WIDTH) * 100}%`);
      element.style.setProperty('--trim-top', `${(trim.top / STRIP_HEIGHT) * 100}%`);
      element.style.setProperty('--trim-right', `${(trim.right / STRIP_WIDTH) * 100}%`);
      element.style.setProperty('--trim-bottom', `${(trim.bottom / STRIP_HEIGHT) * 100}%`);
    }

    function rightStripTrim(trim = projectTrim) {
      return {
        left: 0,
        top: trim.left,
        right: trim.top,
        bottom: trim.right,
      };
    }

    function syncStripPairTrim() {
      const state = imgEditor.getTrimPreviewState();
      const showZones = activeLayout === 'strips' && state.visible && state.mode === 'zones';
      const showCut = activeLayout === 'strips' && state.visible && state.mode === 'cut';

      setTrimCSS(stripCopyPreview, rightStripTrim());
      stripCopyTrimOverlay.hidden = !showZones;
      stripCopyTrimOverlay.style.setProperty('--trim-color', state.color);
      stripCopyTrimOverlay.style.setProperty('--trim-opacity', state.opacity / 100);
      stripCopyPreview.classList.toggle('trim-cut-preview', showCut);
    }

    function renderStripCopy() {
      if (activeLayout !== 'strips' || stripCopyPreview.hidden) return;

      const sourceCanvas = imgEditor.canvas;
      const zoom = sourceCanvas.getZoom();
      const width = sourceCanvas.getWidth();
      const height = sourceCanvas.getHeight();
      stripCopyPreview.style.width = `${width}px`;
      stripCopyPreview.style.height = `${height}px`;

      if (stripCopyCanvas.getWidth() !== width || stripCopyCanvas.getHeight() !== height) {
        stripCopyCanvas.setDimensions({ width, height });
      }
      stripCopyCanvas.cancelRequestedRender();
      stripCopyCanvas.viewportTransform = [zoom, 0, 0, zoom, 0, 0];
      stripCopyCanvas.backgroundColor = sourceCanvas.backgroundColor;
      stripCopyCanvas.backgroundImage = sourceCanvas.backgroundImage;
      const sourceObjects = sourceCanvas.getObjects();
      const objectStates = sourceObjects.map(object => ({
        object,
        left: object.left,
        originX: object.originX,
        angle: object.angle,
        skewX: object.skewX,
        textAlign: object.textAlign,
      }));
      const backgroundImage = sourceCanvas.backgroundImage;
      const backgroundFlipX = backgroundImage?.flipX;
      try {
        if (mirrorSecondStrip && backgroundImage) {
          backgroundImage.set('flipX', !backgroundFlipX);
        }
        objectStates.forEach(({ object, left, originX, angle, skewX, textAlign }) => {
          object.set({
            left: sourceCanvas.originalW - (Number(left) || 0),
            originX: originX === 'left' ? 'right' : (originX === 'right' ? 'left' : originX),
            angle: -(Number(angle) || 0),
            skewX: -(Number(skewX) || 0),
            ...(isTextObject(object) ? { textAlign: swappedAlign(textAlign) } : {}),
          });
        });
        stripCopyCanvas.renderCanvas(stripCopyCanvas.contextContainer, sourceObjects);
      } finally {
        if (mirrorSecondStrip && backgroundImage) {
          backgroundImage.set('flipX', backgroundFlipX);
        }
        objectStates.forEach(({ object, left, originX, angle, skewX, textAlign }) => {
          object.set({
            left,
            originX,
            angle,
            skewX,
            ...(isTextObject(object) ? { textAlign } : {}),
          });
        });
      }
      stripCopyCanvas.cancelRequestedRender();
    }

    function setStripPairVisible(visible) {
      stripPairDivider.hidden = !visible;
      stripCopyPreview.hidden = !visible;
      canvasContent.classList.toggle('strip-pair-active', visible);

      if (visible) {
        syncStripPairTrim();
        renderStripCopy();
      }
    }

    imgEditor.canvas.on('after:render', renderStripCopy);

    function setLayoutTabsDisabled(disabled) {
      layoutTabs.forEach(tab => {
        tab.disabled = disabled;
      });
    }

    LAYOUT_PROFILES.grid.help = translate(
      'Стартовый 2 × 2 точно повторяет текущий grid-конфиг.',
      'The initial 2 × 2 preset matches the current grid config.',
    );
    LAYOUT_PROFILES.strips.help = translate(
      'Меняйте левую полосу. Справа сразу показывается готовая автоматическая копия.',
      'Edit the left strip. The finished automatic copy is shown on the right.',
    );

    const localFontOptions = document.querySelector(
      `${imgEditor.containerSelector} #local-font-options`,
    );
    const onlineFontOptions = [...document.querySelectorAll(
      `${imgEditor.containerSelector} #online-font-options option`,
    )];
    const onlineFontPaths = new Map(
      onlineFontOptions.map(option => [
        option.value,
        option.dataset.googleFontPath
          || `ofl/${option.value.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      ]),
    );
    const onlineFontFamilies = new Set(onlineFontPaths.keys());

    function findFontAsset(family, fileName = null, fontStyle = null) {
      const assets = [...fontAssets.values()];
      const normalizedStyle = fontStyle === 'italic' ? 'italic' : 'normal';
      const byFile = fileName
        ? assets.find(asset => asset.fileName === fileName)
        : null;

      if (
        byFile
        && (!family || byFile.family === family)
        && (
          byFile.fontStyle === normalizedStyle
          || (!byFile.fontStyle && normalizedStyle === 'normal')
        )
      ) {
        return byFile;
      }

      const byFamily = assets.filter(asset => asset.family === family);
      return byFamily.find(asset => asset.fontStyle === normalizedStyle)
        || (normalizedStyle === 'normal'
          ? byFamily.find(asset => !asset.fontStyle)
          : null)
        || null;
    }

    function renderLocalFontOptions() {
      const selectedFamily = document.querySelector(
        `${imgEditor.containerSelector} #font-family`,
      )?.value;

      localFontOptions.replaceChildren();
      const renderedFamilies = new Set();

      [...fontAssets.values()]
        .filter(asset => asset.source !== 'google-fonts')
        .sort((left, right) => left.label.localeCompare(right.label, 'ru'))
        .forEach(asset => {
          if (renderedFamilies.has(asset.family)) return;
          renderedFamilies.add(asset.family);

          const option = document.createElement('option');
          option.value = asset.family;
          option.textContent = asset.source === 'bundled'
            ? `${asset.label} · ${translate('встроенный', 'built-in')}`
            : `${asset.label} · ${asset.fileName}`;
          localFontOptions.appendChild(option);
        });

      if (selectedFamily && findFontAsset(selectedFamily)) {
        document.querySelector(`${imgEditor.containerSelector} #font-family`).value = selectedFamily;
      }
      renderExportSummary();
    }

    async function installFontAsset(asset) {
      if (!window.FontFace || !document.fonts) {
        throw new Error(translate(
          'Этот браузер не поддерживает локальные шрифты',
          'This browser does not support local fonts',
        ));
      }

      const descriptors = {};
      if (asset.fontStyle) {
        descriptors.style = asset.fontStyle;
      }
      if (Number.isFinite(asset.weightMin) && Number.isFinite(asset.weightMax)) {
        descriptors.weight = asset.weightMin === asset.weightMax
          ? String(asset.weightMin)
          : `${asset.weightMin} ${asset.weightMax}`;
      }

      const face = new FontFace(
        asset.family,
        `url("${asset.dataURL}")`,
        descriptors,
      );
      await face.load();
      document.fonts.add(face);
      fontAssets.set(asset.fileName, asset);
      renderLocalFontOptions();
      return asset;
    }

    async function installBundledFonts() {
      for (const bundledFont of BUNDLED_FONTS) {
        try {
          const response = await fetch(
            `./assets/fonts/${encodeURIComponent(bundledFont.fileName)}`,
          );
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const downloaded = await response.blob();
          const blob = downloaded.slice(0, downloaded.size, 'font/ttf');
          await installFontAsset({
            ...bundledFont,
            fileSize: blob.size,
            mimeType: 'font/ttf',
            dataURL: await readFileAsDataURL(blob),
            source: 'bundled',
          });
        } catch (error) {
          console.error(
            '[template-studio] could not load bundled font',
            bundledFont.fileName,
            error,
          );
        }
      }
    }

    function metadataValue(block, field) {
      const match = block.match(new RegExp(
        `^\\s*${field}:\\s*(?:"([^"]*)"|([^\\s]+))\\s*$`,
        'm',
      ));
      return match ? (match[1] ?? match[2]) : null;
    }

    function parseGoogleFontMetadata(metadata, fontStyle, fontWeight) {
      const desiredStyle = fontStyle === 'italic' ? 'italic' : 'normal';
      const records = [...metadata.matchAll(/^fonts\s*\{([\s\S]*?)^\}/gm)]
        .map(match => ({
          style: metadataValue(match[1], 'style'),
          weight: Number(metadataValue(match[1], 'weight')) || 400,
          fileName: metadataValue(match[1], 'filename'),
        }))
        .filter(record => record.fileName && FONT_FILE_PATTERN.test(record.fileName));
      const candidates = records.filter(record => record.style === desiredStyle);
      const selected = candidates.find(record => record.fileName.includes('wght'))
        || candidates.sort((left, right) => (
          Math.abs(left.weight - Number(fontWeight || 400))
          - Math.abs(right.weight - Number(fontWeight || 400))
        ))[0];

      if (!selected) {
        throw new Error(`No ${desiredStyle} TTF found`);
      }

      const weightAxis = [...metadata.matchAll(/^axes\s*\{([\s\S]*?)^\}/gm)]
        .map(match => match[1])
        .find(block => metadataValue(block, 'tag') === 'wght');

      return {
        ...selected,
        weightMin: Number(metadataValue(weightAxis || '', 'min_value')) || selected.weight,
        weightMax: Number(metadataValue(weightAxis || '', 'max_value')) || selected.weight,
      };
    }

    function cacheOnlineFont(fontFamily, fontStyle = 'normal', fontWeight = 400) {
      const style = fontStyle === 'italic' ? 'italic' : 'normal';
      const cached = [...fontAssets.values()].find(asset => (
        asset.source === 'google-fonts'
        && asset.family === fontFamily
        && asset.fontStyle === style
      ));

      if (cached) return Promise.resolve(cached);

      const repositoryPath = onlineFontPaths.get(fontFamily);
      if (!repositoryPath) {
        return Promise.reject(new Error(`Unknown online font: ${fontFamily}`));
      }

      const requestKey = `${fontFamily}:${style}`;
      if (onlineFontAssetLoads.has(requestKey)) {
        return onlineFontAssetLoads.get(requestKey);
      }

      const request = (async () => {
        const metadataResponse = await fetch(
          `${GOOGLE_FONTS_RAW}/${repositoryPath}/METADATA.pb`,
        );
        if (!metadataResponse.ok) {
          throw new Error(`Could not load metadata for ${fontFamily}`);
        }

        const metadata = await metadataResponse.text();
        const font = parseGoogleFontMetadata(metadata, style, fontWeight);
        const sourceLicenseName = repositoryPath.startsWith('apache/')
          ? 'LICENSE.txt'
          : 'OFL.txt';
        const [fontResponse, licenseResponse] = await Promise.all([
          fetch(`${GOOGLE_FONTS_RAW}/${repositoryPath}/${encodeURIComponent(font.fileName)}`),
          fetch(`${GOOGLE_FONTS_RAW}/${repositoryPath}/${sourceLicenseName}`),
        ]);
        if (!fontResponse.ok) {
          throw new Error(`Could not download ${font.fileName}`);
        }
        if (!licenseResponse.ok) {
          throw new Error(`Could not download the license for ${fontFamily}`);
        }

        const downloadedFont = await fontResponse.blob();
        if (!downloadedFont.size) {
          throw new Error(`Downloaded font is empty: ${font.fileName}`);
        }
        const blob = downloadedFont.slice(0, downloadedFont.size, 'font/ttf');

        return installFontAsset({
          family: fontFamily,
          label: fontFamily,
          fileName: font.fileName,
          fileSize: blob.size,
          mimeType: 'font/ttf',
          dataURL: await readFileAsDataURL(blob),
          source: 'google-fonts',
          fontStyle: style,
          weightMin: font.weightMin,
          weightMax: font.weightMax,
          licenseFileName: `licenses/${fontFamily.replace(/[^a-z0-9_-]/gi, '-')}-${sourceLicenseName}`,
          licenseText: await licenseResponse.text(),
        });
      })().catch(error => {
        onlineFontAssetLoads.delete(requestKey);
        throw error;
      });

      onlineFontAssetLoads.set(requestKey, request);
      return request;
    }

    async function restoreFontAssets(assets) {
      if (!Array.isArray(assets)) return;

      for (const asset of assets) {
        if (
          !asset
          || typeof asset.family !== 'string'
          || typeof asset.fileName !== 'string'
          || typeof asset.dataURL !== 'string'
          || !FONT_FILE_PATTERN.test(asset.fileName)
        ) {
          continue;
        }

        try {
          await installFontAsset(asset);
        } catch (error) {
          console.error('[template-studio] could not restore font', asset.fileName, error);
        }
      }
    }

    async function restoreOnlineFonts(canvasData) {
      if (!Array.isArray(canvasData?.objects)) return;

      const requests = canvasData.objects
        .filter(object => (
          textTypes.has(object?.type)
          && onlineFontFamilies.has(object.fontFamily)
        ))
        .map(async object => {
          const asset = await cacheOnlineFont(
            object.fontFamily,
            object.fontStyle,
            object.fontWeight,
          );
          object.fontFile = asset.fileName;
        });

      const results = await Promise.allSettled(requests);
      results.forEach(result => {
        if (result.status === 'rejected') {
          console.warn('[template-studio] could not restore online font', result.reason);
        }
      });
    }

    imgEditor.getFontAsset = (family, fontStyle) => (
      findFontAsset(family, null, fontStyle)
    );
    imgEditor.isOnlineFontFamily = family => onlineFontFamilies.has(family);
    imgEditor.getDefaultTextFont = () => (
      [...fontAssets.values()].find(asset => asset.source !== 'google-fonts')
      || fontAssets.values().next().value
      || null
    );
    imgEditor.applyTextFontAsset = (object, asset) => {
      object.set({
        fontFamily: asset.family,
        fontFile: asset.fileName,
        fontStyle: asset.fontStyle || 'normal',
        styles: {},
      });
      imgEditor.refreshTextDimensions(object, asset.family);
    };
    imgEditor.toggleTextItalic = async object => {
      if (!isTextObject(object)) return;

      const fontStyle = object.fontStyle === 'italic' ? 'normal' : 'italic';

      try {
        const asset = onlineFontFamilies.has(object.fontFamily)
          ? await cacheOnlineFont(object.fontFamily, fontStyle, object.fontWeight)
          : findFontAsset(object.fontFamily, null, fontStyle);

        if (!asset) {
          imgEditor.toast(
            translate(
              'Для этого шрифта нет отдельного italic-файла. Загрузите italic TTF/OTF как отдельный шрифт.',
              'This font has no separate italic file. Upload the italic TTF/OTF as a separate font.',
            ),
            'Danger',
            4000,
          );
          return;
        }

        imgEditor.applyTextFontAsset(object, asset);
        imgEditor.canvas.fire('object:property-realy-changed', { target: object });
        if (imgEditor.activeSelection === object) {
          imgEditor.setSelectionValues();
        }
      } catch (error) {
        console.warn('[template-studio] could not load italic font', error);
        imgEditor.toast(
          translate('Не удалось загрузить italic-файл шрифта', 'Could not load the italic font file'),
          'Danger',
          3500,
        );
      }
    };
    imgEditor.cacheOnlineFont = cacheOnlineFont;
    imgEditor.chooseLocalFont = () => fontInput.click();

    imgEditor.setActiveTool('select');

    const backgroundControls = {
      layouts: Object.fromEntries(['grid', 'strips'].map(layout => {
        const section = document.querySelector(
          `[data-background-layout-section="${layout}"]`,
        );
        return [layout, {
          upload: section.querySelector('[data-background-upload-layout]'),
          fileCard: section.querySelector('[data-background-file-card]'),
          fileName: section.querySelector('[data-background-file-name]'),
          fileDetails: section.querySelector('[data-background-file-details]'),
          remove: section.querySelector('[data-background-remove-layout]'),
          fitSettings: section.querySelector('[data-background-fit-settings]'),
          fitButtons: [...section.querySelectorAll('[data-background-fit]')],
        }];
      })),
      mirrorSecondStrip: document.querySelector('#strip-mirror-second'),
    };

    function formatFileSize(bytes) {
      if (!Number.isFinite(bytes)) {
        return '';
      }

      if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} ${translate('КБ', 'KB')}`;
      }

      return `${(bytes / (1024 * 1024)).toFixed(1)} ${translate('МБ', 'MB')}`;
    }

    function cloneBackgroundFillState(state) {
      const source = state || defaultBackgroundFillState();
      return {
        type: source.type === 'gradient' ? 'gradient' : 'color',
        color: /^#[0-9a-f]{6}$/i.test(source.color || '') ? source.color : '#ffffff',
        gradient: {
          type: source.gradient?.type === 'radial' ? 'radial' : 'linear',
          angle: Number(source.gradient?.angle) || 0,
          stops: Array.isArray(source.gradient?.stops) && source.gradient.stops.length
            ? source.gradient.stops.map(stop => ({
              color: stop.color,
              position: Number(stop.position) || 0,
            }))
            : defaultBackgroundFillState().gradient.stops,
        },
      };
    }

    function backgroundImageForLayout(layout) {
      return layout === activeLayout
        ? imgEditor.canvas.backgroundImage
        : layoutDocuments[layout]?.canvas?.backgroundImage;
    }

    function backgroundMetadataForLayout(layout) {
      return layout === activeLayout
        ? backgroundState
        : (layoutDocuments[layout]?.background || emptyBackgroundState());
    }

    function renderBackgroundControls() {
      Object.entries(backgroundControls.layouts).forEach(([layout, controls]) => {
        const image = backgroundImageForLayout(layout);
        const metadata = backgroundMetadataForLayout(layout);
        const hasBackground = Boolean(image);

        controls.upload.classList.toggle('has-background', hasBackground);
        controls.upload.textContent = hasBackground
          ? translate('Заменить фон', 'Replace background')
          : translate('Загрузить фон', 'Upload background');
        controls.fileCard.hidden = !hasBackground;
        controls.fitSettings.hidden = !hasBackground;

        if (!hasBackground) return;

        controls.fileName.textContent = metadata.fileName
          || translate('Фоновое изображение', 'Background image');
        controls.fileDetails.textContent = [
          metadata.sourceWidth && metadata.sourceHeight
            ? `${metadata.sourceWidth} × ${metadata.sourceHeight} px`
            : '',
          formatFileSize(metadata.fileSize),
        ].filter(Boolean).join(' · ');
        controls.fitButtons.forEach(button => {
          const isActive = button.dataset.backgroundFit === (metadata.fitMode || 'cover');
          button.classList.toggle('active', isActive);
          button.setAttribute('aria-pressed', String(isActive));
        });
      });
      backgroundControls.mirrorSecondStrip.checked = mirrorSecondStrip;
    }

    function handleDraftSaveError(error) {
      console.error('[template-studio] could not save local draft', error);

      if (!draftSaveErrorShown) {
        draftSaveErrorShown = true;
        imgEditor.toast(
          translate(
            'Не удалось сохранить локальный черновик',
            'Could not save the local draft',
          ),
          'Danger',
          3500,
        );
      }
    }

    function canvasDraftJSON() {
      return imgEditor.canvas.toJSON([
        'uniqueId',
        'kind',
        'photoIndex',
        'excludeFromExport',
        'excludeFromHistory',
        'assetFileName',
        'assetFileSize',
        'backgroundFitMode',
        'previewType',
        'previewFileName',
        'photoAspectRatio',
        'photoSymmetryEnabled',
        'photoSymmetryOffsetX',
        'photoSymmetryOffsetY',
        'photoColumnEnabled',
        'photoColumnGap',
        'fontFile',
      ]);
    }

    function activeProfile() {
      return LAYOUT_PROFILES[activeLayout];
    }

    function leftStripTrim(trim = projectTrim) {
      return {
        left: trim.bottom,
        top: trim.left,
        right: 0,
        bottom: trim.right,
      };
    }

    function emptyBackgroundState() {
      return {
        fileName: null,
        fileSize: null,
        sourceWidth: null,
        sourceHeight: null,
        fitMode: 'cover',
      };
    }

    function defaultBackgroundFillState() {
      return {
        type: 'color',
        color: '#ffffff',
        gradient: {
          type: 'linear',
          angle: 0,
          stops: [
            { color: '#ffffff', position: 0 },
            { color: '#6d5dfc', position: 100 },
          ],
        },
      };
    }

    function ensureLayoutDocument(layout) {
      if (!layoutDocuments[layout]) {
        layoutDocuments[layout] = {
          canvas: {
            version: fabric.version,
            objects: [],
          },
          backgroundFill: defaultBackgroundFillState(),
          trimPreview: { ...DEFAULT_TRIM_PREVIEW },
          photoLayoutView: {
            visible: true,
            axesVisible: true,
            editing: false,
          },
          background: emptyBackgroundState(),
          historyUndo: [],
          historyRedo: [],
        };
      }
      return layoutDocuments[layout];
    }

    imgEditor.onBackgroundFillChange = (layout, state) => {
      const nextState = cloneBackgroundFillState(state);

      if (layout === activeLayout) {
        activeBackgroundFillState = nextState;
        return false;
      }

      ensureLayoutDocument(layout).backgroundFill = nextState;
      queueDraftSave();
      renderExportSummary();
      return true;
    };

    function setCanvasProfile(layout) {
      const profile = LAYOUT_PROFILES[layout];
      const canvas = imgEditor.canvas;
      const isGrid = layout === 'grid';

      canvas.setZoom(1);
      canvas.originalW = profile.width;
      canvas.originalH = profile.height;
      canvas.setDimensions({ width: profile.width, height: profile.height });
      canvas.calcOffset();
      imgEditor.dimensions = { width: profile.width, height: profile.height };
      imgEditor.setPhotoLayoutProfile(isGrid ? profile : {
        ...profile,
        pairedTrim: rightStripTrim(),
      });

      imgEditor.setTrimContext({
        width: profile.width,
        height: profile.height,
        trim: isGrid ? projectTrim : leftStripTrim(),
        editable: isGrid,
        display: isGrid ? null : {
          width: PRINT_WIDTH,
          height: PRINT_HEIGHT,
          trim: projectTrim,
        },
        note: isGrid
          ? ''
          : translate(
            'Ниже показаны все 4 trim края полного печатного листа. На холсте редактируется левая полоса; внутренняя линия разреза не является trim.',
            'All 4 trim edges below belong to the complete print sheet. The canvas edits the left strip; its inner cut line is not a trim edge.',
          ),
      });
      imgEditor.syncPhotoLayoutMeasurements?.();
      setStripPairVisible(!isGrid);

      canvasLayoutName.textContent = translate(profile.label, profile.id === 'grid' ? 'Grid' : 'Strips');
      canvasLayoutSize.textContent = `${profile.width} × ${profile.height}`;
      layoutTabs.forEach(tab => {
        const selected = tab.dataset.layoutTab === layout;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
      });
    }

    function captureActiveLayout() {
      if (!imgEditor.canvas || isSwitchingLayout) {
        return;
      }

      if (activeLayout === 'grid') {
        const trim = imgEditor.getPrintTrimState();
        projectTrim = {
          left: trim.left,
          top: trim.top,
          right: trim.right,
          bottom: trim.bottom,
        };
      }

      layoutDocuments[activeLayout] = {
        canvas: canvasDraftJSON(),
        backgroundFill: cloneBackgroundFillState(activeBackgroundFillState),
        trimPreview: imgEditor.getTrimPreviewState(),
        photoLayoutView: imgEditor.getPhotoLayoutViewState(),
        background: { ...backgroundState },
        historyUndo: [...(imgEditor.canvas.historyUndo || [])],
        historyRedo: [...(imgEditor.canvas.historyRedo || [])],
      };
    }

    function persistedLayout(documentState) {
      if (!documentState) return null;

      return {
        canvas: documentState.canvas,
        backgroundFill: documentState.backgroundFill,
        trimPreview: documentState.trimPreview,
        photoLayoutView: documentState.photoLayoutView,
        background: documentState.background,
      };
    }

    function clearCanvasDocument() {
      const canvas = imgEditor.canvas;
      canvas.discardActiveObject();
      canvas.clear();
      canvas.setBackgroundColor('#ffffff');
    }

    async function loadLayout(layout) {
      const canvas = imgEditor.canvas;
      const documentState = layoutDocuments[layout];
      const previousHistoryProcessing = canvas.historyProcessing;

      isSwitchingLayout = true;
      canvas.historyProcessing = true;
      activeLayout = layout;
      try {
        setCanvasProfile(layout);
        clearCanvasDocument();

        if (documentState?.canvas) {
          await restoreOnlineFonts(documentState.canvas);
          await loadCanvasJSON(documentState.canvas);
          imgEditor.syncPhotoLayout(true);
          activeBackgroundFillState = cloneBackgroundFillState(documentState.backgroundFill);
          imgEditor.setBackgroundFillState(layout, activeBackgroundFillState);
          imgEditor.setPhotoLayoutViewState({
            ...documentState.photoLayoutView,
            editing: false,
          });
          imgEditor.setTrimPreviewState({
            ...DEFAULT_TRIM_PREVIEW,
            ...documentState.trimPreview,
          });
          Object.assign(backgroundState, emptyBackgroundState(), documentState.background);
        } else {
          activeBackgroundFillState = defaultBackgroundFillState();
          imgEditor.setBackgroundFillState(layout, activeBackgroundFillState);
          imgEditor.resetPhotoLayout(false);
          imgEditor.setPhotoLayoutViewState({
            visible: true,
            axesVisible: true,
            editing: false,
          });
          imgEditor.setTrimPreviewState(DEFAULT_TRIM_PREVIEW);
          Object.assign(backgroundState, emptyBackgroundState());
        }

        imgEditor.activeSelection = null;
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        imgEditor.fitZoom();
        renderBackgroundControls();
        syncStripPairTrim();
        renderStripCopy();
      } finally {
        canvas.historyProcessing = previousHistoryProcessing;
        isSwitchingLayout = false;
      }

      if (documentState?.historyUndo?.length) {
        canvas.historyUndo = [...documentState.historyUndo];
        canvas.historyRedo = [...(documentState.historyRedo || [])];
      } else {
        canvas.clearHistory();
        canvas._historySaveAction();
      }
      captureActiveLayout();
    }

    imgEditor.clearProject = async () => {
      if (isSwitchingLayout) return;
      if (importBusy) {
        imgEditor.toast(
          translate('Дождитесь завершения импорта', 'Wait for the import to finish'),
          'Warning',
          3000,
        );
        return;
      }
      if (!window.confirm(translate(
        'Очистить весь проект? Фоны, тексты и другие объекты будут удалены. Отменить очистку нельзя.',
        'Clear the entire project? Backgrounds, texts and other objects will be removed. This cannot be undone.',
      ))) {
        return;
      }

      const previousRestoringDraft = isRestoringDraft;
      const initialLayout = activeLayout;
      let cleared = false;
      clearTimeout(draftSaveTimer);
      setLayoutTabsDisabled(true);
      isRestoringDraft = true;

      try {
        imgEditor.canvas.projectRevision = (imgEditor.canvas.projectRevision || 0) + 1;
        projectTrim = { ...PRINT_TRIM };
        projectName = 'template';
        mirrorSecondStrip = true;
        pendingBackgroundLayout = null;
        Object.assign(layoutLabels, DEFAULT_LAYOUT_LABELS);
        Object.keys(layoutDocuments).forEach(layout => {
          layoutDocuments[layout] = null;
          imgEditor.setBackgroundFillState(layout, defaultBackgroundFillState(), false);
        });

        backgroundInput.value = '';
        fontInput.value = '';
        [...fontAssets].forEach(([fileName, asset]) => {
          if (asset.source !== 'bundled') {
            fontAssets.delete(fileName);
          }
        });
        onlineFontAssetLoads.clear();
        renderLocalFontOptions();
        importFiles = null;
        importControls.package.value = '';
        importControls.folder.value = '';
        importControls.fontInput.value = '';
        clearMissingImportFonts();
        setImportStatus();
        exportControls.name.value = projectName;
        await loadLayout(initialLayout);
        imgEditor.canvas.historyProcessing = false;

        const unexpectedObjects = imgEditor.canvas.getObjects().filter(
          object => object.kind !== 'photo-slot',
        );
        if (unexpectedObjects.length) {
          imgEditor.canvas.remove(...unexpectedObjects);
        }
        imgEditor.canvas.backgroundImage = null;
        imgEditor.canvas.overlayImage = null;
        Object.assign(backgroundState, emptyBackgroundState());
        imgEditor.canvas.requestRenderAll();
        renderBackgroundControls();
        renderStripCopy();
        imgEditor.canvas.clearHistory();
        imgEditor.canvas._historySaveAction();
        captureActiveLayout();

        const remainingObjects = imgEditor.canvas.getObjects().filter(
          object => object.kind !== 'photo-slot',
        );
        if (remainingObjects.length || imgEditor.canvas.backgroundImage) {
          throw new Error('Canvas still contains project artwork after clear');
        }
        console.info('[template-studio] project canvas cleared', {
          layout: activeLayout,
          revision: imgEditor.canvas.projectRevision,
          objects: imgEditor.canvas.getObjects().map(object => ({
            type: object.type,
            kind: object.kind || null,
          })),
          backgroundImage: Boolean(imgEditor.canvas.backgroundImage),
        });
        imgEditor.setActiveTool('select');
        renderExportSummary();
        cleared = true;
      } catch (error) {
        console.error('[template-studio] could not clear project', error);
        imgEditor.toast(
          translate('Не удалось очистить проект', 'Could not clear the project'),
          'Danger',
          3500,
        );
      } finally {
        isRestoringDraft = previousRestoringDraft;
        setLayoutTabsDisabled(false);
      }

      if (cleared && !isRestoringDraft) {
        await flushDraftSave();
        imgEditor.toast(
          translate('Проект очищен', 'Project cleared'),
          'Success',
        );
      }
    };

    async function switchLayout(layout, saveDraft = true) {
      if (!LAYOUT_PROFILES[layout] || layout === activeLayout || isSwitchingLayout) {
        return;
      }

      captureActiveLayout();
      await loadLayout(layout);
      renderExportSummary();
      if (saveDraft) {
        queueDraftSave();
      }
    }

    async function saveCurrentDraft() {
      if (isRestoringDraft || isSwitchingLayout) {
        return;
      }

      captureActiveLayout();

      await window.saveInBrowser.save(DRAFT_KEY, {
        version: 3,
        savedAt: Date.now(),
        activeLayout,
        projectName,
        mirrorSecondStrip,
        printTrim: projectTrim,
        layoutLabels: { ...layoutLabels },
        layouts: {
          grid: persistedLayout(layoutDocuments.grid),
          strips: persistedLayout(layoutDocuments.strips),
        },
        fonts: [...fontAssets.values()].filter(asset => asset.source !== 'bundled'),
      });
      draftSaveErrorShown = false;
    }

    function queueDraftSave() {
      if (isRestoringDraft || isSwitchingLayout) {
        return;
      }

      clearTimeout(draftSaveTimer);
      draftSaveTimer = setTimeout(() => {
        draftSaveQueue = draftSaveQueue
          .catch(() => {})
          .then(saveCurrentDraft)
          .catch(handleDraftSaveError);
      }, 350);
    }

    function flushDraftSave() {
      clearTimeout(draftSaveTimer);
      draftSaveQueue = draftSaveQueue
        .catch(() => {})
        .then(saveCurrentDraft)
        .catch(handleDraftSaveError);

      return draftSaveQueue;
    }

    function loadCanvasJSON(canvasData) {
      return new Promise((resolve, reject) => {
        try {
          imgEditor.canvas.loadFromJSON(canvasData, () => {
            imgEditor.canvas.getObjects().forEach(object => {
              if (object.type === 'i-text') {
                const align = object.textAlign === 'left' || object.textAlign === 'right'
                  ? object.textAlign
                  : 'center';
                object.set({
                  originX: align,
                  originY: 'center',
                  textAlign: align,
                  paintFirst: 'stroke',
                  strokeUniform: true,
                  centeredRotation: false,
                  styles: {},
                });
                imgEditor.refreshTextDimensions(object);
              }
            });
            imgEditor.canvas.requestRenderAll();
            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    }

    async function restoreDraft() {
      const draft = await window.saveInBrowser.load(DRAFT_KEY);

      if (!draft || draft.version !== 3 || !draft.layouts) {
        return false;
      }

      await restoreFontAssets(draft.fonts);
      mirrorSecondStrip = draft.mirrorSecondStrip !== false;
      projectTrim = { ...PRINT_TRIM, ...draft.printTrim };
      projectName = typeof draft.projectName === 'string' && draft.projectName
        ? draft.projectName
        : 'template';
      for (const layout of Object.keys(layoutLabels)) {
        const label = draft.layoutLabels?.[layout];
        if (typeof label === 'string' && label.trim()) {
          layoutLabels[layout] = label.trim();
        }
      }
      for (const layout of Object.keys(layoutDocuments)) {
        const saved = draft.layouts[layout];
        layoutDocuments[layout] = saved
          ? { ...saved, historyUndo: [], historyRedo: [] }
          : null;
        if (saved) {
          imgEditor.setBackgroundFillState(
            layout,
            cloneBackgroundFillState(saved.backgroundFill),
            false,
          );
        }
      }
      activeLayout = LAYOUT_PROFILES[draft.activeLayout] ? draft.activeLayout : 'grid';
      await loadLayout(activeLayout);

      return true;
    }

    function backgroundFitGeometry(sourceWidth, sourceHeight, fitMode, layout) {
      const { width, height } = LAYOUT_PROFILES[layout];
      const widthScale = width / sourceWidth;
      const heightScale = height / sourceHeight;
      const scaleX = fitMode === 'stretch'
        ? widthScale
        : Math.max(widthScale, heightScale);
      const scaleY = fitMode === 'stretch'
        ? heightScale
        : Math.max(widthScale, heightScale);

      return {
        originX: 'center',
        originY: 'center',
        left: width / 2,
        top: height / 2,
        scaleX,
        scaleY,
        angle: 0,
        selectable: false,
        evented: false,
        backgroundFitMode: fitMode,
      };
    }

    function applyBackgroundFit(image, fitMode, layout = activeLayout) {
      const geometry = backgroundFitGeometry(image.width, image.height, fitMode, layout);
      image.set(geometry);
      image.setCoords();

      return { scaleX: geometry.scaleX, scaleY: geometry.scaleY };
    }

    async function installBackgroundImage(image, metadata, fitMode) {
      const scales = applyBackgroundFit(image, fitMode);

      await new Promise(resolve => {
        imgEditor.canvas.setBackgroundImage(image, resolve);
      });

      Object.assign(backgroundState, {
        fileName: metadata.fileName,
        fileSize: metadata.fileSize || null,
        sourceWidth: image.width,
        sourceHeight: image.height,
        fitMode,
      });

      image.set({
        assetFileName: backgroundState.fileName,
        assetFileSize: backgroundState.fileSize,
      });

      imgEditor.canvas.requestRenderAll();
      imgEditor.fitZoom();
      renderBackgroundControls();
      imgEditor.canvas.fire('background:modified');

      if (!isRestoringDraft) {
        await flushDraftSave();
      }

      console.info('[template-studio] background loaded', {
        sourceSize: [image.width, image.height],
        canvasSize: [activeProfile().width, activeProfile().height],
        fitMode,
        scale: [scales.scaleX, scales.scaleY],
      });
    }

    async function installBackgroundForLayout(image, metadata, fitMode, layout) {
      if (layout === activeLayout) {
        await installBackgroundImage(image, metadata, fitMode);
        return;
      }

      const scales = applyBackgroundFit(image, fitMode, layout);
      image.set({
        assetFileName: metadata.fileName,
        assetFileSize: metadata.fileSize || null,
      });
      const documentState = ensureLayoutDocument(layout);
      documentState.canvas.backgroundImage = image.toObject([
        'assetFileName',
        'assetFileSize',
        'backgroundFitMode',
      ]);
      documentState.background = {
        fileName: metadata.fileName,
        fileSize: metadata.fileSize || null,
        sourceWidth: image.width,
        sourceHeight: image.height,
        fitMode,
      };
      renderBackgroundControls();
      renderExportSummary();
      if (!isRestoringDraft) await flushDraftSave();

      console.info('[template-studio] background loaded', {
        layout,
        sourceSize: [image.width, image.height],
        canvasSize: [LAYOUT_PROFILES[layout].width, LAYOUT_PROFILES[layout].height],
        fitMode,
        scale: [scales.scaleX, scales.scaleY],
      });
    }

    async function setBackgroundSource(
      source,
      asset = {},
      fitMode = 'cover',
      layout = activeLayout,
    ) {
      if (fitMode !== 'cover' && fitMode !== 'stretch') {
        throw new Error(`Unknown background fit mode: ${fitMode}`);
      }
      if (!LAYOUT_PROFILES[layout]) throw new Error(`Unknown layout: ${layout}`);

      const revision = imgEditor.canvas.projectRevision || 0;
      const image = await loadFabricImage(source);
      if ((imgEditor.canvas.projectRevision || 0) !== revision) return false;
      const fileName = asset.name
        || (asset.path ? asset.path.split('/').pop() : null)
        || translate('Фоновое изображение', 'Background image');

      await installBackgroundForLayout(image, {
        fileName,
        fileSize: asset.size || null,
      }, fitMode, layout);

      return true;
    }

    async function setBackgroundFile(file, layout = activeLayout) {
      if (!LAYOUT_PROFILES[layout]) throw new Error(`Unknown layout: ${layout}`);
      const revision = imgEditor.canvas.projectRevision || 0;
      const mimeType = (file.type || '').toLowerCase();
      const hasKnownExtension = /\.(?:jpe?g|png|webp)$/i.test(file.name);
      const isSupported = BACKGROUND_TYPES.has(mimeType) || hasKnownExtension;

      if (!isSupported) {
        throw new Error(translate(
          'Выберите изображение JPG, PNG или WEBP',
          'Choose a JPG, PNG or WEBP image',
        ));
      }

      if (!file.size) {
        throw new Error(translate('Файл пустой', 'The file is empty'));
      }

      const source = await readFileAsDataURL(file);
      let image;

      try {
        image = await loadFabricImage(source);
      } catch {
        throw new Error(translate(
          'Не удалось прочитать изображение',
          'Could not decode the image',
        ));
      }
      if ((imgEditor.canvas.projectRevision || 0) !== revision) return false;

      await installBackgroundForLayout(image, {
        fileName: file.name,
        fileSize: file.size,
      }, 'cover', layout);

      return true;
    }

    function setBackgroundFit(fitMode, layout = activeLayout) {
      const image = backgroundImageForLayout(layout);
      if (!image || !LAYOUT_PROFILES[layout] || !['cover', 'stretch'].includes(fitMode)) {
        return;
      }

      if (layout === activeLayout) {
        applyBackgroundFit(image, fitMode, layout);
        backgroundState.fitMode = fitMode;
        imgEditor.canvas.requestRenderAll();
        renderBackgroundControls();
        imgEditor.canvas.fire('background:modified');
        return;
      }

      Object.assign(
        image,
        backgroundFitGeometry(image.width, image.height, fitMode, layout),
      );
      ensureLayoutDocument(layout).background.fitMode = fitMode;
      renderBackgroundControls();
      renderExportSummary();
      queueDraftSave();
    }

    function removeBackground(layout = activeLayout) {
      if (layout === activeLayout) {
        imgEditor.canvas.setBackgroundImage(null, () => {
          imgEditor.canvas.requestRenderAll();
        });
        Object.assign(backgroundState, emptyBackgroundState());
        imgEditor.canvas.fire('background:modified');
      } else {
        const documentState = ensureLayoutDocument(layout);
        delete documentState.canvas.backgroundImage;
        documentState.background = emptyBackgroundState();
        renderExportSummary();
        queueDraftSave();
      }

      renderBackgroundControls();
      imgEditor.toast(
        translate(
          `Фон ${layout === 'grid' ? 'Grid' : 'Strips'} удалён`,
          `${layout === 'grid' ? 'Grid' : 'Strips'} background removed`,
        ),
        'Success',
      );
    }

    Object.entries(backgroundControls.layouts).forEach(([layout, controls]) => {
      controls.upload.addEventListener('click', () => {
        pendingBackgroundLayout = layout;
        backgroundInput.click();
      });
      controls.remove.addEventListener('click', () => removeBackground(layout));
      controls.fitButtons.forEach(button => {
        button.addEventListener('click', () => {
          setBackgroundFit(button.dataset.backgroundFit, layout);
        });
      });
    });
    backgroundControls.mirrorSecondStrip.addEventListener('change', event => {
      mirrorSecondStrip = event.target.checked;
      renderStripCopy();
      renderExportSummary();
      queueDraftSave();
    });
    renderBackgroundControls();

    const exportControls = {
      name: document.querySelector('#export-template-name'),
      summary: document.querySelector('#template-export-summary'),
      config: document.querySelector('#download-template-config'),
      gridBackground: document.querySelector('#download-template-grid-background'),
      stripBackground: document.querySelector('#download-template-strip-background'),
      package: document.querySelector('#download-template-package'),
      yadiskToken: document.querySelector('#yadisk-template-token'),
      yadiskName: document.querySelector('#yadisk-template-name'),
      yadiskButton: document.querySelector('#export-template-yadisk'),
      yadiskStatus: document.querySelector('#yadisk-template-status'),
    };
    const YADISK_TOKEN_SESSION_KEY = 'template-studio-yadisk-token';
    try {
      exportControls.yadiskToken.value = sessionStorage.getItem(YADISK_TOKEN_SESSION_KEY) || '';
    } catch (_error) {
      // Storage may be unavailable for a restricted file:// or private context.
    }
    exportControls.yadiskToken.addEventListener('input', () => {
      try {
        const token = exportControls.yadiskToken.value;
        if (token) sessionStorage.setItem(YADISK_TOKEN_SESSION_KEY, token);
        else sessionStorage.removeItem(YADISK_TOKEN_SESSION_KEY);
      } catch (_error) {
        // Export still works with the value currently held by the input.
      }
    });

    const importControls = {
      package: document.querySelector('#import-template-package'),
      folder: document.querySelector('#import-template-folder'),
      fonts: document.querySelector('#import-template-fonts'),
      fontInput: document.querySelector('#import-template-font-input'),
      status: document.querySelector('#import-template-status'),
    };
    let importFiles = null;
    let missingImportFonts = [];

    function isTextObject(object) {
      return textTypes.has(object?.type);
    }

    function round(value, digits = 3) {
      const multiplier = 10 ** digits;
      return Math.round(Number(value) * multiplier) / multiplier;
    }

    function normalizedColor(value, fallback = '#000000') {
      return colorToHex(value) || colorToHex(fallback) || '#000000';
    }

    function colorWithOpacity(value, opacity, fallback = '#000000') {
      const color = normalizedColor(value, fallback);
      const base = color.slice(0, 7);
      const sourceAlpha = color.length === 9 ? parseInt(color.slice(7), 16) : 255;
      const alpha = Math.round(sourceAlpha * Math.max(0, Math.min(1, opacity ?? 1)));
      return alpha < 255 ? `${base}${alpha.toString(16).padStart(2, '0')}` : base;
    }

    function numericWeight(value) {
      if (value === 'bold') return 700;
      const number = Number(value);
      return Number.isFinite(number) ? Math.round(number) : 400;
    }

    function templateImportError(russian, english) {
      return new Error(translate(russian, english));
    }

    function setImportStatus(message = '', type = '') {
      importControls.status.hidden = !message;
      importControls.status.textContent = message;
      importControls.status.className = `template-import-status${type ? ` ${type}` : ''}`;
    }

    function clearMissingImportFonts() {
      missingImportFonts = [];
      importControls.fonts.hidden = true;
    }

    function importedColor(value, fallback = '#000000') {
      const color = normalizedColor(value, fallback);
      if (color.length !== 9) return color;

      const red = parseInt(color.slice(1, 3), 16);
      const green = parseInt(color.slice(3, 5), 16);
      const blue = parseInt(color.slice(5, 7), 16);
      const alpha = parseInt(color.slice(7, 9), 16) / 255;
      return `rgba(${red}, ${green}, ${blue}, ${round(alpha)})`;
    }

    function validatedImportedConfig(config) {
      if (
        !Array.isArray(config?.print_size)
        || config.print_size[0] !== PRINT_WIDTH
        || config.print_size[1] !== PRINT_HEIGHT
      ) {
        throw templateImportError(
          `Размер конфига должен быть ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
          `Config size must be ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
        );
      }

      const trim = config.print_trim || PRINT_TRIM;
      if (
        !['left', 'top', 'right', 'bottom'].every(side => (
          Number.isInteger(trim[side]) && trim[side] >= 0
        ))
        || trim.left + trim.right >= PRINT_WIDTH
        || trim.top + trim.bottom >= PRINT_HEIGHT
      ) {
        throw templateImportError('В конфиге некорректная обрезка', 'The config has invalid trim');
      }
      if (!config.templates?.grid || !config.templates?.strips) {
        throw templateImportError(
          'В шаблоне должны быть макеты grid и strips',
          'The template must contain grid and strips layouts',
        );
      }
      return trim;
    }

    function normalizedAngle(value) {
      const angle = ((Number(value) || 0) + 180) % 360;
      return round((angle < 0 ? angle + 360 : angle) - 180);
    }

    function importedTextBlock(block, index, width, height) {
      const position = block?.position;
      if (
        !block
        || typeof block !== 'object'
        || Array.isArray(block)
        || Object.prototype.hasOwnProperty.call(block, 'lines')
        || typeof block.text !== 'string'
        || typeof block.font !== 'string'
        || !FONT_FILE_PATTERN.test(block.font)
        || block.font.includes('/')
        || block.font.includes('\\')
        || !Number.isInteger(block.size)
        || block.size < 4
        || block.size > 2000
        || !Number.isInteger(position?.x)
        || !Number.isInteger(position?.y)
        || position.x < 0
        || position.x > width
        || position.y < 0
        || position.y > height
      ) {
        throw templateImportError(
          `Некорректная подпись №${index + 1}`,
          `Text object ${index + 1} is invalid`,
        );
      }

      const align = ['left', 'center', 'right'].includes(block.align)
        ? block.align
        : 'center';
      return {
        ...block,
        align,
        angle: Number.isFinite(block.angle) ? block.angle : 0,
        skewX: Number.isFinite(block.skew?.x) ? block.skew.x : 0,
        skewY: Number.isFinite(block.skew?.y) ? block.skew.y : 0,
        flipX: block.flip?.x === true,
        flipY: block.flip?.y === true,
        weight: Number.isInteger(block.weight) ? block.weight : 400,
        color: importedColor(block.color),
        strokeWidth: Number.isFinite(block.stroke_width)
          ? Math.max(0, block.stroke_width)
          : 0,
        strokeColor: importedColor(block.stroke_color, block.color || '#000000'),
        lineSpacing: Number.isFinite(block.line_spacing) ? block.line_spacing : 1.2,
        charSpacing: Number.isFinite(block.char_spacing) ? block.char_spacing : 0,
        underline: block.underline === true,
        linethrough: block.linethrough === true,
      };
    }

    function importedGridDefinition(config) {
      const key = 'grid';

      const template = config.templates?.[key];
      const layout = template?.print_layout;
      const defaultSize = template?.photo_size_px;
      if (!template || !layout || typeof layout.background !== 'string') {
        throw templateImportError('В конфиге нет выбранного макета', 'Selected layout is missing');
      }
      if (
        template.photo_choice === true
        || ![undefined, 'none'].includes(template.preview_rotation)
        || ![undefined, 'none'].includes(template.preview_split)
      ) {
        throw templateImportError(
          'Некорректные настройки preview у grid',
          'The grid preview settings are invalid',
        );
      }
      if (
        !Number.isInteger(defaultSize?.width)
        || !Number.isInteger(defaultSize?.height)
        || defaultSize.width < 1
        || defaultSize.height < 1
      ) {
        throw templateImportError(
          'В макете некорректный photo_size_px',
          'The layout has an invalid photo_size_px',
        );
      }
      if (
        !Array.isArray(layout.photos)
        || layout.photos.length < 1
        || layout.photos.length > PHOTO_LAYOUT.maxPhotos
      ) {
        throw templateImportError(
          `В макете должно быть от 1 до ${PHOTO_LAYOUT.maxPhotos} фотослотов`,
          `The layout must contain 1 to ${PHOTO_LAYOUT.maxPhotos} photo slots`,
        );
      }

      const photos = [...layout.photos]
        .sort((left, right) => left.photo_index - right.photo_index)
        .map((photo, index) => {
          const width = photo.width ?? defaultSize.width;
          const height = photo.height ?? defaultSize.height;
          if (
            photo.photo_index !== index
            || photo.rotate !== 'none'
            || ![photo.x, photo.y, width, height].every(Number.isInteger)
            || photo.x < 0
            || photo.y < 0
            || width < 1
            || height < 1
            || photo.x + width > PRINT_WIDTH
            || photo.y + height > PRINT_HEIGHT
          ) {
            throw templateImportError(
              'Пока импортируются только grid/single без поворота и повторяющихся фото',
              'Only non-rotated grid/single layouts without repeated photos can be imported',
            );
          }
          return {
            photo_index: index,
            x: photo.x,
            y: photo.y,
            width,
            height,
          };
        });

      const rawTexts = layout.texts ?? [];
      if (!Array.isArray(rawTexts)) {
        throw templateImportError(
          'Поле texts должно быть списком',
          'The texts field must be an array',
        );
      }

      const texts = rawTexts.map((block, index) => (
        importedTextBlock(block, index, PRINT_WIDTH, PRINT_HEIGHT)
      ));

      return {
        key,
        label: typeof template.label === 'string' && template.label.trim()
          ? template.label.trim()
          : key,
        photos,
        texts,
        background: layout.background,
        foreground: layout.foreground || null,
      };
    }

    function importedStripsDefinition(config) {
      const key = 'strips';
      const template = config.templates?.[key];
      const layout = template?.print_layout;
      const defaultSize = template?.photo_size_px;
      if (!template || !layout || typeof layout.background !== 'string') {
        throw templateImportError('В конфиге нет макета strips', 'The strips layout is missing');
      }
      if (
        template.photo_choice === true
        || template.preview_rotation !== 'cw'
        || template.preview_split !== 'horizontal'
      ) {
        throw templateImportError(
          'Некорректные настройки preview у strips',
          'The strips preview settings are invalid',
        );
      }
      if (
        !Number.isInteger(defaultSize?.width)
        || !Number.isInteger(defaultSize?.height)
        || defaultSize.width < 1
        || defaultSize.height < 1
        || !Array.isArray(layout.photos)
        || !layout.photos.length
      ) {
        throw templateImportError(
          'В strips некорректные размеры или фотослоты',
          'The strips photo size or slots are invalid',
        );
      }

      const leftPhotos = layout.photos.map((photo, index) => {
        const width = photo?.width ?? defaultSize.width;
        const height = photo?.height ?? defaultSize.height;
        if (
          !photo
          || !Number.isInteger(photo.photo_index)
          || photo.photo_index < 0
          || photo.rotate !== 'ccw'
          || ![photo.x, photo.y, width, height].every(Number.isInteger)
          || photo.x < 0
          || photo.y < 0
          || width < 1
          || height < 1
          || photo.x + width > PRINT_WIDTH
          || photo.y + height > PRINT_HEIGHT
        ) {
          throw templateImportError(
            `Некорректный фотослот strips №${index + 1}`,
            `Strips photo slot ${index + 1} is invalid`,
          );
        }

        return {
          photo_index: photo.photo_index,
          x: PRINT_HEIGHT - photo.y - height,
          y: photo.x,
          width: height,
          height: width,
        };
      }).filter(photo => photo.x >= 0 && photo.x + photo.width <= STRIP_WIDTH);

      leftPhotos.sort((left, right) => left.photo_index - right.photo_index);
      if (
        !leftPhotos.length
        || leftPhotos.length > PHOTO_LAYOUT.maxPhotos
        || leftPhotos.some((photo, index) => photo.photo_index !== index)
      ) {
        throw templateImportError(
          'Не удалось найти последовательные фотослоты левой полосы',
          'Could not find consecutive photo slots on the left strip',
        );
      }

      const rawTexts = layout.texts ?? [];
      if (!Array.isArray(rawTexts)) {
        throw templateImportError('Поле texts должно быть списком', 'The texts field must be an array');
      }
      const texts = rawTexts
        .map((block, index) => importedTextBlock(block, index, PRINT_WIDTH, PRINT_HEIGHT))
        .map(block => ({
          ...block,
          position: {
            x: PRINT_HEIGHT - block.position.y,
            y: block.position.x,
          },
          angle: normalizedAngle(block.angle + 90),
        }))
        .filter(block => block.position.x >= 0 && block.position.x <= STRIP_WIDTH);

      return {
        key,
        label: typeof template.label === 'string' && template.label.trim()
          ? template.label.trim()
          : key,
        photos: leftPhotos,
        texts,
        background: layout.background,
        foreground: layout.foreground || null,
        mirrorSecondStrip: template.mirror_second_strip !== false,
      };
    }

    function onlineFamilyForFontFile(fileName) {
      const stem = fileName.replace(FONT_FILE_PATTERN, '');

      return [...onlineFontFamilies]
        .sort((left, right) => right.length - left.length)
        .find(family => {
          const familyPattern = family
            .split(/\s+/)
            .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[ _-]*');
          return new RegExp(`^${familyPattern}(?:[ _\\-\\[]|$)`, 'i').test(stem);
        }) || null;
    }

    async function resolveImportedFonts(texts) {
      const requests = new Map();
      texts.forEach(block => {
        if (!requests.has(block.font)) {
          requests.set(block.font, block.weight);
        }
      });

      const assets = new Map();
      await Promise.all([...requests].map(async ([fileName, weight]) => {
        let asset = fontAssets.get(fileName) || null;
        const onlineFamily = asset ? null : onlineFamilyForFontFile(fileName);

        if (!asset && onlineFamily) {
          try {
            asset = await cacheOnlineFont(
              onlineFamily,
              /italic/i.test(fileName) ? 'italic' : 'normal',
              weight,
            );
          } catch (error) {
            console.warn('[template-studio] online font was not found', fileName, error);
          }
        }
        if (asset) assets.set(fileName, asset);
      }));

      return {
        assets,
        missing: [...requests.keys()].filter(fileName => !assets.has(fileName)),
      };
    }

    function importedTextObject(block, asset) {
      return new fabric.IText(block.text, {
        left: block.position.x,
        top: block.position.y,
        originX: block.align,
        originY: 'center',
        textAlign: block.align,
        angle: block.angle,
        skewX: block.skewX,
        skewY: block.skewY,
        flipX: block.flipX,
        flipY: block.flipY,
        scaleX: 1,
        scaleY: 1,
        fontFamily: asset.family,
        fontFile: asset.fileName,
        fontStyle: asset.fontStyle || 'normal',
        fontSize: block.size,
        fontWeight: block.weight,
        fill: block.color,
        stroke: block.strokeColor,
        strokeWidth: block.strokeWidth * 2,
        lineHeight: block.lineSpacing,
        charSpacing: block.charSpacing,
        underline: block.underline,
        linethrough: block.linethrough,
        paintFirst: 'stroke',
        centeredRotation: false,
        strokeUniform: true,
        styles: {},
        kind: 'template-text',
      });
    }

    function fontAssetForText(object) {
      const asset = fontAssetForObject(object);

      if (!asset) {
        const sample = String(object.text || '').replace(/\s+/g, ' ').slice(0, 32);
        throw new Error(translate(
          `Для подписи «${sample || 'без текста'}» загрузите локальный TTF/OTF`,
          `Upload a local TTF/OTF for “${sample || 'empty text'}”`,
        ));
      }
      return asset;
    }

    function exportTextBlock(object, usedFonts, width, height) {
      imgEditor.normalizeTextScale?.(object);
      object.set({ styles: {}, strokeUniform: true });

      const align = object.textAlign === 'left' || object.textAlign === 'right'
        ? object.textAlign
        : 'center';
      const anchor = object.getPointByOrigin(align, 'center');
      if (
        anchor.x < 0
        || anchor.x > width
        || anchor.y < 0
        || anchor.y > height
      ) {
        const sample = String(object.text || '').replace(/\s+/g, ' ').slice(0, 32);
        throw new Error(translate(
          `Якорь подписи «${sample || 'без текста'}» находится за холстом`,
          `The anchor of “${sample || 'empty text'}” is outside the canvas`,
        ));
      }

      const asset = fontAssetForText(object);
      const fill = colorWithOpacity(object.fill, object.opacity);
      const strokeWidth = Math.max(0, (Number(object.strokeWidth) || 0) / 2);
      const hasStroke = Boolean(object.stroke) && strokeWidth > 0;
      const strokeColor = hasStroke
        ? colorWithOpacity(object.stroke, object.opacity, fill)
        : fill;

      usedFonts.set(asset.fileName, asset);

      return {
        text: String(object.text ?? ''),
        position: {
          x: Math.round(anchor.x),
          y: Math.round(anchor.y),
        },
        align,
        angle: round(object.angle || 0),
        skew: {
          x: round(object.skewX || 0),
          y: round(object.skewY || 0),
        },
        flip: {
          x: Boolean(object.flipX),
          y: Boolean(object.flipY),
        },
        font: asset.fileName,
        size: Math.max(4, Math.min(2000, Math.round(Number(object.fontSize) || 40))),
        weight: numericWeight(object.fontWeight),
        color: fill,
        stroke_width: hasStroke ? round(strokeWidth) : 0,
        stroke_color: strokeColor,
        line_spacing: Math.max(0.5, Math.min(4, round(object.lineHeight || 1.2))),
        char_spacing: round(object.charSpacing || 0),
        underline: Boolean(object.underline),
        linethrough: Boolean(object.linethrough),
      };
    }

    function exportSettings() {
      const name = exportControls.name.value.trim();
      if (!/^[a-z0-9_-]+$/i.test(name)) {
        throw new Error(translate(
          'Имя ZIP: только латиница, цифры, _ и -',
          'ZIP name may contain only letters, numbers, _ and -',
        ));
      }
      projectName = name;
      return { name };
    }

    function printTrimConfig() {
      const trim = {
        left: Math.round(Number(projectTrim.left) || 0),
        top: Math.round(Number(projectTrim.top) || 0),
        right: Math.round(Number(projectTrim.right) || 0),
        bottom: Math.round(Number(projectTrim.bottom) || 0),
      };
      trim.visible_size = [
        PRINT_WIDTH - trim.left - trim.right,
        PRINT_HEIGHT - trim.top - trim.bottom,
      ];
      return trim;
    }

    function activeStaticLayers() {
      const objects = imgEditor.canvas.getObjects();
      const slotIndexes = objects
        .map((object, index) => (object.kind === 'photo-slot' ? index : -1))
        .filter(index => index !== -1);
      const firstSlot = slotIndexes.length ? Math.min(...slotIndexes) : objects.length;
      const lastSlot = slotIndexes.length ? Math.max(...slotIndexes) : objects.length - 1;
      const isStatic = object => (
        !object.excludeFromExport
        && object.kind !== 'photo-slot'
        && !isTextObject(object)
      );

      return {
        background: objects.filter((object, index) => isStatic(object) && index < firstSlot),
        foreground: objects.filter((object, index) => isStatic(object) && index > lastSlot),
      };
    }

    function renderCanvasLayer(layer) {
      const canvas = imgEditor.canvas;
      const profile = activeProfile();
      const layers = activeStaticLayers();
      const visibleObjects = new Set(layers[layer]);
      const objectVisibility = canvas.getObjects().map(object => object.visible);
      const currentZoom = canvas.getZoom();
      const backgroundImage = canvas.backgroundImage;
      const backgroundColor = canvas.backgroundColor;

      canvas.getObjects().forEach(object => {
        object.visible = visibleObjects.has(object);
      });
      if (layer === 'foreground') {
        canvas.backgroundImage = null;
        canvas.backgroundColor = 'rgba(0,0,0,0)';
      }
      imgEditor.applyZoom(1);

      try {
        canvas.requestRenderAll();
        return dataURLToBytes(canvas.toDataURL({
          format: 'png',
          multiplier: 1,
          left: 0,
          top: 0,
          width: profile.width,
          height: profile.height,
        }));
      } finally {
        canvas.getObjects().forEach((object, index) => {
          object.visible = objectVisibility[index];
        });
        canvas.backgroundImage = backgroundImage;
        canvas.backgroundColor = backgroundColor;
        imgEditor.applyZoom(currentZoom);
        canvas.requestRenderAll();
      }
    }

    function canvasPNGBytes(canvas) {
      return new Promise((resolve, reject) => {
        canvas.toBlob(async blob => {
          if (!blob) {
            reject(new Error('Could not render PNG'));
            return;
          }
          resolve(new Uint8Array(await blob.arrayBuffer()));
        }, 'image/png');
      });
    }

    async function stripSheetBytes(sourceBytes) {
      const bitmap = await createImageBitmap(new Blob([sourceBytes], { type: 'image/png' }));
      const pair = document.createElement('canvas');
      pair.width = PRINT_HEIGHT;
      pair.height = PRINT_WIDTH;
      const pairContext = pair.getContext('2d');
      pairContext.drawImage(bitmap, 0, 0);
      if (mirrorSecondStrip) {
        pairContext.save();
        pairContext.translate(PRINT_HEIGHT, 0);
        pairContext.scale(-1, 1);
        pairContext.drawImage(bitmap, 0, 0);
        pairContext.restore();
      } else {
        pairContext.drawImage(bitmap, STRIP_WIDTH, 0);
      }
      bitmap.close?.();

      const sheet = document.createElement('canvas');
      sheet.width = PRINT_WIDTH;
      sheet.height = PRINT_HEIGHT;
      const sheetContext = sheet.getContext('2d');
      sheetContext.translate(0, PRINT_HEIGHT);
      sheetContext.rotate(-Math.PI / 2);
      sheetContext.drawImage(pair, 0, 0);
      return canvasPNGBytes(sheet);
    }

    function activeTextBlocks(usedFonts) {
      const profile = activeProfile();
      return imgEditor.canvas.getObjects()
        .filter(object => isTextObject(object) && !object.excludeFromExport)
        .map(object => exportTextBlock(object, usedFonts, profile.width, profile.height));
    }

    function gridTemplate(usedFonts, hasForeground) {
      const photoLayout = imgEditor.getPhotoLayoutState();
      const photos = photoLayout?.photos || [];

      if (!photos.length) {
        throw new Error(translate('Добавьте хотя бы одно фото', 'Add at least one photo slot'));
      }

      const textBlocks = activeTextBlocks(usedFonts);
      const firstPhoto = photos[0];
      const layout = {
        background: 'grid_bg.png',
        photos: photos.map(photo => ({
          photo_index: photo.photo_index,
          x: Math.round(photo.x),
          y: Math.round(photo.y),
          width: Math.round(photo.width),
          height: Math.round(photo.height),
          rotate: 'none',
        })),
      };
      if (hasForeground) layout.foreground = 'grid_bg_after.png';

      if (textBlocks.length) {
        layout.texts = textBlocks;
        layout._texts_date_tokens = ['{dd}.{mm}.{yyyy}', '{dd} {month_ru} {yyyy}'];
      }

      return {
        label: layoutLabels.grid,
        photo_size_px: {
          width: Math.round(firstPhoto.width),
          height: Math.round(firstPhoto.height),
        },
        print_layout: layout,
        preview_rotation: 'none',
        preview_split: 'none',
      };
    }

    function singleTemplate(grid) {
      const photo = PHOTO_LAYOUT.presets.find(preset => preset.id === 'single').slots[0];
      return {
        label: '1 фото',
        photo_choice: true,
        photo_size_px: {
          width: photo.width,
          height: photo.height,
        },
        print_layout: {
          ...grid.print_layout,
          photos: [{
            photo_index: 0,
            x: photo.x,
            y: photo.y,
            rotate: 'none',
          }],
        },
        preview_rotation: 'none',
        preview_split: 'none',
      };
    }

    function swappedAlign(align) {
      if (align === 'left') return 'right';
      if (align === 'right') return 'left';
      return 'center';
    }

    function stripTextCopies(block) {
      const left = {
        ...block,
        position: {
          x: block.position.y,
          y: PRINT_HEIGHT - block.position.x,
        },
        angle: normalizedAngle(block.angle - 90),
      };
      const right = {
        ...block,
        position: {
          x: block.position.y,
          y: block.position.x,
        },
        align: swappedAlign(block.align),
        angle: normalizedAngle(-block.angle - 90),
        skew: {
          x: round(-block.skew.x),
          y: round(-block.skew.y),
        },
      };
      return [right, left];
    }

    function stripsTemplate(usedFonts, hasForeground) {
      const photos = imgEditor.getPhotoLayoutState()?.photos || [];
      if (!photos.length) {
        throw new Error(translate('Добавьте фото на левую полосу', 'Add photos to the left strip'));
      }

      const textCopies = activeTextBlocks(usedFonts).map(stripTextCopies);
      const textBlocks = [
        ...textCopies.map(([right]) => right),
        ...textCopies.map(([, left]) => left),
      ];
      const rightPhotos = photos.map(photo => ({
        photo_index: photo.photo_index,
        x: Math.round(photo.y),
        y: Math.round(photo.x),
        width: Math.round(photo.height),
        height: Math.round(photo.width),
        rotate: 'ccw',
      }));
      const leftPhotos = photos.map(photo => ({
        photo_index: photo.photo_index,
        x: Math.round(photo.y),
        y: Math.round(PRINT_HEIGHT - photo.x - photo.width),
        width: Math.round(photo.height),
        height: Math.round(photo.width),
        rotate: 'ccw',
      }));
      const layout = {
        background: 'strip_bg.png',
        photos: [...rightPhotos, ...leftPhotos],
      };
      if (hasForeground) layout.foreground = 'strip_bg_after.png';
      if (textBlocks.length) {
        layout.texts = textBlocks;
        layout._texts_date_tokens = ['{dd}.{mm}.{yyyy}', '{dd} {month_ru} {yyyy}'];
      }

      return {
        label: layoutLabels.strips,
        photo_size_px: {
          width: Math.round(photos[0].height),
          height: Math.round(photos[0].width),
        },
        print_layout: layout,
        preview_rotation: 'cw',
        preview_split: 'horizontal',
        mirror_second_strip: mirrorSecondStrip,
      };
    }

    function layoutHasBackground(layout) {
      const documentState = layoutDocuments[layout];
      const canvas = documentState?.canvas;
      const fill = documentState?.backgroundFill;
      const hasFill = fill?.type === 'gradient'
        || /^#[0-9a-f]{6}$/i.test(fill?.color || '');
      return Boolean(canvas && (canvas.backgroundImage || canvas.background || hasFill));
    }

    function layoutReadiness(layout) {
      const documentState = layoutDocuments[layout];
      if (!documentState?.canvas) {
        return translate('не создан', 'not created');
      }
      if (!layoutHasBackground(layout)) {
        return translate('нет фона', 'no background');
      }
      const objects = documentState.canvas.objects || [];
      if (!objects.some(object => object.kind === 'photo-slot')) {
        return translate('нет фотослотов', 'no photo slots');
      }
      const missingFont = objects.find(object => (
        object.type === 'i-text'
        && object.fontFile
        && !fontAssets.has(object.fontFile)
      ));
      if (missingFont) {
        return translate(`нет шрифта ${missingFont.fontFile}`, `missing font ${missingFont.fontFile}`);
      }
      return null;
    }

    function renderExportSummary() {
      if (!exportControls.summary || !imgEditor.canvas) return;
      if (!isSwitchingLayout) captureActiveLayout();

      const states = Object.keys(LAYOUT_PROFILES).map(layout => ({
        layout,
        error: layoutReadiness(layout),
      }));
      const errors = states.filter(state => state.error);
      states.forEach(state => {
        const indicator = document.querySelector(`[data-layout-status="${state.layout}"]`);
        indicator?.classList.toggle('ready', !state.error);
        indicator?.classList.toggle('missing', Boolean(state.error));
        indicator?.setAttribute('title', state.error || translate('Готово', 'Ready'));
      });
      exportControls.summary.classList.toggle('warning', errors.length > 0);
      exportControls.summary.textContent = states.map(state => {
        const label = state.layout === 'grid'
          ? translate('Грид', 'Grid')
          : translate('Стрипсы', 'Strips');
        return `${label}: ${state.error || translate('готов', 'ready')}`;
      }).join(' · ');
      exportControls.config.disabled = (
        errors.length > 0 || exportControls.config.classList.contains('busy')
      );
      exportControls.gridBackground.disabled = (
        !layoutHasBackground('grid')
        || exportControls.gridBackground.classList.contains('busy')
      );
      exportControls.stripBackground.disabled = (
        !layoutHasBackground('strips')
        || exportControls.stripBackground.classList.contains('busy')
      );
      exportControls.package.disabled = (
        errors.length > 0 || exportControls.package.classList.contains('busy')
      );
    }

    async function exportProject(includeImages, explicitName = null) {
      const name = explicitName ?? exportSettings().name;
      const originalLayout = activeLayout;
      const usedFonts = new Map();
      const templates = {};
      const images = [];

      captureActiveLayout();
      try {
        for (const layout of ['strips', 'grid']) {
          if (activeLayout !== layout) {
            await loadLayout(layout);
          }
          await ensureOnlineFontAssets();
          const hasForeground = activeStaticLayers().foreground.length > 0;
          templates[layout] = layout === 'grid'
            ? gridTemplate(usedFonts, hasForeground)
            : stripsTemplate(usedFonts, hasForeground);
          if (layout === 'grid') templates.single = singleTemplate(templates.grid);

          if (includeImages) {
            let background = renderCanvasLayer('background');
            let foreground = hasForeground ? renderCanvasLayer('foreground') : null;
            if (layout === 'strips') {
              background = await stripSheetBytes(background);
              if (foreground) foreground = await stripSheetBytes(foreground);
            }
            images.push({
              name: layout === 'grid' ? 'grid_bg.png' : 'strip_bg.png',
              data: background,
            });
            if (foreground) {
              images.push({
                name: layout === 'grid' ? 'grid_bg_after.png' : 'strip_bg_after.png',
                data: foreground,
              });
            }
          }
          captureActiveLayout();
        }
      } finally {
        if (activeLayout !== originalLayout) {
          await loadLayout(originalLayout);
        }
        captureActiveLayout();
        queueDraftSave();
      }

      return {
        name,
        usedFonts,
        images,
        config: {
          print_size: [PRINT_WIDTH, PRINT_HEIGHT],
          print_trim: printTrimConfig(),
          templates,
        },
      };
    }

    async function downloadLayoutBackground(layout) {
      const originalLayout = activeLayout;

      captureActiveLayout();
      try {
        if (activeLayout !== layout) await loadLayout(layout);
        let bytes = renderCanvasLayer('background');
        if (layout === 'strips') bytes = await stripSheetBytes(bytes);
        downloadBlob(
          new Blob([bytes], { type: 'image/png' }),
          layout === 'grid' ? 'grid_bg.png' : 'strip_bg.png',
        );
      } finally {
        if (activeLayout !== originalLayout) await loadLayout(originalLayout);
        captureActiveLayout();
      }
    }

    function fontAssetForObject(object) {
      return findFontAsset(
        object.fontFamily,
        object.fontFile,
        object.fontStyle || 'normal',
      );
    }

    async function ensureOnlineFontAssets() {
      const objects = imgEditor.canvas.getObjects().filter(object => (
        isTextObject(object) && onlineFontFamilies.has(object.fontFamily)
      ));

      await Promise.all(objects.map(async object => {
        const asset = await cacheOnlineFont(
          object.fontFamily,
          object.fontStyle,
          object.fontWeight,
        );
        object.set('fontFile', asset.fileName);
        imgEditor.refreshTextDimensions(object, object.fontFamily);
      }));

    }

    function packagedFontFiles(usedFonts, encoder) {
      const files = [];
      const licenses = new Set();

      usedFonts.forEach(asset => {
        files.push({
          name: asset.fileName,
          data: dataURLToBytes(asset.dataURL),
        });

        if (
          asset.licenseFileName
          && asset.licenseText
          && !licenses.has(asset.licenseFileName)
        ) {
          licenses.add(asset.licenseFileName);
          files.push({
            name: asset.licenseFileName,
            data: encoder.encode(asset.licenseText),
          });
        }
      });

      return files;
    }

    function exportedProjectFiles(config, usedFonts, images) {
      const encoder = new TextEncoder();
      return [
        {
          name: 'config.json',
          data: encoder.encode(`${JSON.stringify(config, null, 2)}\n`),
        },
        ...images,
        ...packagedFontFiles(usedFonts, encoder),
      ];
    }

    function setYadiskStatus(message = '', type = '') {
      exportControls.yadiskStatus.hidden = !message;
      exportControls.yadiskStatus.textContent = message;
      exportControls.yadiskStatus.className = `template-import-status ${type}`.trim();
    }

    async function yadiskApi(token, method, endpoint, params = {}, accepted = []) {
      const query = new URLSearchParams(params);
      const response = await fetch(
        `https://cloud-api.yandex.net/v1/disk${endpoint}?${query}`,
        {
          method,
          headers: {
            Authorization: `OAuth ${token}`,
          },
        },
      );
      if (!response.ok && !accepted.includes(response.status)) {
        let detail = '';
        try {
          const payload = await response.json();
          detail = payload.description || payload.message || '';
        } catch (_error) {
          detail = await response.text().catch(() => '');
        }
        throw new Error(
          translate(
            `Яндекс Диск: HTTP ${response.status}${detail ? ` — ${detail}` : ''}`,
            `Yandex Disk: HTTP ${response.status}${detail ? ` — ${detail}` : ''}`,
          ),
        );
      }
      if (response.status === 204 || accepted.includes(response.status)) return {};
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    }

    async function ensureYadiskDirectory(path, token) {
      const existing = await yadiskApi(
        token,
        'GET',
        '/resources',
        { path, fields: 'type' },
        [404],
      );
      if (existing.type === 'dir') return;
      if (existing.type) {
        throw new Error(translate(
          `Путь ${path} уже занят файлом`,
          `Path ${path} is occupied by a file`,
        ));
      }
      // 409 is still accepted in case another client creates the directory
      // between this existence check and the PUT request.
      await yadiskApi(token, 'PUT', '/resources', { path }, [409]);
    }

    async function uploadYadiskFile(path, data, token) {
      const metadata = await yadiskApi(token, 'GET', '/resources/upload', {
        path,
        overwrite: 'true',
      });
      if (typeof metadata.href !== 'string') {
        throw new Error(translate(
          'Яндекс Диск не вернул ссылку загрузки',
          'Yandex Disk did not return an upload URL',
        ));
      }
      const response = await fetch(metadata.href, {
        method: 'PUT',
        body: new Blob([data]),
      });
      if (!response.ok) {
        throw new Error(`Yandex Disk upload: HTTP ${response.status}`);
      }
    }

    async function uploadProjectToYadisk(project, token, packName) {
      const root = '/photobooth_system/templates_custom';
      const target = `${root}/${packName}`;
      await ensureYadiskDirectory('/photobooth_system', token);
      await ensureYadiskDirectory(root, token);
      await ensureYadiskDirectory(target, token);

      const files = exportedProjectFiles(
        project.config,
        project.usedFonts,
        project.images,
      );
      const ordered = [
        ...files.filter(file => file.name !== 'config.json'),
        ...files.filter(file => file.name === 'config.json'),
      ];
      for (let index = 0; index < ordered.length; index += 1) {
        const file = ordered[index];
        setYadiskStatus(translate(
          `Загружаю ${index + 1}/${ordered.length}: ${file.name}`,
          `Uploading ${index + 1}/${ordered.length}: ${file.name}`,
        ));
        await uploadYadiskFile(`${target}/${file.name}`, file.data, token);
      }
      return files.length;
    }

    async function installUploadedFontFile(file, replace = false) {
      if (!FONT_FILE_PATTERN.test(file?.name || '') || !file?.size) {
        throw templateImportError(
          'Выберите непустой файл TTF или OTF',
          'Choose a non-empty TTF or OTF file',
        );
      }

      const duplicate = fontAssets.get(file.name);
      if (duplicate && !replace) return duplicate;

      const id = globalThis.crypto?.randomUUID?.()
        || `${Date.now()}_${Math.random().toString(36).slice(2)}`;
      return installFontAsset({
        family: `TemplateFont_${id.replace(/[^a-z0-9]/gi, '')}`,
        label: file.name.replace(FONT_FILE_PATTERN, ''),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'font/ttf',
        dataURL: await readFileAsDataURL(file),
      });
    }

    function packageConfigEntry(files) {
      const matches = [...files.keys()].filter(path => path === 'config.json' || path.endsWith('/config.json'));
      if (matches.length !== 1) {
        throw templateImportError(
          'В пакете должен быть ровно один config.json',
          'The package must contain exactly one config.json',
        );
      }
      const path = matches[0];
      return {
        path,
        root: path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : '',
        value: files.get(path),
      };
    }

    function packageAsset(files, root, name) {
      if (typeof name !== 'string' || !name || name.includes('\\')) {
        throw templateImportError('Некорректное имя файла в config.json', 'Invalid asset name in config.json');
      }
      const path = normalizedArchivePath(`${root}${name}`);
      const value = files.get(path);
      if (!value) {
        throw templateImportError(`Не найден файл ${name}`, `File ${name} was not found`);
      }
      return value;
    }

    async function bitmapFromPackageAsset(value, name) {
      const bytes = await packageFileBytes(value);
      const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeTypeForName(name) }));
      return { bytes, bitmap };
    }

    async function leftStripBytes(value, name) {
      const { bitmap } = await bitmapFromPackageAsset(value, name);
      try {
        if (bitmap.width !== PRINT_WIDTH || bitmap.height !== PRINT_HEIGHT) {
          throw templateImportError(
            `${name} должен быть ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
            `${name} must be ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
          );
        }
        const strip = document.createElement('canvas');
        strip.width = STRIP_WIDTH;
        strip.height = STRIP_HEIGHT;
        const context = strip.getContext('2d');
        context.translate(PRINT_HEIGHT, 0);
        context.rotate(Math.PI / 2);
        context.drawImage(bitmap, 0, 0);
        return canvasPNGBytes(strip);
      } finally {
        bitmap.close?.();
      }
    }

    async function gridAssetBytes(value, name) {
      const { bytes, bitmap } = await bitmapFromPackageAsset(value, name);
      try {
        if (bitmap.width !== PRINT_WIDTH || bitmap.height !== PRINT_HEIGHT) {
          throw templateImportError(
            `${name} должен быть ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
            `${name} must be ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
          );
        }
        return bytes;
      } finally {
        bitmap.close?.();
      }
    }

    async function imageFromPNGBytes(bytes) {
      const source = await readFileAsDataURL(new Blob([bytes], { type: 'image/png' }));
      return loadFabricImage(source);
    }

    async function prepareImportedImages(files, root, definition) {
      const backgroundAsset = packageAsset(files, root, definition.background);
      const foregroundAsset = definition.foreground
        ? packageAsset(files, root, definition.foreground)
        : null;
      const convert = definition.key === 'strips' ? leftStripBytes : gridAssetBytes;
      return {
        background: await convert(backgroundAsset, definition.background),
        foreground: foregroundAsset
          ? await convert(foregroundAsset, definition.foreground)
          : null,
      };
    }

    async function applyImportedLayout(definition, images, fonts) {
      const canvas = imgEditor.canvas;
      const previousHistoryProcessing = canvas.historyProcessing;
      canvas.historyProcessing = true;
      try {
        layoutDocuments[definition.key] = null;
        await loadLayout(definition.key);
        canvas.historyProcessing = true;
        clearCanvasDocument();
        activeBackgroundFillState = defaultBackgroundFillState();
        imgEditor.setBackgroundFillState(definition.key, activeBackgroundFillState);
        const backgroundImage = await imageFromPNGBytes(images.background);
        await installBackgroundImage(backgroundImage, {
          fileName: definition.background,
          fileSize: images.background.length,
        }, 'cover');

        if (!imgEditor.setPhotoLayoutState({
          photos: definition.photos,
          symmetry: { enabled: false },
        })) {
          throw templateImportError(
            'Не удалось восстановить фотослоты',
            'Could not restore photo slots',
          );
        }

        if (images.foreground) {
          const foreground = await imageFromPNGBytes(images.foreground);
          foreground.set({
            left: 0,
            top: 0,
            originX: 'left',
            originY: 'top',
            selectable: true,
            evented: true,
            assetFileName: definition.foreground,
            kind: 'template-foreground',
          });
          canvas.add(foreground);
        }

        definition.texts.forEach(block => {
          const text = importedTextObject(block, fonts.get(block.font));
          canvas.add(text);
          text.setCoords();
        });

        layoutLabels[definition.key] = definition.label;

        imgEditor.activeSelection = null;
        canvas.requestRenderAll();
        imgEditor.fitZoom();
      } finally {
        canvas.historyProcessing = previousHistoryProcessing;
      }

      canvas.clearHistory();
      canvas._historySaveAction();
      captureActiveLayout();
    }

    function snapshotProjectState() {
      captureActiveLayout();
      return {
        activeLayout,
        projectName,
        mirrorSecondStrip,
        projectTrim: { ...projectTrim },
        layoutLabels: { ...layoutLabels },
        layouts: clone(layoutDocuments),
        fonts: [...fontAssets.entries()],
      };
    }

    async function restoreProjectSnapshot(snapshot) {
      projectName = snapshot.projectName;
      mirrorSecondStrip = snapshot.mirrorSecondStrip;
      projectTrim = { ...snapshot.projectTrim };
      Object.assign(layoutLabels, snapshot.layoutLabels);
      Object.keys(layoutDocuments).forEach(layout => {
        layoutDocuments[layout] = clone(snapshot.layouts[layout]);
      });
      fontAssets.clear();
      snapshot.fonts.forEach(([fileName, asset]) => {
        fontAssets.set(fileName, asset);
      });
      renderLocalFontOptions();
      exportControls.name.value = projectName;
      await loadLayout(snapshot.activeLayout);
    }

    async function runTemplateImport(options = {}) {
      if (!importFiles || importBusy) return false;

      importBusy = true;
      importControls.package.disabled = true;
      importControls.folder.disabled = true;
      setLayoutTabsDisabled(true);
      const report = (message, type = '') => {
        setImportStatus(message, type);
        options.onStatus?.(message, type);
      };
      report(translate('Проверяю шаблон…', 'Checking template…'));

      const previousRestoring = isRestoringDraft;
      const snapshot = snapshotProjectState();
      let projectMutationStarted = false;
      let imported = false;
      try {
        const configEntry = packageConfigEntry(importFiles);
        const configText = configEntry.value instanceof File
          ? await configEntry.value.text()
          : new TextDecoder().decode(configEntry.value);
        const config = JSON.parse(configText);
        const trim = validatedImportedConfig(config);
        const definitions = [
          importedGridDefinition(config),
          importedStripsDefinition(config),
        ];

        const referencedFonts = new Set(
          definitions.flatMap(definition => definition.texts.map(block => block.font)),
        );
        for (const fileName of referencedFonts) {
          const value = importFiles.get(normalizedArchivePath(`${configEntry.root}${fileName}`));
          if (value) {
            await installUploadedFontFile(await packageFile(value, fileName), true);
          }
        }

        const resolvedFonts = await resolveImportedFonts(
          definitions.flatMap(definition => definition.texts),
        );

        if (resolvedFonts.missing.length) {
          missingImportFonts = resolvedFonts.missing;
          importControls.fonts.hidden = false;
          report(translate(
            `Не найдены шрифты: ${missingImportFonts.join(', ')}`,
            `Missing fonts: ${missingImportFonts.join(', ')}`,
          ), 'error');
          return false;
        }

        clearMissingImportFonts();
        report(translate('Загружаю изображения…', 'Loading images…'));
        const prepared = await Promise.all(definitions.map(async definition => ({
          definition,
          images: await prepareImportedImages(importFiles, configEntry.root, definition),
        })));

        isRestoringDraft = true;
        projectMutationStarted = true;
        imgEditor.canvas.projectRevision = (imgEditor.canvas.projectRevision || 0) + 1;
        mirrorSecondStrip = definitions.find(
          definition => definition.key === 'strips',
        )?.mirrorSecondStrip !== false;
        projectTrim = {
          left: trim.left,
          top: trim.top,
          right: trim.right,
          bottom: trim.bottom,
        };
        for (const item of prepared) {
          await applyImportedLayout(item.definition, item.images, resolvedFonts.assets);
        }
        projectName = options.projectName || (configEntry.root
          ? configEntry.root.replace(/\/$/, '').split('/').pop()
          : (importControls.package.files?.[0]?.name.replace(/\.zip$/i, '') || 'template'));
        exportControls.name.value = projectName;
        if (activeLayout !== 'grid') await loadLayout('grid');
        report(
          translate('Грид и стрипсы импортированы', 'Grid and strips were imported'),
          'success',
        );
        imgEditor.toast(
          translate('Шаблон импортирован', 'Template imported'),
          'Success',
        );
        imported = true;
      } catch (error) {
        console.error('[template-studio] import error', error);
        if (projectMutationStarted) {
          try {
            await restoreProjectSnapshot(snapshot);
          } catch (restoreError) {
            console.error('[template-studio] import rollback error', restoreError);
          }
        }
        report(error.message, 'error');
      } finally {
        isRestoringDraft = previousRestoring;
        importBusy = false;
        importControls.package.disabled = false;
        importControls.folder.disabled = false;
        setLayoutTabsDisabled(false);
        renderExportSummary();
      }
      if (imported && !previousRestoring) await flushDraftSave();
      return imported;
    }

    importControls.package.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      const revision = imgEditor.canvas.projectRevision || 0;
      importFiles = null;
      clearMissingImportFonts();
      if (!file) {
        setImportStatus();
        return;
      }

      try {
        setImportStatus(translate('Читаю ZIP…', 'Reading ZIP…'));
        importFiles = await unzipFiles(file);
        if ((imgEditor.canvas.projectRevision || 0) !== revision) {
          importFiles = null;
          setImportStatus();
          return;
        }
        packageConfigEntry(importFiles);
        importControls.folder.value = '';
        await runTemplateImport();
      } catch (error) {
        importFiles = null;
        setImportStatus(error.message || translate(
          'Не удалось прочитать config.json',
          'Could not read config.json',
        ), 'error');
      }
    });

    importControls.folder.addEventListener('change', async event => {
      importFiles = event.target.files?.length ? folderFiles(event.target.files) : null;
      clearMissingImportFonts();
      if (importFiles) {
        importControls.package.value = '';
        try {
          setImportStatus(translate('Читаю папку…', 'Reading folder…'));
          packageConfigEntry(importFiles);
          await runTemplateImport();
        } catch (error) {
          importFiles = null;
          setImportStatus(error.message, 'error');
        }
      } else {
        setImportStatus();
      }
    });
    importControls.fonts.addEventListener('click', () => {
      importControls.fontInput.click();
    });
    importControls.fontInput.addEventListener('change', async event => {
      const files = [...(event.target.files || [])];
      const revision = imgEditor.canvas.projectRevision || 0;
      event.target.value = '';
      if (!files.length) return;

      importControls.fonts.disabled = true;
      try {
        for (const file of files) {
          await installUploadedFontFile(file);
          if ((imgEditor.canvas.projectRevision || 0) !== revision) return;
        }
        await runTemplateImport();
      } catch (error) {
        setImportStatus(error.message, 'error');
      } finally {
        importControls.fonts.disabled = false;
      }
    });

    fontInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      try {
        const asset = await installUploadedFontFile(file);
        const object = imgEditor.activeSelection;

        if (isTextObject(object)) {
          imgEditor.applyTextFontAsset(object, asset);
          imgEditor.canvas.requestRenderAll();
          imgEditor.canvas.fire('object:property-realy-changed');
          imgEditor.setSelectionValues();
        } else {
          queueDraftSave();
        }

        imgEditor.toast(
          translate(`Шрифт ${file.name} загружен`, `Font ${file.name} loaded`),
          'Success',
        );
      } catch (error) {
        console.error('[template-studio] font error', error);
        imgEditor.toast(
          translate('Не удалось прочитать файл шрифта', 'Could not load the font file'),
          'Danger',
          3000,
        );
      }
    });

    [
      ['grid', exportControls.gridBackground],
      ['strips', exportControls.stripBackground],
    ].forEach(([layout, button]) => {
      button.addEventListener('click', async () => {
        button.classList.add('busy');
        button.disabled = true;
        setLayoutTabsDisabled(true);

        try {
          await downloadLayoutBackground(layout);
        } catch (error) {
          console.error(`[template-studio] ${layout} background export error`, error);
          imgEditor.toast(error.message, 'Danger', 4000);
        } finally {
          button.classList.remove('busy');
          setLayoutTabsDisabled(false);
          renderExportSummary();
        }
      });
    });

    exportControls.config.addEventListener('click', async () => {
      exportControls.config.classList.add('busy');
      exportControls.config.disabled = true;
      setLayoutTabsDisabled(true);

      try {
        const { config } = await exportProject(false);
        downloadBlob(new Blob([
          `${JSON.stringify(config, null, 2)}\n`,
        ], { type: 'application/json;charset=utf-8' }), 'config.json');
      } catch (error) {
        console.error('[template-studio] config export error', error);
        imgEditor.toast(error.message, 'Danger', 4000);
      } finally {
        exportControls.config.classList.remove('busy');
        setLayoutTabsDisabled(false);
        renderExportSummary();
      }
    });

    exportControls.package.addEventListener('click', async () => {
      exportControls.package.classList.add('busy');
      exportControls.package.disabled = true;
      setLayoutTabsDisabled(true);

      try {
        const { name, config, usedFonts, images } = await exportProject(true);
        const files = exportedProjectFiles(config, usedFonts, images);

        downloadBlob(zipFiles(files), `${name}.zip`);
        imgEditor.toast(
          translate('ZIP шаблона готов', 'Template ZIP is ready'),
          'Success',
        );
      } catch (error) {
        console.error('[template-studio] export error', error);
        imgEditor.toast(error.message, 'Danger', 4500);
      } finally {
        exportControls.package.classList.remove('busy');
        setLayoutTabsDisabled(false);
        renderExportSummary();
      }
    });

    exportControls.yadiskButton.addEventListener('click', async () => {
      const token = exportControls.yadiskToken.value.trim();
      const packName = exportControls.yadiskName.value.trim();
      if (!token) {
        setYadiskStatus(translate(
          'Введите OAuth-токен Яндекс Диска',
          'Enter a Yandex Disk OAuth token',
        ), 'error');
        return;
      }
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(packName)) {
        setYadiskStatus(translate(
          'Имя: строчные латинские буквы, цифры, _ и -, максимум 64 символа',
          'Use lowercase letters, numbers, _ and -, up to 64 characters',
        ), 'error');
        return;
      }

      exportControls.yadiskButton.classList.add('busy');
      exportControls.yadiskButton.disabled = true;
      setLayoutTabsDisabled(true);
      setYadiskStatus(translate('Готовлю шаблон…', 'Preparing template…'));
      try {
        const project = await exportProject(true, packName);
        const count = await uploadProjectToYadisk(project, token, packName);
        setYadiskStatus(translate(
          `Загружено файлов: ${count}`,
          `Uploaded files: ${count}`,
        ), 'success');
        imgEditor.toast(
          translate('Шаблон экспортирован на Яндекс Диск', 'Template exported to Yandex Disk'),
          'Success',
        );
      } catch (error) {
        console.error('[template-studio] Yandex Disk export error', error);
        setYadiskStatus(error.message, 'error');
        imgEditor.toast(
          translate('Не удалось экспортировать шаблон', 'Could not export template'),
          'Danger',
          4500,
        );
      } finally {
        exportControls.yadiskButton.classList.remove('busy');
        exportControls.yadiskButton.disabled = false;
        setLayoutTabsDisabled(false);
        renderExportSummary();
      }
    });

    exportControls.name.addEventListener('input', () => {
      projectName = exportControls.name.value.trim() || 'template';
      queueDraftSave();
    });

    layoutTabs.forEach(tab => {
      tab.addEventListener('click', async () => {
        if (tab.dataset.layoutTab === activeLayout || isSwitchingLayout) return;

        setLayoutTabsDisabled(true);
        try {
          await switchLayout(tab.dataset.layoutTab);
        } catch (error) {
          console.error('[template-studio] could not switch layout', error);
          imgEditor.toast(
            translate('Не удалось переключить макет', 'Could not switch layout'),
            'Danger',
            3500,
          );
        } finally {
          setLayoutTabsDisabled(false);
        }
      });
    });

    renderExportSummary();

    const templateGallery = {
      panel: document.querySelector(`${imgEditor.containerSelector} #export-template-panel`),
      list: document.querySelector(
        `${imgEditor.containerSelector} #export-template-panel .list-templates`,
      ),
      status: document.querySelector(
        `${imgEditor.containerSelector} #export-template-panel .template-gallery-status`,
      ),
    };
    let templateGalleryBusy = false;

    function validTemplateFolderName(value) {
      const name = typeof value === 'string' ? value.trim() : '';
      return name
        && name !== '.'
        && name !== '..'
        && !name.includes('/')
        && !name.includes('\\')
        ? name
        : null;
    }

    function templateAssetURL(folder, fileName) {
      const path = normalizedArchivePath(fileName);
      const encodedPath = path.split('/').map(encodeURIComponent).join('/');
      return `./templates/${encodeURIComponent(folder)}/${encodedPath}`;
    }

    async function fetchTemplateAsset(folder, fileName, required = true) {
      const response = await fetch(templateAssetURL(folder, fileName), { cache: 'no-store' });
      if (!response.ok) {
        if (!required && response.status === 404) return null;
        throw templateImportError(
          `Не удалось загрузить ${folder}/${fileName}: HTTP ${response.status}`,
          `Could not load ${folder}/${fileName}: HTTP ${response.status}`,
        );
      }
      return new Uint8Array(await response.arrayBuffer());
    }

    async function downloadTemplateFolder(folder, onStatus) {
      onStatus(translate('Загружаю config.json…', 'Loading config.json…'));
      const configBytes = await fetchTemplateAsset(folder, 'config.json');
      let config;
      try {
        config = JSON.parse(new TextDecoder().decode(configBytes));
      } catch (_error) {
        throw templateImportError(
          `В ${folder}/config.json некорректный JSON`,
          `${folder}/config.json contains invalid JSON`,
        );
      }

      validatedImportedConfig(config);
      const definitions = [
        importedGridDefinition(config),
        importedStripsDefinition(config),
      ];
      const requiredAssets = new Set(definitions.flatMap(definition => [
        definition.background,
        definition.foreground,
      ]).filter(Boolean));
      const fontAssetsToTry = new Set(
        definitions.flatMap(definition => definition.texts.map(block => block.font)),
      );
      const assets = [
        ...[...requiredAssets].map(fileName => ({ fileName, required: true })),
        ...[...fontAssetsToTry]
          .filter(fileName => !requiredAssets.has(fileName))
          .map(fileName => ({ fileName, required: false })),
      ];
      const root = `${folder}/`;
      const files = new Map([[`${root}config.json`, configBytes]]);
      let completed = 0;

      await Promise.all(assets.map(async asset => {
        const bytes = await fetchTemplateAsset(folder, asset.fileName, asset.required);
        completed += 1;
        onStatus(translate(
          `Загружено файлов: ${completed} из ${assets.length}`,
          `Loaded files: ${completed} of ${assets.length}`,
        ));
        if (bytes) {
          files.set(
            normalizedArchivePath(`${root}${asset.fileName}`),
            bytes,
          );
        }
      }));

      return files;
    }

    function templateLoadingModal(folder) {
      document.querySelector('.template-loading-modal')?.remove();
      const modal = document.createElement('div');
      modal.className = 'custom-modal-container template-loading-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="custom-modal-content template-loading-content">
          <span class="template-loading-spinner" aria-hidden="true"></span>
          <strong></strong>
          <p role="status"></p>
          <button type="button" hidden>${translate('Закрыть', 'Close')}</button>
        </div>
      `;
      const title = modal.querySelector('strong');
      const status = modal.querySelector('[role="status"]');
      const close = modal.querySelector('button');
      title.textContent = translate(`Загрузка «${folder}»`, `Loading “${folder}”`);
      close.addEventListener('click', () => modal.remove());
      document.body.appendChild(modal);

      return {
        setStatus(message) {
          status.textContent = message;
        },
        fail(message) {
          modal.classList.add('error');
          title.textContent = translate('Шаблон не загружен', 'Template was not loaded');
          status.textContent = message;
          close.hidden = false;
        },
        close() {
          modal.remove();
        },
      };
    }

    function renderTemplateFolders(folders) {
      templateGallery.list.replaceChildren();
      folders.forEach(folder => {
        const button = document.createElement('button');
        const mark = document.createElement('span');
        const name = document.createElement('strong');
        button.className = 'template-folder-card';
        button.type = 'button';
        button.dataset.templateFolder = folder;
        mark.className = 'template-folder-mark';
        mark.textContent = 'TS';
        name.textContent = folder;
        button.append(mark, name);
        templateGallery.list.appendChild(button);
      });
      templateGallery.list.hidden = folders.length === 0;
      templateGallery.status.hidden = folders.length > 0;
      templateGallery.status.textContent = translate(
        'В manifest.json пока нет шаблонов.',
        'There are no templates in manifest.json yet.',
      );
    }

    async function reloadTemplateGallery() {
      templateGallery.list.hidden = true;
      templateGallery.status.hidden = false;
      templateGallery.status.classList.remove('error');
      templateGallery.status.textContent = translate(
        'Обновляю список…',
        'Refreshing list…',
      );
      try {
        const response = await fetch('./templates/manifest.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const manifest = await response.json();
        if (!Array.isArray(manifest)) {
          throw new Error(translate(
            'manifest.json должен содержать массив папок',
            'manifest.json must contain an array of folders',
          ));
        }
        const folders = [...new Set(manifest.map(validTemplateFolderName).filter(Boolean))]
          .sort((left, right) => left.localeCompare(right, window.lang));
        renderTemplateFolders(folders);
      } catch (error) {
        templateGallery.list.replaceChildren();
        templateGallery.list.hidden = true;
        templateGallery.status.hidden = false;
        templateGallery.status.classList.add('error');
        templateGallery.status.textContent = translate(
          `Не удалось прочитать manifest.json: ${error.message}`,
          `Could not read manifest.json: ${error.message}`,
        );
      }
    }

    document.querySelector(`${imgEditor.containerSelector} #toolbar #export-template`)
      ?.addEventListener('click', () => {
        requestAnimationFrame(() => {
          if (templateGallery.panel.classList.contains('visible')) {
            reloadTemplateGallery();
          }
        });
      });

    backgroundInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      const layout = pendingBackgroundLayout || activeLayout;
      pendingBackgroundLayout = null;
      event.target.value = '';
      if (!file) {
        return;
      }

      try {
        const wasLoaded = await setBackgroundFile(file, layout);
        if (!wasLoaded) {
          return;
        }

        imgEditor.toast(
          translate(
            `Фон ${layout === 'grid' ? 'Grid' : 'Strips'} загружен`,
            `${layout === 'grid' ? 'Grid' : 'Strips'} background loaded`,
          ),
          'Success',
        );
      } catch (error) {
        console.error('[template-studio] background error', error);
        imgEditor.toast(error.message, 'Danger', 3000);
      }
    });

    templateGallery.list.addEventListener('click', async event => {
      const card = event.target.closest('.template-folder-card');
      const folder = validTemplateFolderName(card?.dataset.templateFolder);
      if (!folder || templateGalleryBusy || importBusy) return;

      templateGalleryBusy = true;
      templateGallery.list.querySelectorAll('button').forEach(button => {
        button.disabled = true;
      });
      const modal = templateLoadingModal(folder);
      let lastStatus = translate('Начинаю загрузку…', 'Starting download…');
      modal.setStatus(lastStatus);

      try {
        importFiles = await downloadTemplateFolder(folder, message => {
          lastStatus = message;
          modal.setStatus(message);
        });
        importControls.package.value = '';
        importControls.folder.value = '';
        const imported = await runTemplateImport({
          projectName: folder,
          onStatus(message) {
            lastStatus = message;
            modal.setStatus(message);
          },
        });
        if (!imported) throw new Error(lastStatus);
        modal.close();
        importFiles = null;
      } catch (error) {
        console.error('[template-studio] gallery import error', error);
        modal.fail(error.message || lastStatus);
      } finally {
        templateGalleryBusy = false;
        templateGallery.list.querySelectorAll('button').forEach(button => {
          button.disabled = false;
        });
      }
    });

    const draftEvents = [
      'object:added',
      'object:modified',
      'object:removed',
      'object:property-realy-changed',
      'text:changed',
      'background:modified',
      'trim:modified',
      'photo-layout:modified',
      'photo-layout:view',
    ];
    draftEvents.forEach(eventName => {
      imgEditor.canvas.on(eventName, () => {
        if (eventName === 'trim:modified') {
          syncStripPairTrim();
        } else {
          renderStripCopy();
        }
        queueDraftSave();
        renderExportSummary();
      });
    });

    window.templateStudio = {
      editor: imgEditor,
      printSize: [PRINT_WIDTH, PRINT_HEIGHT],
      stripSize: [STRIP_WIDTH, STRIP_HEIGHT],
      background: backgroundState,
      setBackgroundFile,
      setBackgroundSource,
      setBackgroundFit,
      removeBackground,
      switchLayout,
      saveDraft: saveCurrentDraft,
    };

    await installBundledFonts();
    setCanvasProfile('grid');

    let restoredDraft = false;

    try {
      restoredDraft = await restoreDraft();
    } catch (error) {
      console.error('[template-studio] could not restore local draft', error);
      imgEditor.toast(
        translate(
          'Не удалось восстановить локальный черновик',
          'Could not restore the local draft',
        ),
        'Danger',
        3500,
      );
    } finally {
      if (!restoredDraft) {
        captureActiveLayout();
      }

      const initialLayout = activeLayout;
      for (const layout of Object.keys(layoutDocuments)) {
        if (!layoutDocuments[layout]) {
          await loadLayout(layout);
        }
      }
      if (activeLayout !== initialLayout) {
        await loadLayout(initialLayout);
      }

      exportControls.name.value = projectName;
      isRestoringDraft = false;
      renderExportSummary();
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushDraftSave();
      }
    });

    window.addEventListener('beforeunload', () => {
      flushDraftSave();
    });

    document.querySelector('.appLoader')?.remove();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        imgEditor.fitZoom();
        imgEditor.refreshWorkspaceLayout?.();
      });
    });
    console.info('[template-studio] ready', {
      printSize: [PRINT_WIDTH, PRINT_HEIGHT],
      stripSize: [STRIP_WIDTH, STRIP_HEIGHT],
      activeLayout,
      restoredDraft,
    });
  }

  function launch() {
    start().catch(error => {
      console.error('[template-studio] could not start', error);
      document.querySelector('.appLoader')?.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', launch, { once: true });
  } else {
    launch();
  }
})();
