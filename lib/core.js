/**
 * The Core of Image Editor
 */
(function () {
  'use strict';

  /**
   * Image Editor class
   * @param {String} containerSelector jquery selector for image editor container
   * @param {Array} buttons define toolbar buttons 
   * @param {Array} shapes define shapes
   * @param {Array} images define images
   * @param {Array} templates define templates
  */
  var ImageEditor = function (containerSelector, options) {
    const {
      buttons,
      shapes,
      images,
      dimensions,
      trim,
      photoLayout,
      templates,
      canvasSizeBlock = false,
    } = options

    this.containerSelector = containerSelector;
    this.containerEl = $(containerSelector);

    this.dimensions = {
      width: dimensions && dimensions.width > 0 ? dimensions.width : 800,
      height: dimensions && dimensions.height > 0 ? dimensions.height : 600
    }
    this.trim = trim ? { ...trim } : null;
    this.photoLayout = photoLayout || null;
    this.buttons = buttons;
    this.shapes = shapes;
    this.images = images;
    this.templates = templates;

    this.containerEl.addClass('default-container');

    this.canvas = null;
    this.activeTool = null;
    this.activeSelection = null;
    this.canvasSizeBlock = canvasSizeBlock === true ? true : false;
    /**
     * Get current state of canvas as object
     * @returns {Object}
     */
    this.getCanvasJSON = () => {
      return this.canvas.toJSON();
    }

    /**
     * Set canvas status by object
     * @param {Object} current the object of fabric canvas status
     */
    this.setCanvasJSON = (current) => {
      current && this.canvas.loadFromJSON(JSON.parse(current), this.canvas.renderAll.bind(this.canvas))
    }

    /**
     * Event handler to set active tool
     * @param {String} id tool id
     */
    this.setActiveTool = (id, forceClose = false) => {
      const visiblePanel = document.querySelector(`${containerSelector} .toolpanel.visible`);
      const closingSamePanel = Boolean(
        forceClose && visiblePanel?.id === `${id}-panel`,
      );
      const rareTools = ['shapes', 'draw', 'line', 'path'];
      const toolbarId = rareTools.includes(id) ? 'create-tools' : id;
      const nextTool = closingSamePanel ? null : id;

      $(
        `${containerSelector} #toolbar .main-buttons > button, `
        + `${containerSelector} #toolbar .toolbar-tool-popover button`,
      ).removeClass('active');
      if (nextTool) {
        $(`${containerSelector} #toolbar button#${toolbarId}`).addClass('active');
        $(`${containerSelector} #toolbar [data-create-tool="${id}"]`).addClass('active');
      }

      document.querySelectorAll(`${containerSelector} .toolpanel`).forEach(panel => {
        panel.classList.remove('visible');
      });

      this.activeTool = nextTool;
      if (id !== 'select') {
        this.canvas.discardActiveObject();
        this.activeSelection = null;
      }

      const newPanel = !closingSamePanel
        ? document.querySelector(`${containerSelector} .toolpanel#${id}-panel`)
        : null;
      if (newPanel && (id !== 'select' || this.activeSelection)) {
        if (id === 'select') {
          newPanel.className = `toolpanel visible type-${this.activeSelection.type}`;
        } else {
          newPanel.classList.add('visible');
        }
      }

      if (id === 'select' && this.activeSelection) {
        this.setSelectionValues();
      }

      this.canvas.isDrawingLineMode = false;
      this.canvas.isDrawingPathMode = false;
      this.canvas.isDrawingMode = false;
      this.canvas.isDrawingTextMode = false;

      this.canvas.defaultCursor = 'default';
      this.canvas.selection = true;
      const photoLayoutEditing = nextTool === 'photo-layout' && this.canvas
        .getObjects()
        .some(object => object.kind === 'photo-slot' && object.editorLocked !== true);
      const blocksSelection = ['line', 'path', 'text'].includes(nextTool);
      this.canvas.forEachObject(o => {
        const interactive = o.kind === 'photo-slot'
          ? nextTool === 'photo-layout' && o.editorLocked !== true
          : o.editorLocked !== true && !photoLayoutEditing && !blocksSelection;
        o.selectable = interactive;
        o.evented = interactive;
      })

      switch (nextTool) {
        case 'draw':
          this.canvas.isDrawingMode = true;
          break;
        case 'line':
          this.canvas.isDrawingLineMode = true
          this.canvas.defaultCursor = 'crosshair'
          this.canvas.selection = false
          break;
        case 'path':
          this.canvas.isDrawingPathMode = true
          this.canvas.defaultCursor = 'crosshair'
          this.canvas.selection = false
          // this.updateTip('Tip: click to place points, press and pull for curves! Click outside or press Esc to cancel!');
          break;
        case 'text':
          this.canvas.isDrawingTextMode = true
          this.canvas.defaultCursor = 'crosshair'
          this.canvas.selection = false
          break;
        case 'upload':
          this.openDragDropPanel();
          break;
        default:
          // this.updateTip('Tip: hold Shift when drawing a line for 15° angle jumps!');
          break;
      }

      this.canvas.requestRenderAll();
    }

    /**
     * Event handler when perform undo
     */
    // this.undo = () => {
    //   console.log('undo')
    //   try {
    //     let undoList = this.history.getValues().undo;
    //     if (undoList.length) {
    //       let current = undoList[undoList.length - 1];
    //       this.history.undo();
    //       current && this.canvas.loadFromJSON(JSON.parse(current), this.canvas.renderAll.bind(this.canvas))
    //     }
    //   } catch (_) {
    //     console.error("undo failed")
    //   }
    // }

    // /**
    //  * Event handler when perform redo
    //  */
    // this.redo = () => {
    //   console.log('redo')
    //   try {
    //     let redoList = this.history.getValues().redo;
    //     if (redoList.length) {
    //       let current = redoList[redoList.length - 1];
    //       this.history.redo();
    //       current && this.canvas.loadFromJSON(JSON.parse(current), this.canvas.renderAll.bind(this.canvas))
    //     }
    //   } catch (_) {
    //     console.error("redo failed")
    //   }
    // }

    /**
     * Event handler when select objects on fabric canvas
     * @param {Object} activeSelection fabric js object
     */
    this.setActiveSelection = (activeSelection) => {
      const selected = activeSelection && activeSelection[0]
        ? activeSelection[0]
        : activeSelection;
      const selectedObjects = Array.isArray(activeSelection)
        ? activeSelection
        : [selected];
      if (selectedObjects.some(object => object?.kind === 'photo-slot')) {
        this.activeSelection = null;
        return;
      }

      this.activeSelection = selected;
      if (!selected) {
        if (this.activeTool === 'select') {
          this.setActiveTool('select');
        }
        return;
      }

      this.setActiveTool('select');
    }

    /**
     * Initialize undo/redo stack
     */
    this.configUndoRedoStack = () => {
      if (!this.canvas) {
        console.error('Canvas not initialized');
        return;
      }

      this.canvas._historyInit();
      this.canvas._historySaveAction();
    
      const handleKeyboard = (e) => {
        if (
          e.target?.closest?.('input, textarea, select, [contenteditable="true"]')
          || this.canvas.getActiveObject()?.isEditing
          || !(e.ctrlKey || e.metaKey)
          || e.altKey
        ) return;

        const key = e.key.toLowerCase();
        const undo = key === 'z' && !e.shiftKey;
        const redo = (key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey);
        if (!undo && !redo) return;

        e.preventDefault();
        if (undo && this.canvas.canUndo()) {
          this.canvas.undo(() => console.log('Undo completed'));
        } else if (redo && this.canvas.canRedo()) {
          this.canvas.redo(() => console.log('Redo completed'));
        }
      };
    
      document.addEventListener('keydown', handleKeyboard);
    
      // Добавляем обработчики событий истории
      this.canvas.on('history:append', () => {
        console.log('History state saved');
      });
    
      this.canvas.on('history:undo', () => {
        console.log('Undo performed');
      });
    
      this.canvas.on('history:redo', () => {
        console.log('Redo performed');
      });
    };
    // this.configUndoRedoStack = () => {
    //   this.history = window.UndoRedoStack();
    //   const ctrZY = (e) => {
    //     const key = e.which || e.keyCode;

    //     if (e.ctrlKey && document.querySelectorAll('textarea:focus, input:focus').length === 0) {
    //       if (key === 90) this.undo()
    //       if (key === 89) this.redo()
    //     }
    //   }
    //   document.addEventListener('keydown', ctrZY)
    // }

    /**
     * Initialize image editor
     */
    this.init = () => {
      this.initializeToolbar();
      this.initializeMainPanel();
      this.initializeTemplateExportPanel();

      this.canvas = this.initializeCanvas();
      this.canvas.printTrim = this.trim ? {
        ...this.trim,
        visible_size: [
          this.dimensions.width - this.trim.left - this.trim.right,
          this.dimensions.height - this.trim.top - this.trim.bottom,
        ],
      } : null;
      this.initializeShapes();
      this.initializeImages();
      this.initializeFreeDrawSettings();
      this.initializeCanvasSettingPanel();
      this.initializePhotoLayout();
      this.initializeAnimations(this.canvas);
      this.initializeSelectionSettings();
      this.configUndoRedoStack();

      this.initializeLineDrawing(this.canvas);
      this.initializePathDrawing(this.canvas);
      this.initializeTextDrawing(this.canvas);
      this.initializeUpload(this.canvas);
      this.initializeCopyPaste(this.canvas);

      this.initializeTipSection();

      this.initializeUtilsEvents()

      this.initializeZoomEvents();
      this.initializeFullscreenEvents();

      this.initializeNotification()

      this.extendNumberInput();

      this.fitZoom()


    }

    /**
     * Initialize main panel 
     */
    this.initializeMainPanel = () => {
      $(`${containerSelector}`).append('<div class="main-panel"></div>');
    }
    this.initializeTemplateExportPanel = () => {
      $(`${containerSelector} .main-panel`).append(`
        <div class="toolpanel" id="export-template-panel">
          <div class="content template-export-content">
            <p class="title">
              ${window.lang == 'ru' ? 'Шаблон' : 'Template'}
            </p>

            <section class="template-gallery-section">
              <div class="template-gallery-heading">
                <h4>${window.lang == 'ru' ? 'Галерея' : 'Gallery'}</h4>
                <p class="section-hint">
                  ${window.lang == 'ru'
                    ? 'Шаблоны загружаются только после выбора.'
                    : 'Templates are downloaded only after selection.'}
                </p>
              </div>
              <p class="template-gallery-status" role="status">
                ${window.lang == 'ru'
                  ? 'Откройте панель, чтобы обновить список.'
                  : 'Open the panel to refresh the list.'}
              </p>
              <div class="list-templates" hidden></div>
            </section>

            <hr class="template-transfer-divider">

            <section class="template-import-section">
              <h4>${window.lang == 'ru' ? 'Импорт' : 'Import'}</h4>
              <p class="section-hint">
                ${window.lang == 'ru'
                  ? 'Откройте готовый ZIP или папку шаблона. Грид и левая полоса восстановятся вместе.'
                  : 'Open a template ZIP or folder. Grid and the left strip are restored together.'}
              </p>
              <label class="template-import-file">
                <span>${window.lang == 'ru' ? 'ZIP шаблона' : 'Template ZIP'}</span>
                <input id="import-template-package" type="file" accept=".zip,application/zip">
              </label>
              <label class="template-import-file">
                <span>${window.lang == 'ru' ? 'Или папка шаблона' : 'Or template folder'}</span>
                <input id="import-template-folder" type="file" webkitdirectory multiple>
              </label>
              <div class="template-export-actions">
                <button id="import-template-fonts" type="button" hidden>
                  ${window.lang == 'ru' ? 'Загрузить недостающие шрифты' : 'Upload missing fonts'}
                </button>
                <input id="import-template-font-input" type="file" accept=".ttf,.otf,font/ttf,font/otf" multiple hidden>
              </div>
              <p class="template-import-status" id="import-template-status" role="status" hidden></p>
            </section>

            <hr class="template-transfer-divider">

            <section class="template-export-section">
              <h4>${window.lang == 'ru' ? 'Экспорт' : 'Export'}</h4>
              <p class="section-hint">
                ${window.lang == 'ru'
                  ? 'Один ZIP: config, оба готовых фона и используемые шрифты.'
                  : 'One ZIP containing config, both rendered backgrounds and used fonts.'}
              </p>
              <div class="input-container">
                <label>${window.lang == 'ru' ? 'Имя ZIP / папки' : 'ZIP / folder name'}</label>
                <input id="export-template-name" type="text" value="template" spellcheck="false">
              </div>
              <div class="template-export-summary" id="template-export-summary"></div>
              <div class="template-export-actions">
                <button id="download-template-config" type="button">
                  ${window.lang == 'ru' ? 'Скачать config.json' : 'Download config.json'}
                </button>
                <button id="download-template-grid-background" type="button">
                  ${window.lang == 'ru' ? 'Скачать grid_bg.png' : 'Download grid_bg.png'}
                </button>
                <button id="download-template-strip-background" type="button">
                  ${window.lang == 'ru' ? 'Скачать strip_bg.png' : 'Download strip_bg.png'}
                </button>
                <button class="primary" id="download-template-package" type="button">
                  ${window.lang == 'ru' ? 'Скачать ZIP шаблона' : 'Download template ZIP'}
                </button>
              </div>
            </section>

            <hr class="template-transfer-divider">

            <section class="template-yadisk-section">
              <h4>${window.lang == 'ru' ? 'Экспорт на Яндекс Диск' : 'Export to Yandex Disk'}</h4>
              <p class="section-hint">
                ${window.lang == 'ru'
                  ? 'Файлы попадут в photobooth_system/templates_custom/<имя>/. Токен переживает F5 и удаляется при закрытии вкладки.'
                  : 'Files are uploaded to photobooth_system/templates_custom/<name>/. The token survives refresh and is cleared when the tab closes.'}
              </p>
              <div class="input-container">
                <label>${window.lang == 'ru' ? 'OAuth-токен Яндекс Диска' : 'Yandex Disk OAuth token'}</label>
                <input id="yadisk-template-token" type="password" autocomplete="off" spellcheck="false">
              </div>
              <div class="input-container">
                <label>${window.lang == 'ru' ? 'Имя шаблона' : 'Template name'}</label>
                <input id="yadisk-template-name" type="text" value="template" autocomplete="off" spellcheck="false">
              </div>
              <div class="template-export-actions">
                <button class="primary" id="export-template-yadisk" type="button">
                  ${window.lang == 'ru' ? 'Экспортировать на Яндекс Диск' : 'Export to Yandex Disk'}
                </button>
              </div>
              <p class="template-import-status" id="yadisk-template-status" role="status" hidden></p>
            </section>
          </div>
        </div>
      `);
    }

    /**
     * Extend custom number input with increase/decrease button
     */
    this.extendNumberInput = () => {
      $(`${containerSelector} .decrease`).click(function () {
        let input = $(this).closest('.custom-number-input').find('input[type=number]')
        let step = input.attr('step');
        if (!step) step = 1;
        else {
          step = parseFloat(step);
        }
        let val = parseFloat(input.val());
        input.val((val - step).toFixed(step.countDecimals()));
        input.change();
      })
      $(`${containerSelector} .increase`).click(function () {
        let input = $(this).closest('.custom-number-input').find('input[type=number]')
        let step = input.attr('step');
        if (!step) step = 1;
        else {
          step = parseFloat(step);
        }
        let val = parseFloat(input.val());
        input.val((val + step).toFixed(step.countDecimals()));
        input.change();
      })
    }

    this.deleteObject = (eventData, transform) => {
      var target = transform.target;
      if (target.kind === 'photo-slot') return false;
      var canvas = target.canvas;
      canvas.remove(target);
      canvas.requestRenderAll();
    }

    this.deleteActiveObjects = () => {
      const objects = this.canvas
        .getActiveObjects()
        .filter(object => object.kind !== 'photo-slot');
      if (!objects.length) return false;

      const wasProcessing = Boolean(this.canvas.historyProcessing);
      this.canvas.historyProcessing = true;
      this.canvas.discardActiveObject();
      objects.forEach(object => this.canvas.remove(object));
      this.canvas.historyProcessing = wasProcessing;
      this.canvas.requestRenderAll();

      if (!wasProcessing && typeof this.canvas._historySaveAction === 'function') {
        this.canvas._historySaveAction();
      }
      return true;
    }

    this.cloneObject = (eventData, transform) => {
      var target = transform.target;
      if (target.kind === 'photo-slot') return false;
      var canvas = target.canvas;
      const revision = canvas.projectRevision || 0;
      target.clone(function (cloned) {
        if ((canvas.projectRevision || 0) !== revision) return;
        cloned.left += 10;
        cloned.top += 10;
        canvas.add(cloned);
      });
    }

    this.renderIcon = (icon) => {
      var Img = document.createElement('img');
      Img.src = icon;
      return function renderIcon(ctx, left, top, styleOverride, fabricObject) {
        var img = Img; // Referência à imagem
        var originalWidth = img.naturalWidth; // Largura original da imagem
        var originalHeight = img.naturalHeight; // Altura original da imagem
        var cornerSize = this.cornerSize; // Tamanho do canto

        // Calcula a proporção da imagem
        var aspectRatio = originalWidth / originalHeight;

        // Ajusta a altura e largura com base na proporção e no tamanho do canto
        var width = cornerSize;
        var height = width / aspectRatio;

        // Se a altura for maior que o tamanho do canto, ajusta a largura
        if (height > cornerSize) {
          height = cornerSize;
          width = height * aspectRatio;
        }

        // Desenha a imagem na tela
        ctx.save();
        ctx.translate(left, top);
        ctx.rotate(fabric.util.degreesToRadians(fabricObject.angle));
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
        ctx.restore();
      }
    }

    this.renderSvgCode = (input) => {
      const cleanSvg = input
        .trim()
        .replace(/[\r\n]/g, '')      // Убираем переносы строк
        .replace(/\s{2,}/g, ' ')     // Заменяем множественные пробелы на один
        .replace(/>\s+</g, '><')     // Убираем пробелы между тегами
        .replace(/"/g, "'");         // Заменяем двойные кавычки на одинарные
    
      // Добавляем xmlns если его нет
      const svgWithNs = cleanSvg.includes('xmlns=') ? 
        cleanSvg : 
        cleanSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    
      const dataUrl = 'data:image/svg+xml,' + encodeURIComponent(svgWithNs);
      return this.renderIcon(dataUrl);
    }

    this.renderSvgFile = (url) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false); // false = синхронный запрос
      
      try {
        xhr.send();
        if (xhr.status === 200) {
          return this.renderSvgCode(xhr.responseText);
        }
      } catch (error) {
        console.error('Error loading SVG:', error);
      }
    
      // Фоллбек в случае ошибки
      return this.renderSvgCode(`<svg viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z" fill="red"/></svg>`);
    }


    this.init();
  }

  ImageEditor.prototype.destroy = function () {
    // Remove all added event listeners
    $(document).off('keydown', this.ctrZY);

    // Clear all DOM elements created by the editor
    $(this.containerSelector).empty();

    // Remove references to free up memory
    this.canvas = null;
    this.activeTool = null;
    this.activeSelection = null;
  };

  window.ImageEditor = ImageEditor;
})();
