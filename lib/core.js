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
    const { buttons, shapes, images, dimensions, trim, templates, canvasSizeBlock = false } = options

    this.containerSelector = containerSelector;
    this.containerEl = $(containerSelector);

    this.dimensions = {
      width: dimensions && dimensions.width > 0 ? dimensions.width : 800,
      height: dimensions && dimensions.height > 0 ? dimensions.height : 600
    }
    this.trim = trim || null;
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

      $(`${containerSelector} #toolbar button`).removeClass('active');
      $(`${containerSelector} #toolbar button#${id}`).addClass('active');
    
      // Очищаем выделение при переключении на другие инструменты
      if (id !== 'select') {
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
        this.activeSelection = null;
      }
          
      // Скрываем все панели
      document.querySelectorAll(`${containerSelector} .toolpanel`).forEach(panel => {
        panel.classList.remove('visible', 'closed');
      });
    
      // Если кликнули по той же панели что была открыта - выходим
      if (forceClose) {
        if (visiblePanel && visiblePanel.id === `${id}-panel`) {
          return;
        }
      }
    
      // Показываем новую панель только если это не select без выделения
      const newPanel = document.querySelector(`${containerSelector} .toolpanel#${id}-panel`);
      if (newPanel && (id !== 'select' || (id === 'select' && this.activeSelection))) {
        if (id === 'select') {
          newPanel.className = `toolpanel visible type-${this.activeSelection.type}`;
        } else {
          newPanel.classList.add('visible');
        }
      }
    
      // Остальной код без изменений
      this.activeTool = id;
    
      if (id !== 'select') {
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
        this.activeSelection = null;
      }
    
      if (id === 'select') {
        this.setSelectionValues();
      }

      this.canvas.isDrawingLineMode = false;
      this.canvas.isDrawingPathMode = false;
      this.canvas.isDrawingMode = false;
      this.canvas.isDrawingTextMode = false;

      this.canvas.defaultCursor = 'default';
      this.canvas.selection = true;
      this.canvas.forEachObject(o => {
        o.selectable = true;
        o.evented = true;
      })

      switch (id) {
        case 'draw':
          this.canvas.isDrawingMode = true;
          break;
        case 'line':
          this.canvas.isDrawingLineMode = true
          this.canvas.defaultCursor = 'crosshair'
          this.canvas.selection = false
          this.canvas.forEachObject(o => {
            o.selectable = false
            o.evented = false
          });
          break;
        case 'path':
          this.canvas.isDrawingPathMode = true
          this.canvas.defaultCursor = 'crosshair'
          this.canvas.selection = false
          this.canvas.forEachObject(o => {
            o.selectable = false
            o.evented = false
          });
          // this.updateTip('Tip: click to place points, press and pull for curves! Click outside or press Esc to cancel!');
          break;
        case 'textbox' || 'i-text':
          this.canvas.isDrawingTextMode = true
          this.canvas.defaultCursor = 'crosshair'
          this.canvas.selection = false
          this.canvas.forEachObject(o => {
            o.selectable = false
            o.evented = false
          });
          break;
        case 'upload':
          this.openDragDropPanel();
          break;
        default:
          // this.updateTip('Tip: hold Shift when drawing a line for 15° angle jumps!');
          break;
      }
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
      this.activeSelection = activeSelection && activeSelection[0] ? activeSelection[0] : activeSelection;
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
    
      // Добавляем обработчики клавиш
      const handleKeyboard = (e) => {
        // Проверяем что не находимся в текстовом поле
        if (document.querySelectorAll('textarea:focus, input:focus').length > 0) {
          return;
        }
    
        if (e.ctrlKey && !e.shiftKey) {
          if (e.key === 'z') {
            e.preventDefault();
            if (this.canvas.canUndo()) {
              this.canvas.undo(() => {
                console.log('Undo completed');
              });
            }
          }
          if (e.key === 'y') {
            e.preventDefault();
            if (this.canvas.canRedo()) {
              this.canvas.redo(() => {
                console.log('Redo completed');
              });
            }
          }
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
      this.initializeTemplatesPanel();

      this.canvas = this.initializeCanvas();
      this.configUndoRedoStack();

      this.initializeShapes();
      this.initializeImages();
      this.initializeFreeDrawSettings();
      this.initializeCanvasSettingPanel();
      this.initializeAnimations(this.canvas);
      this.initializeSelectionSettings();

      this.initializeLineDrawing(this.canvas);
      this.initializePathDrawing(this.canvas);
      this.initializeTextBoxDrawing(this.canvas);
      this.initializeUpload(this.canvas);
      this.initializeCopyPaste(this.canvas);

      this.initializeTipSection();

      this.initializeUtilsEvents()

      this.initializeZoomEvents();
      this.initializeFullscreenEvents();

      this.initializeNotification()

      this.extendHideShowToolPanel();
      this.extendNumberInput();

      this.fitZoom()


    }

    /**
     * Initialize main panel 
     */
    this.initializeMainPanel = () => {
      $(`${containerSelector}`).append('<div class="main-panel"></div>');
    }
    this.initializeTemplatesPanel = () => {
      $(`${containerSelector} .main-panel`).append(`
        <div class="toolpanel" id="templates-panel">
          <div class="content">
            <div class="content-header">
              <span class="title">
                ${window.lang == 'ru' ? 'Шаблоны' : 'Templates'}
              </span>
  
              <div class="template-actions">
                <button class="app-new-template" id="app-new-template" type="json">
                  ${window.lang == 'ru' ? 'Создать шаблон' : 'New Template'}
                </button>

                <button class="app-delete-template" id="app-delete-template" type="delete-template">
                  ${window.lang == 'ru' ? 'Удаление' : 'Delete'}
                </button>
              </div>
            </div>
  
            <div class="list-templates">
            </div>
          </div>
        </div>
      `);
    }

    /**
     * Add features to hide/show tool panel
     */
    this.extendHideShowToolPanel = () => {
      $(`${this.containerSelector} .toolpanel`).each(function () {
        $(this).append(`<div class="hide-show-handler" role="button" tabindex="0" aria-label="Свернуть панель"></div>`)
      })

      const togglePanel = function () {
        let panel = $(this).closest('.toolpanel');
        panel.toggleClass('closed');
        $(this).attr(
          'aria-label',
          panel.hasClass('closed') ? 'Развернуть панель' : 'Свернуть панель'
        );
      };

      $(`${this.containerSelector} .toolpanel .hide-show-handler`)
        .click(togglePanel)
        .keydown(function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePanel.call(this);
          }
        });
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
      var canvas = target.canvas;
      canvas.remove(target);
      canvas.requestRenderAll();
    }

    this.cloneObject = (eventData, transform) => {
      var target = transform.target;
      var canvas = target.canvas;
      target.clone(function (cloned) {
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
