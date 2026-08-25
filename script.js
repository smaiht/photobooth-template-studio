(function () {
  'use strict';

  const PRINT_WIDTH = 3688;
  const PRINT_HEIGHT = 2480;
  const PRINT_TRIM = {
    left: 40,
    top: 50,
    right: 55,
    bottom: 55,
  };
  const PHOTO_LAYOUT = {
    defaultPreset: 'grid-2x2',
    maxPhotos: 12,
    presets: [
      {
        id: 'grid-2x2',
        label: '2 × 2',
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
        aspectRatio: 'free',
        slots: [
          { x: 312, y: 110, width: 3050, height: 2050 },
        ],
      },
    ],
  };
  const DRAFT_KEY = 'current-project-v2';
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

  function createMockTemplateApi() {
    const templates = [];

    return {
      async listTemplates() {
        console.info('[mock-template-api] list', { count: templates.length });
        return clone(templates);
      },

      async saveTemplate(data) {
        const template = {
          id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
          data: clone(data),
        };
        templates.push(template);
        console.info('[mock-template-api] save', {
          id: template.id,
          objectCount: template.data.objects.length,
        });
        return clone(template);
      },

      async deleteTemplate(id) {
        const index = templates.findIndex(template => template.id === id);
        if (index !== -1) {
          templates.splice(index, 1);
        }
        console.info('[mock-template-api] delete', { id });
        return index !== -1;
      },
    };
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
      'shapes',
      'draw',
      'line',
      'path',
      'text',
      'photo-layout',
      'trim',
      'background',
      'upload-image',
      'templates',
      'export-template',
      'download-image',
      'animation',
      'undo',
      'redo',
      'clear',
      'fullscreen',
    ];
    const templateApi = createMockTemplateApi();
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
    let isRestoringDraft = true;
    let draftSaveTimer = null;
    let draftSaveQueue = Promise.resolve();
    let draftSaveErrorShown = false;

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
      upload: document.querySelector('#background-upload-button'),
      fileCard: document.querySelector('#background-file-card'),
      fileName: document.querySelector('#background-file-name'),
      fileDetails: document.querySelector('#background-file-details'),
      remove: document.querySelector('#background-remove-button'),
      fitSettings: document.querySelector('#background-fit-settings'),
      fitButtons: document.querySelectorAll('[data-background-fit]'),
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

    function renderBackgroundControls() {
      const hasBackground = Boolean(imgEditor.canvas.backgroundImage);

      backgroundControls.upload.textContent = hasBackground
        ? translate('Заменить фоновое изображение', 'Replace background image')
        : translate('Выбрать фоновое изображение', 'Choose background image');
      backgroundControls.fileCard.hidden = !hasBackground;
      backgroundControls.fitSettings.hidden = !hasBackground;

      if (!hasBackground) {
        return;
      }

      backgroundControls.fileName.textContent = backgroundState.fileName;
      backgroundControls.fileDetails.textContent = [
        `${backgroundState.sourceWidth} × ${backgroundState.sourceHeight} px`,
        formatFileSize(backgroundState.fileSize),
      ].filter(Boolean).join(' · ');

      backgroundControls.fitButtons.forEach(button => {
        const isActive = button.dataset.backgroundFit === backgroundState.fitMode;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
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
        'fontFile',
      ]);
    }

    async function saveCurrentDraft() {
      if (isRestoringDraft) {
        return;
      }

      await window.saveInBrowser.save(DRAFT_KEY, {
        version: 2,
        savedAt: Date.now(),
        canvas: canvasDraftJSON(),
        backgroundFill: imgEditor.getBackgroundFillState(),
        printTrim: imgEditor.getPrintTrimState(),
        trimPreview: imgEditor.getTrimPreviewState(),
        photoLayoutView: imgEditor.getPhotoLayoutViewState(),
        fonts: [...fontAssets.values()].filter(asset => asset.source !== 'bundled'),
        templateExport: {
          key: document.querySelector('#export-template-key')?.value || 'grid',
          label: document.querySelector('#export-template-label')?.value || '',
        },
      });
      draftSaveErrorShown = false;
    }

    function queueDraftSave() {
      if (isRestoringDraft) {
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

      if (!draft || draft.version !== 2 || !draft.canvas) {
        return false;
      }

      imgEditor.canvas.historyProcessing = true;

      try {
        await restoreFontAssets(draft.fonts);
        await restoreOnlineFonts(draft.canvas);
        await loadCanvasJSON(draft.canvas);
        imgEditor.syncPhotoLayout();
        imgEditor.setPhotoLayoutViewState(draft.photoLayoutView);
        imgEditor.setBackgroundFillState(draft.backgroundFill);
        imgEditor.setPrintTrimState(draft.printTrim);
        imgEditor.setTrimPreviewState(draft.trimPreview);
        if (draft.templateExport) {
          exportControls.key.value = draft.templateExport.key || 'grid';
          exportControls.label.value = draft.templateExport.label || '';
        }

        const backgroundImage = imgEditor.canvas.backgroundImage;

        Object.assign(backgroundState, {
          fileName: backgroundImage?.assetFileName
            || (backgroundImage
              ? translate('Фоновое изображение', 'Background image')
              : null),
          fileSize: backgroundImage?.assetFileSize || null,
          sourceWidth: backgroundImage?.width || null,
          sourceHeight: backgroundImage?.height || null,
          fitMode: ['cover', 'stretch'].includes(backgroundImage?.backgroundFitMode)
            ? backgroundImage.backgroundFitMode
            : 'cover',
        });

        imgEditor.canvas.requestRenderAll();
        imgEditor.fitZoom();
        renderBackgroundControls();
      } finally {
        imgEditor.canvas.historyProcessing = false;
        imgEditor.canvas.clearHistory();
        imgEditor.canvas._historySaveAction();
      }

      return true;
    }

    function applyBackgroundFit(image, fitMode) {
      const widthScale = PRINT_WIDTH / image.width;
      const heightScale = PRINT_HEIGHT / image.height;
      const scaleX = fitMode === 'stretch'
        ? widthScale
        : Math.max(widthScale, heightScale);
      const scaleY = fitMode === 'stretch'
        ? heightScale
        : Math.max(widthScale, heightScale);

      image.set({
        originX: 'center',
        originY: 'center',
        left: PRINT_WIDTH / 2,
        top: PRINT_HEIGHT / 2,
        scaleX,
        scaleY,
        angle: 0,
        selectable: false,
        evented: false,
        backgroundFitMode: fitMode,
      });
      image.setCoords();

      return { scaleX, scaleY };
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

      if (!isRestoringDraft) {
        await flushDraftSave();
      }

      console.info('[template-studio] background loaded', {
        sourceSize: [image.width, image.height],
        printSize: [PRINT_WIDTH, PRINT_HEIGHT],
        fitMode,
        scale: [scales.scaleX, scales.scaleY],
      });
    }

    function chooseBackgroundFit(file, image) {
      const previousFocus = document.activeElement;
      const dialog = document.createElement('div');
      dialog.className = 'background-fit-dialog';
      dialog.innerHTML = `
        <div class="background-fit-dialog-card" role="dialog" aria-modal="true" aria-labelledby="background-fit-title">
          <div class="background-fit-dialog-header">
            <span class="background-fit-dialog-mark" aria-hidden="true">!</span>
            <div>
              <h2 id="background-fit-title">
                ${translate('Размер фона не совпадает', 'Background size does not match')}
              </h2>
              <p class="background-fit-source"></p>
            </div>
          </div>
          <p class="background-fit-question">
            ${translate('Как разместить изображение в макете?', 'How should the image fit the canvas?')}
          </p>
          <div class="background-fit-choices">
            <button class="background-fit-choice recommended" type="button" data-fit-choice="cover">
              <span class="background-fit-choice-preview preview-cover" aria-hidden="true"><i></i></span>
              <span class="background-fit-choice-copy">
                <strong>${translate('Заполнить с обрезкой', 'Fill and crop')}</strong>
                <span>${translate(
                  'Без искажений. Лишнее по краям будет обрезано.',
                  'Keeps proportions and crops anything outside the edges.',
                )}</span>
              </span>
              <em>${translate('Рекомендуется', 'Recommended')}</em>
            </button>
            <button class="background-fit-choice" type="button" data-fit-choice="stretch">
              <span class="background-fit-choice-preview preview-stretch" aria-hidden="true"><i></i></span>
              <span class="background-fit-choice-copy">
                <strong>${translate('Растянуть по размеру', 'Stretch to fit')}</strong>
                <span>${translate(
                  'Вся картинка поместится, но её пропорции изменятся.',
                  'Shows the whole image, but changes its proportions.',
                )}</span>
              </span>
            </button>
          </div>
          <button class="background-fit-cancel" type="button" data-fit-cancel>
            ${translate('Отмена', 'Cancel')}
          </button>
        </div>
      `;
      dialog.querySelector('.background-fit-source').textContent = translate(
        `${file.name}: ${image.width} × ${image.height} px, макет: ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
        `${file.name}: ${image.width} × ${image.height} px, canvas: ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
      );
      document.body.appendChild(dialog);

      return new Promise(resolve => {
        let settled = false;

        const finish = fitMode => {
          if (settled) {
            return;
          }

          settled = true;
          document.removeEventListener('keydown', handleKeydown);
          dialog.remove();
          previousFocus?.focus();
          resolve(fitMode);
        };

        const handleKeydown = event => {
          if (event.key === 'Escape') {
            finish(null);
          }
        };

        dialog.addEventListener('click', event => {
          const choice = event.target.closest('[data-fit-choice]');

          if (choice) {
            finish(choice.dataset.fitChoice);
            return;
          }

          if (event.target === dialog || event.target.closest('[data-fit-cancel]')) {
            finish(null);
          }
        });
        document.addEventListener('keydown', handleKeydown);
        dialog.querySelector('[data-fit-choice="cover"]').focus();
      });
    }

    async function setBackgroundSource(source, asset = {}, fitMode = 'cover') {
      if (fitMode !== 'cover' && fitMode !== 'stretch') {
        throw new Error(`Unknown background fit mode: ${fitMode}`);
      }

      const image = await loadFabricImage(source);
      const fileName = asset.name
        || (asset.path ? asset.path.split('/').pop() : null)
        || translate('Фоновое изображение', 'Background image');

      await installBackgroundImage(image, {
        fileName,
        fileSize: asset.size || null,
      }, fitMode);

      return true;
    }

    async function setBackgroundFile(file) {
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
      } catch (error) {
        throw new Error(translate(
          'Не удалось прочитать изображение',
          'Could not decode the image',
        ));
      }

      let fitMode = 'cover';
      const dimensionsMatch = image.width === PRINT_WIDTH
        && image.height === PRINT_HEIGHT;

      if (!dimensionsMatch) {
        fitMode = await chooseBackgroundFit(file, image);
      }

      if (!fitMode) {
        return false;
      }

      await installBackgroundImage(image, {
        fileName: file.name,
        fileSize: file.size,
      }, fitMode);

      return true;
    }

    function setBackgroundFit(fitMode) {
      const image = imgEditor.canvas.backgroundImage;

      if (!image || (fitMode !== 'cover' && fitMode !== 'stretch')) {
        return;
      }

      applyBackgroundFit(image, fitMode);
      backgroundState.fitMode = fitMode;
      imgEditor.canvas.requestRenderAll();
      renderBackgroundControls();
      queueDraftSave();
    }

    function removeBackground() {
      imgEditor.canvas.setBackgroundImage(null, () => {
        imgEditor.canvas.requestRenderAll();
      });

      Object.assign(backgroundState, {
        fileName: null,
        fileSize: null,
        sourceWidth: null,
        sourceHeight: null,
        fitMode: 'cover',
      });

      renderBackgroundControls();
      queueDraftSave();
      imgEditor.toast(
        translate('Фоновое изображение удалено', 'Background image removed'),
        'Success',
      );
    }

    backgroundControls.upload.addEventListener('click', () => {
      backgroundInput.click();
    });
    backgroundControls.remove.addEventListener('click', removeBackground);
    backgroundControls.fitButtons.forEach(button => {
      button.addEventListener('click', () => {
        setBackgroundFit(button.dataset.backgroundFit);
      });
    });
    renderBackgroundControls();

    const exportControls = {
      key: document.querySelector('#export-template-key'),
      label: document.querySelector('#export-template-label'),
      summary: document.querySelector('#template-export-summary'),
      config: document.querySelector('#download-template-config'),
      package: document.querySelector('#download-template-package'),
    };
    const importControls = {
      config: document.querySelector('#import-template-config'),
      background: document.querySelector('#import-template-background'),
      choice: document.querySelector('#import-template-choice'),
      key: document.querySelector('#import-template-key'),
      backgroundHint: document.querySelector('#import-template-background-hint'),
      run: document.querySelector('#import-template-run'),
      fonts: document.querySelector('#import-template-fonts'),
      fontInput: document.querySelector('#import-template-font-input'),
      status: document.querySelector('#import-template-status'),
    };
    let importConfig = null;
    let missingImportFonts = [];

    function isTextObject(object) {
      return textTypes.has(object?.type);
    }

    function round(value, digits = 3) {
      const multiplier = 10 ** digits;
      return Math.round(Number(value) * multiplier) / multiplier;
    }

    function normalizedColor(value, fallback = '#000000') {
      const color = String(value || '').trim().toLowerCase();
      const shortHex = color.match(/^#([0-9a-f]{3,4})$/i);
      const fullHex = color.match(/^#([0-9a-f]{6}|[0-9a-f]{8})$/i);
      const rgba = color.match(
        /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d*(?:\.\d+)?))?\s*\)$/i,
      );

      if (shortHex) {
        return `#${[...shortHex[1]].map(character => character + character).join('')}`;
      }
      if (fullHex) {
        return `#${fullHex[1]}`;
      }
      if (rgba) {
        const channels = rgba.slice(1, 4).map(channel => (
          Math.max(0, Math.min(255, Math.round(Number(channel))))
        ));
        const alpha = rgba[4] === undefined || rgba[4] === ''
          ? 255
          : Math.max(0, Math.min(255, Math.round(Number(rgba[4]) * 255)));
        const digits = [...channels, ...(alpha < 255 ? [alpha] : [])]
          .map(channel => channel.toString(16).padStart(2, '0'))
          .join('');
        return `#${digits}`;
      }
      return fallback;
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

    function updateImportButton() {
      importControls.run.disabled = (
        importControls.run.classList.contains('busy')
        || !importConfig
        || !importControls.key.value
        || !importControls.background.files?.[0]
      );
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

    function importedTemplateDefinition(config, key) {
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

      const template = config.templates?.[key];
      const layout = template?.print_layout;
      const defaultSize = template?.photo_size_px;
      if (!template || !layout || typeof layout.background !== 'string') {
        throw templateImportError('В конфиге нет выбранного макета', 'Selected layout is missing');
      }
      if (
        layout.foreground
        || template.photo_choice === true
        || ![undefined, 'none'].includes(template.preview_rotation)
        || ![undefined, 'none'].includes(template.preview_split)
      ) {
        throw templateImportError(
          'Пока импортируются только обычные grid-макеты без foreground',
          'Only regular grid layouts without a foreground can be imported for now',
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

      const texts = rawTexts.map((block, index) => {
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
          || position.x > PRINT_WIDTH
          || position.y < 0
          || position.y > PRINT_HEIGHT
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
      });

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

      return {
        key,
        label: typeof template.label === 'string' && template.label.trim()
          ? template.label.trim()
          : key,
        photos,
        texts,
        trim,
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

    function exportTextBlock(object, usedFonts) {
      imgEditor.normalizeTextScale?.(object);
      object.set({ styles: {}, strokeUniform: true });

      const align = object.textAlign === 'left' || object.textAlign === 'right'
        ? object.textAlign
        : 'center';
      const anchor = object.getPointByOrigin(align, 'center');
      if (
        anchor.x < 0
        || anchor.x > PRINT_WIDTH
        || anchor.y < 0
        || anchor.y > PRINT_HEIGHT
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
      const key = exportControls.key.value.trim();
      const label = exportControls.label.value.trim() || translate('Открытка', 'Grid');

      if (!/^[a-z0-9_-]+$/i.test(key)) {
        throw new Error(translate(
          'Ключ шаблона: только латиница, цифры, _ и -',
          'Template key may contain only letters, numbers, _ and -',
        ));
      }
      return { key, label };
    }

    function buildTemplateConfig() {
      const { key, label } = exportSettings();
      const photoLayout = imgEditor.getPhotoLayoutState();
      const photos = photoLayout?.photos || [];
      const usedFonts = new Map();

      if (!photos.length) {
        throw new Error(translate('Добавьте хотя бы одно фото', 'Add at least one photo slot'));
      }

      const textBlocks = imgEditor.canvas.getObjects()
        .filter(object => isTextObject(object) && !object.excludeFromExport)
        .map(object => exportTextBlock(object, usedFonts));
      const firstPhoto = photos[0];
      const trim = imgEditor.getPrintTrimState?.() || PRINT_TRIM;
      const printTrim = {
        left: Math.round(Number(trim.left) || 0),
        top: Math.round(Number(trim.top) || 0),
        right: Math.round(Number(trim.right) || 0),
        bottom: Math.round(Number(trim.bottom) || 0),
      };
      printTrim.visible_size = [
        PRINT_WIDTH - printTrim.left - printTrim.right,
        PRINT_HEIGHT - printTrim.top - printTrim.bottom,
      ];

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

      if (textBlocks.length) {
        layout.texts = textBlocks;
        layout._texts_date_tokens = ['{dd}.{mm}.{yyyy}', '{dd} {month_ru} {yyyy}'];
      }

      return {
        key,
        usedFonts,
        config: {
          print_size: [PRINT_WIDTH, PRINT_HEIGHT],
          print_trim: printTrim,
          templates: {
            [key]: {
              label,
              photo_size_px: {
                width: Math.round(firstPhoto.width),
                height: Math.round(firstPhoto.height),
              },
              print_layout: layout,
              preview_rotation: 'none',
              preview_split: 'none',
            },
          },
        },
      };
    }

    function renderGridBackground() {
      const canvas = imgEditor.canvas;
      const currentZoom = canvas.getZoom();
      const hiddenObjects = canvas.getObjects().filter(object => (
        object.excludeFromExport
        || object.kind === 'photo-slot'
        || isTextObject(object)
      ));
      const visibility = hiddenObjects.map(object => object.visible);

      hiddenObjects.forEach(object => object.set('visible', false));
      imgEditor.applyZoom(1);

      try {
        canvas.requestRenderAll();
        return dataURLToBytes(canvas.toDataURL({
          format: 'png',
          multiplier: 1,
          width: PRINT_WIDTH,
          height: PRINT_HEIGHT,
        }));
      } finally {
        hiddenObjects.forEach((object, index) => object.set('visible', visibility[index]));
        imgEditor.applyZoom(currentZoom);
        canvas.requestRenderAll();
      }
    }

    function renderExportSummary() {
      if (!exportControls.summary || !imgEditor.canvas) return;

      const texts = imgEditor.canvas.getObjects().filter(isTextObject);
      const missingFonts = texts.filter(object => !fontAssetForObject(object));
      exportControls.summary.classList.toggle('warning', missingFonts.length > 0);
      exportControls.summary.textContent = translate(
        `Подписей: ${texts.length} · файлов шрифтов: ${fontAssets.size}${missingFonts.length ? ` · без файла: ${missingFonts.length}` : ''}`,
        `Text objects: ${texts.length} · font files: ${fontAssets.size}${missingFonts.length ? ` · missing files: ${missingFonts.length}` : ''}`,
      );
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

      queueDraftSave();
      renderExportSummary();
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

    async function installUploadedFontFile(file) {
      if (!FONT_FILE_PATTERN.test(file?.name || '') || !file?.size) {
        throw templateImportError(
          'Выберите непустой файл TTF или OTF',
          'Choose a non-empty TTF or OTF file',
        );
      }

      const duplicate = fontAssets.get(file.name);
      if (duplicate) return duplicate;

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

    function updateImportBackgroundHint() {
      const key = importControls.key.value;
      const expected = importConfig?.templates?.[key]?.print_layout?.background;
      importControls.backgroundHint.textContent = expected
        ? translate(`В конфиге: ${expected}`, `Configured file: ${expected}`)
        : '';
    }

    async function applyImportedTemplate(definition, backgroundImage, backgroundFile, fonts) {
      const canvas = imgEditor.canvas;
      const previousRestoring = isRestoringDraft;
      const previousHistoryProcessing = canvas.historyProcessing;
      let completed = false;

      isRestoringDraft = true;
      canvas.historyProcessing = true;
      try {
        canvas.discardActiveObject();
        canvas.getObjects().forEach(object => canvas.remove(object));
        await installBackgroundImage(backgroundImage, {
          fileName: backgroundFile.name,
          fileSize: backgroundFile.size,
        }, 'cover');

        if (!imgEditor.setPrintTrimState(definition.trim)) {
          throw templateImportError('Не удалось применить обрезку', 'Could not apply print trim');
        }
        if (!imgEditor.setPhotoLayoutState({
          photos: definition.photos,
          symmetry: { enabled: false },
        })) {
          throw templateImportError(
            'Не удалось восстановить фотослоты',
            'Could not restore photo slots',
          );
        }

        definition.texts.forEach(block => {
          const text = importedTextObject(block, fonts.get(block.font));
          canvas.add(text);
          text.setCoords();
        });

        exportControls.key.value = definition.key;
        exportControls.label.value = definition.label;
        imgEditor.activeSelection = null;
        canvas.requestRenderAll();
        imgEditor.fitZoom();
        renderExportSummary();
        completed = true;
      } finally {
        canvas.historyProcessing = previousHistoryProcessing;
        isRestoringDraft = previousRestoring;
      }

      if (completed && !previousHistoryProcessing) {
        canvas.clearHistory();
        canvas._historySaveAction();
      }
      await flushDraftSave();
    }

    async function runTemplateImport() {
      if (
        !importConfig
        || !importControls.key.value
        || !importControls.background.files?.[0]
      ) {
        updateImportButton();
        return;
      }

      importControls.run.classList.add('busy');
      importControls.run.disabled = true;
      setImportStatus(translate('Проверяю шаблон…', 'Checking template…'));

      try {
        const definition = importedTemplateDefinition(
          importConfig,
          importControls.key.value,
        );
        const resolvedFonts = await resolveImportedFonts(definition.texts);

        if (resolvedFonts.missing.length) {
          missingImportFonts = resolvedFonts.missing;
          importControls.fonts.hidden = false;
          setImportStatus(translate(
            `Не найдены шрифты: ${missingImportFonts.join(', ')}`,
            `Missing fonts: ${missingImportFonts.join(', ')}`,
          ), 'error');
          return;
        }

        clearMissingImportFonts();
        const backgroundFile = importControls.background.files[0];
        const validBackground = backgroundFile.size > 0 && (
          BACKGROUND_TYPES.has((backgroundFile.type || '').toLowerCase())
          || /\.(?:jpe?g|png|webp)$/i.test(backgroundFile.name)
        );
        if (!validBackground) {
          throw templateImportError(
            'Выберите непустой фон JPG, PNG или WEBP',
            'Choose a non-empty JPG, PNG or WEBP background',
          );
        }

        const source = await readFileAsDataURL(backgroundFile);
        const backgroundImage = await loadFabricImage(source);
        if (
          backgroundImage.width !== PRINT_WIDTH
          || backgroundImage.height !== PRINT_HEIGHT
        ) {
          throw templateImportError(
            `Фон должен быть ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
            `Background must be ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
          );
        }

        await applyImportedTemplate(
          definition,
          backgroundImage,
          backgroundFile,
          resolvedFonts.assets,
        );
        setImportStatus(
          translate(`Шаблон «${definition.label}» импортирован`, `“${definition.label}” imported`),
          'success',
        );
        imgEditor.toast(
          translate('Шаблон импортирован', 'Template imported'),
          'Success',
        );
      } catch (error) {
        console.error('[template-studio] import error', error);
        setImportStatus(error.message, 'error');
      } finally {
        importControls.run.classList.remove('busy');
        updateImportButton();
      }
    }

    importControls.config.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      importConfig = null;
      importControls.key.replaceChildren();
      importControls.choice.hidden = true;
      importControls.backgroundHint.textContent = '';
      clearMissingImportFonts();

      if (!file) {
        setImportStatus();
        updateImportButton();
        return;
      }

      try {
        const config = JSON.parse(await file.text());
        const keys = config?.templates
          && typeof config.templates === 'object'
          && !Array.isArray(config.templates)
          ? Object.keys(config.templates)
          : [];
        if (!keys.length) {
          throw templateImportError(
            'В config.json нет шаблонов',
            'config.json contains no templates',
          );
        }
        if (
          !Array.isArray(config.print_size)
          || config.print_size[0] !== PRINT_WIDTH
          || config.print_size[1] !== PRINT_HEIGHT
        ) {
          throw templateImportError(
            `Размер конфига должен быть ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
            `Config size must be ${PRINT_WIDTH} × ${PRINT_HEIGHT} px`,
          );
        }

        keys.forEach(key => {
          const option = document.createElement('option');
          const label = config.templates[key]?.label;
          option.value = key;
          option.textContent = label ? `${key} — ${label}` : key;
          importControls.key.appendChild(option);
        });
        importControls.key.value = keys.includes('grid') ? 'grid' : keys[0];
        importControls.choice.hidden = keys.length < 2;
        importConfig = config;
        updateImportBackgroundHint();
        setImportStatus(translate(
          `Конфиг прочитан: ${keys.length} макет(а)`,
          `Config loaded: ${keys.length} layout(s)`,
        ));
      } catch (error) {
        setImportStatus(error.message || translate(
          'Не удалось прочитать config.json',
          'Could not read config.json',
        ), 'error');
      }
      updateImportButton();
    });

    importControls.key.addEventListener('change', () => {
      clearMissingImportFonts();
      updateImportBackgroundHint();
      updateImportButton();
    });
    importControls.background.addEventListener('change', () => {
      clearMissingImportFonts();
      updateImportButton();
    });
    importControls.run.addEventListener('click', runTemplateImport);
    importControls.fonts.addEventListener('click', () => {
      importControls.fontInput.click();
    });
    importControls.fontInput.addEventListener('change', async event => {
      const files = [...(event.target.files || [])];
      event.target.value = '';
      if (!files.length) return;

      importControls.fonts.disabled = true;
      try {
        for (const file of files) {
          await installUploadedFontFile(file);
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

    exportControls.config.addEventListener('click', async () => {
      exportControls.config.disabled = true;

      try {
        await ensureOnlineFontAssets();
        const { config } = buildTemplateConfig();
        downloadBlob(new Blob([
          `${JSON.stringify(config, null, 2)}\n`,
        ], { type: 'application/json;charset=utf-8' }), 'config.json');
      } catch (error) {
        imgEditor.toast(error.message, 'Danger', 4000);
      } finally {
        exportControls.config.disabled = false;
      }
    });

    exportControls.package.addEventListener('click', async () => {
      exportControls.package.disabled = true;

      try {
        await ensureOnlineFontAssets();
        const { key, config, usedFonts } = buildTemplateConfig();
        const encoder = new TextEncoder();
        const files = [
          {
            name: 'config.json',
            data: encoder.encode(`${JSON.stringify(config, null, 2)}\n`),
          },
          { name: 'grid_bg.png', data: renderGridBackground() },
          ...packagedFontFiles(usedFonts, encoder),
        ];

        downloadBlob(zipFiles(files), `${key}.zip`);
        imgEditor.toast(
          translate('ZIP шаблона готов', 'Template ZIP is ready'),
          'Success',
        );
      } catch (error) {
        console.error('[template-studio] export error', error);
        imgEditor.toast(error.message, 'Danger', 4500);
      } finally {
        exportControls.package.disabled = false;
      }
    });

    [exportControls.key, exportControls.label].forEach(input => {
      input.addEventListener('change', queueDraftSave);
    });

    renderExportSummary();

    function canvasObjectsWithPositioning() {
      const canvasData = imgEditor.canvas.toJSON([
        'uniqueId',
        'kind',
        'photoIndex',
        'excludeFromExport',
        'excludeFromHistory',
        'fontFile',
      ]);

      return canvasData.objects
        .filter(object => !object.excludeFromExport && object.kind !== 'photo-slot')
        .map(object => {
          const leftOffset = object.left;
          const topOffset = object.top;
          const rightOffset = PRINT_WIDTH - leftOffset;
          const bottomOffset = PRINT_HEIGHT - topOffset;
          const nearestXSide = leftOffset <= rightOffset ? 'left' : 'right';
          const nearestYSide = topOffset <= bottomOffset ? 'top' : 'bottom';

          return {
            ...object,
            positioning: {
              xOffset: nearestXSide === 'left' ? leftOffset : rightOffset,
              yOffset: nearestYSide === 'top' ? topOffset : bottomOffset,
              nearestXSide,
              nearestYSide,
            },
          };
        });
    }

    function templateThumbnail() {
      const currentZoom = imgEditor.canvas.getZoom();
      const multiplier = Math.min(200 / PRINT_WIDTH, 200 / PRINT_HEIGHT);
      const photoSlots = imgEditor.canvas.getObjects()
        .filter(object => object.kind === 'photo-slot');
      const visibility = photoSlots.map(slot => slot.visible);

      photoSlots.forEach(slot => slot.set('visible', true));
      imgEditor.applyZoom(1);
      try {
        return imgEditor.canvas.toDataURL({
          format: 'png',
          multiplier,
          width: PRINT_WIDTH,
          height: PRINT_HEIGHT,
        });
      } finally {
        photoSlots.forEach((slot, index) => {
          slot.set('visible', visibility[index]);
        });
        imgEditor.applyZoom(currentZoom);
        imgEditor.canvas.requestRenderAll();
      }
    }

    let templates = [];
    let deleteMode = false;

    function renderTemplates() {
      const list = document.querySelector(
        `${imgEditor.containerSelector} #templates-panel .list-templates`,
      );
      list.replaceChildren();

      templates.forEach(template => {
        const preview = document.createElement('div');
        const image = document.createElement('img');
        const deleteButton = document.createElement('button');

        preview.className = 'template-preview';
        preview.dataset.id = template.id;
        image.src = template.data.thumb;
        image.alt = 'Template preview';
        deleteButton.className = 'delete-button';
        deleteButton.type = 'button';
        deleteButton.textContent = '×';
        preview.append(image, deleteButton);
        list.appendChild(preview);
      });
    }

    async function reloadTemplates() {
      templates = await templateApi.listTemplates();
      renderTemplates();
    }

    backgroundInput.addEventListener('change', async event => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) {
        return;
      }

      try {
        const wasLoaded = await setBackgroundFile(file);
        if (!wasLoaded) {
          return;
        }

        imgEditor.toast(
          window.lang === 'ru' ? 'Фон загружен' : 'Background loaded',
          'Success',
        );
      } catch (error) {
        console.error('[template-studio] background error', error);
        imgEditor.toast(error.message, 'Danger', 3000);
      }
    });

    document.addEventListener('click', async event => {
      const preview = event.target.closest('.template-preview');
      if (!preview) {
        return;
      }

      const template = templates.find(item => item.id === preview.dataset.id);
      if (!template) {
        return;
      }

      if (deleteMode) {
        await templateApi.deleteTemplate(template.id);
        await reloadTemplates();
        return;
      }

      imgEditor.setPhotoLayoutState(template.data.photoLayout);
      imgEditor.applyTemplate(template.data.objects);
    });

    document.addEventListener('click', async event => {
      if (event.target.closest('.app-new-template')) {
        const template = await templateApi.saveTemplate({
          thumb: templateThumbnail(),
          objects: canvasObjectsWithPositioning(),
          photoLayout: imgEditor.getPhotoLayoutState(),
        });
        templates.push(template);
        renderTemplates();
        imgEditor.toast(
          window.lang === 'ru' ? 'Шаблон сохранён в памяти' : 'Template saved in memory',
          'Success',
        );
        return;
      }

      const deleteButton = event.target.closest('.app-delete-template');
      if (!deleteButton) {
        return;
      }

      deleteMode = !deleteMode;
      deleteButton.classList.toggle('active', deleteMode);
      deleteButton.classList.toggle('delete-active', deleteMode);
      deleteButton.textContent = deleteMode
        ? (window.lang === 'ru' ? 'Готово' : 'Done')
        : (window.lang === 'ru' ? 'Удаление' : 'Delete');
      document.querySelectorAll('.template-preview').forEach(preview => {
        preview.classList.toggle('delete-mode', deleteMode);
      });
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
        queueDraftSave();
        renderExportSummary();
      });
    });

    window.templateStudio = {
      editor: imgEditor,
      printSize: [PRINT_WIDTH, PRINT_HEIGHT],
      background: backgroundState,
      templateApi,
      setBackgroundFile,
      setBackgroundSource,
      setBackgroundFit,
      removeBackground,
      saveDraft: saveCurrentDraft,
    };

    await installBundledFonts();

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
      isRestoringDraft = false;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushDraftSave();
      }
    });

    window.addEventListener('beforeunload', () => {
      flushDraftSave();
    });

    reloadTemplates().catch(error => {
      console.error('[mock-template-api] could not load templates', error);
    });

    document.querySelector('.appLoader')?.remove();
    console.info('[template-studio] ready', {
      printSize: [PRINT_WIDTH, PRINT_HEIGHT],
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
