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
  const DRAFT_KEY = 'current-project';
  const BACKGROUND_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

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

  async function start() {
    const buttons = [
      'select',
      'shapes',
      'draw',
      'line',
      'path',
      'textbox',
      'trim',
      'background',
      'upload-image',
      'templates',
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

    const imgEditor = new ImageEditor('#image-editor-container', {
      buttons,
      shapes: [],
      images: [],
      dimensions: {
        width: PRINT_WIDTH,
        height: PRINT_HEIGHT,
      },
      trim: PRINT_TRIM,
      templates: [],
      canvasSizeBlock: true,
    });

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
      ]);
    }

    async function saveCurrentDraft() {
      if (isRestoringDraft) {
        return;
      }

      await window.saveInBrowser.save(DRAFT_KEY, {
        version: 1,
        savedAt: Date.now(),
        canvas: canvasDraftJSON(),
        backgroundFill: imgEditor.getBackgroundFillState(),
        trimPreview: imgEditor.getTrimPreviewState(),
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

      if (!draft || draft.version !== 1 || !draft.canvas) {
        return false;
      }

      imgEditor.canvas.historyProcessing = true;

      try {
        await loadCanvasJSON(draft.canvas);
        imgEditor.setBackgroundFillState(draft.backgroundFill);
        imgEditor.setTrimPreviewState(draft.trimPreview);

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

    function canvasObjectsWithPositioning() {
      const canvasData = imgEditor.canvas.toJSON([
        'uniqueId',
        'kind',
        'photoIndex',
        'excludeFromExport',
        'excludeFromHistory',
      ]);

      return canvasData.objects
        .filter(object => !object.excludeFromExport)
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

      imgEditor.applyZoom(1);
      try {
        return imgEditor.canvas.toDataURL({
          format: 'png',
          multiplier,
          width: PRINT_WIDTH,
          height: PRINT_HEIGHT,
        });
      } finally {
        imgEditor.applyZoom(currentZoom);
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

      imgEditor.applyTemplate(template.data.objects);
    });

    document.addEventListener('click', async event => {
      if (event.target.closest('.app-new-template')) {
        const template = await templateApi.saveTemplate({
          thumb: templateThumbnail(),
          objects: canvasObjectsWithPositioning(),
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
    ];
    draftEvents.forEach(eventName => {
      imgEditor.canvas.on(eventName, queueDraftSave);
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
