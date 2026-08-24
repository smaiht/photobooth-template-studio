(function () {
  'use strict';

  const PRINT_WIDTH = 3688;
  const PRINT_HEIGHT = 2480;
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
        if (!image) {
          reject(new Error('Could not decode background image'));
          return;
        }
        resolve(image);
      });
    });
  }

  function start() {
    const buttons = [
      'select',
      'shapes',
      'draw',
      'line',
      'path',
      'textbox',
      'background',
      'background-image',
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
    const backgroundInput = document.createElement('input');
    const backgroundState = {
      file: null,
      objectUrl: null,
      assetPath: null,
    };

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
      templates: [],
      canvasSizeBlock: true,
    });

    imgEditor.canvas.backgroundColor = '#ffffff';
    imgEditor.canvas.requestRenderAll();
    imgEditor.setActiveTool('select');

    async function setBackgroundSource(source, asset = {}) {
      const image = await loadFabricImage(source);
      const scale = Math.max(
        PRINT_WIDTH / image.width,
        PRINT_HEIGHT / image.height,
      );

      image.set({
        originX: 'center',
        originY: 'center',
        left: PRINT_WIDTH / 2,
        top: PRINT_HEIGHT / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });

      await new Promise(resolve => {
        imgEditor.canvas.setBackgroundImage(image, resolve);
      });

      imgEditor.canvas.requestRenderAll();
      imgEditor.fitZoom();
      backgroundState.assetPath = asset.path || source;
      console.info('[template-studio] background loaded', {
        sourceSize: [image.width, image.height],
        printSize: [PRINT_WIDTH, PRINT_HEIGHT],
        scale,
        assetPath: backgroundState.assetPath,
      });
    }

    async function setBackgroundFile(file) {
      if (!BACKGROUND_TYPES.has(file.type)) {
        throw new Error('Choose a JPG, PNG or WEBP image');
      }

      const objectUrl = URL.createObjectURL(file);
      const previousObjectUrl = backgroundState.objectUrl;

      try {
        await setBackgroundSource(objectUrl, {
          path: `assets/${file.name}`,
        });
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
      }

      backgroundState.file = file;
      backgroundState.objectUrl = objectUrl;
      if (previousObjectUrl) {
        URL.revokeObjectURL(previousObjectUrl);
      }
    }

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
        await setBackgroundFile(file);
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

    window.templateStudio = {
      editor: imgEditor,
      printSize: [PRINT_WIDTH, PRINT_HEIGHT],
      background: backgroundState,
      templateApi,
      setBackgroundFile,
      setBackgroundSource,
    };

    window.addEventListener('beforeunload', () => {
      if (backgroundState.objectUrl) {
        URL.revokeObjectURL(backgroundState.objectUrl);
      }
    });

    reloadTemplates().catch(error => {
      console.error('[mock-template-api] could not load templates', error);
    });

    document.querySelector('.appLoader')?.remove();
    console.info('[template-studio] ready', {
      printSize: [PRINT_WIDTH, PRINT_HEIGHT],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
