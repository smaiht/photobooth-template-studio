/**
 * Canvas section management of image editor
 */
(function () {
  'use strict';

  var canvas = function () {
    try {
      $(`${this.containerSelector} .main-panel`).append(`<div class="canvas-holder" id="canvas-holder"><div class="content"><canvas id="c"></canvas></div></div>`);

      fabric.Object.prototype.toObject = (function (toObject) {
        return function (properties) {
          var obj = toObject.call(this, properties);
          obj.animation = this.animation;
          return obj;
        };
      })(fabric.Object.prototype.toObject);

      fabric.Object.prototype.initialize = (function (initialize) {
        return function (options) {
          initialize.call(this, options);
          
          if (!this.uniqueId) {
            this.uniqueId = Date.now() + '_' + Math.random().toString(36);
          }
          // this.animation = options.animation || null;  // Definindo um valor padrão
        };
      })(fabric.Object.prototype.initialize);

      fabric.Object.prototype.originX = "center";
      fabric.Object.prototype.originY = "center";

      const fabricOptions = {
        renderOnAddRemove: false,
        // TODO: ...
        // selection: false,  // Отключаем выделение областью
        selectionColor: 'rgba(255,165,0,0.3)',  // Делаем область выделения прозрачной
        // selectionLineWidth: 0
      };
      const fabricCanvas = new fabric.Canvas('c', fabricOptions).setDimensions(this.dimensions)
      console.log('История доступна:', 
        Boolean(fabricCanvas.undo && fabricCanvas.redo && fabricCanvas._historyInit)
      );


      fabricCanvas.on('object:added', () => {
        // Даем небольшую задержку, чтобы собрать несколько изменений вместе
        clearTimeout(fabricCanvas.historyTimeout);
        fabricCanvas.historyTimeout = setTimeout(() => {
          fabricCanvas.fire('history:append');
        }, 300);
      });

      fabricCanvas.on('object:modified', () => {
        clearTimeout(fabricCanvas.historyTimeout);
        fabricCanvas.historyTimeout = setTimeout(() => {
          fabricCanvas.fire('history:append');
        }, 300);
      });

      fabricCanvas.on('object:removed', () => {
        clearTimeout(fabricCanvas.historyTimeout);
        fabricCanvas.historyTimeout = setTimeout(() => {
          fabricCanvas.fire('history:append');
        }, 300);
      });




      fabricCanvas.originalW = fabricCanvas.width;
      fabricCanvas.originalH = fabricCanvas.height;

      // set up selection style
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.cornerSize = 24;
      fabric.Object.prototype.borderScaleFactor = 3;

      // fabric.Object.prototype.cornerStyle = 'rect';
      fabric.Object.prototype.cornerStyle = 'circle';
      fabric.Object.prototype.borderColor = 'orange';

      fabric.Object.prototype.cornerColor = 'orange';
      fabric.Object.prototype.cornerStrokeColor = '#FFF';
      fabric.Object.prototype.padding = 0;

      // set up selection controls
      // base64 methods:
      // render: this.renderIcon("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'%3E%3Cpath d='M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z' fill='%234c4c4c'/%3E%3C/svg%3E"),
      // string method
      // render: this.renderSvgCode(`
      //   <svg viewBox="0 0 24 24">
      //     <path d="M6 18L18 6M6 6l12 12" 
      //       stroke="red" 
      //       stroke-width="2" 
      //       stroke-linecap="round"/>
      //   </svg>
      // `),
      // file methods:

      // fabric.Object.prototype.controls.clone = new fabric.Control({
      //   x: 0,
      //   y: -0.5,
      //   offsetY: -40,
      //   offsetX: -60,
      //   cursorStyle: 'pointer',
      //   mouseUpHandler: this.cloneObject,
      //   render: this.renderSvgFile("./assets/clone.svg"),
      //   cornerSize: 23
      // });

      fabric.Object.prototype.controls.deleteControl = new fabric.Control({
        x: 0,
        y: -0.5,
        offsetY: -40,
        offsetX: +60,
        cursorStyle: 'pointer',
        mouseUpHandler: this.deleteObject,
        render: this.renderSvgFile("./assets/delete.svg"),
        cornerSize: 30
      });




      // // breaks rotation      
      // fabric.Object.prototype.controls.mtr = new fabric.Control({
      //   x: 0,
      //   y: -0.5,
      //   offsetY: -40,
      //   cursorStyle: 'pointer',
      //   // actionHandler: rotationWithSnapping,
      //   actionHandler: fabric.controlsUtils.rotationWithSnapping,
      //   render: this.renderSvgFile("./assets/rotateicon.svg"),
      //   cornerSize: 30,
      // });



      const middleVerticalIcon = "./assets/middlecontrol.svg";
      const middleHorizontalIcon = "./assets/middlecontrolhoz.svg";
      const edgeIcon = "./assets/edgecontrol.svg";

      // Настройка контролов
      fabric.Object.prototype.controls.ml = new fabric.Control({
        x: -0.5,
        y: 0,
        offsetX: -1,
        cornerSize: 50,
        cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
        actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
        render: this.renderSvgFile(middleVerticalIcon)
      });

      fabric.Object.prototype.controls.mr = new fabric.Control({
        x: 0.5,
        y: 0,
        offsetX: 1,
        cornerSize: 50,
        cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
        actionHandler: fabric.controlsUtils.scalingXOrSkewingY,
        render: this.renderSvgFile(middleVerticalIcon)
      });

      fabric.Object.prototype.controls.mb = new fabric.Control({
        x: 0,
        y: 0.5,
        offsetY: 1,
        cornerSize: 50,
        cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
        actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
        render: this.renderSvgFile(middleHorizontalIcon)
      });

      fabric.Object.prototype.controls.mt = new fabric.Control({
        x: 0,
        y: -0.5,
        offsetY: -1,
        cornerSize: 50,
        cursorStyleHandler: fabric.controlsUtils.scaleSkewCursorStyleHandler,
        actionHandler: fabric.controlsUtils.scalingYOrSkewingX,
        render: this.renderSvgFile(middleHorizontalIcon)
      });

      // Угловые контролы
      fabric.Object.prototype.controls.tl = new fabric.Control({
        x: -0.5,
        y: -0.5,
        cornerSize: 40,
        cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
        actionHandler: fabric.controlsUtils.scalingEqually,
        render: this.renderSvgFile(edgeIcon)
      });

      fabric.Object.prototype.controls.tr = new fabric.Control({
        x: 0.5,
        y: -0.5,
        cornerSize: 40,
        cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
        actionHandler: fabric.controlsUtils.scalingEqually,
        render: this.renderSvgFile(edgeIcon)
      });

      fabric.Object.prototype.controls.bl = new fabric.Control({
        x: -0.5,
        y: 0.5,
        cornerSize: 40,
        cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
        actionHandler: fabric.controlsUtils.scalingEqually,
        render: this.renderSvgFile(edgeIcon)
      });

      fabric.Object.prototype.controls.br = new fabric.Control({
        x: 0.5,
        y: 0.5,
        cornerSize: 40,
        cursorStyleHandler: fabric.controlsUtils.scaleCursorStyleHandler,
        actionHandler: fabric.controlsUtils.scalingEqually,
        render: this.renderSvgFile(edgeIcon)
      });





      fabricCanvas.preserveObjectStacking = true;

      // retrieve active selection to react state
      fabricCanvas.on('selection:created', (e) => {
        this.setActiveSelection(e.selected)
      })
      fabricCanvas.on('selection:updated', (e) => this.setActiveSelection(e.selected))
      fabricCanvas.on('selection:cleared', (e) => this.setActiveSelection(null))


      // fabricCanvas.on('mouse:down', (opt) => {
      //   // Проверка количества касаний
      //   if (opt.e.touches && opt.e.touches.length > 1) {
      //     fabricCanvas.discardActiveObject();
      //     return;
      //   }
      // });
      
      // fabricCanvas.on('mouse:move', (opt) => {
      //   // Проверка количества касаний
      //   if (opt.e.touches && opt.e.touches.length > 1) {
      //     return;
      //   }
      // });


      // snap to an angle on rotate if shift key is down
      fabricCanvas.on('object:rotating', (e) => {
        if (e.e.shiftKey) {
          e.target.snapAngle = 15;
        } else {
          e.target.snapAngle = false;
        }
      });

      // fabricCanvas.on('object:modified', () => {
      //   if (this.canvas) {
      //     let currentState = this.canvas.toJSON();
      //     if (this.history) {
      //       this.history.push(JSON.stringify(currentState));
      //     } else {
      //       console.error("History (this.history) is not defined.");
      //     }
      //   } else {
      //     console.error("Canvas (this.canvas) is not defined.");
      //   }
      // })

      // move objects with arrow keys
      document.addEventListener('keydown', (e) => {
        const key = e.which || e.keyCode;
        let activeObject;

        if (document.querySelectorAll('textarea:focus, input:focus').length > 0) return;

        if (key === 37 || key === 38 || key === 39 || key === 40) {
          e.preventDefault();
          activeObject = fabricCanvas.getActiveObject();
          if (!activeObject) {
            return;
          }
        }

        if (key === 37) {
          activeObject.left -= 1;
        } else if (key === 39) {
          activeObject.left += 1;
        } else if (key === 38) {
          activeObject.top -= 1;
        } else if (key === 40) {
          activeObject.top += 1;
        }

        if (key === 37 || key === 38 || key === 39 || key === 40) {
          activeObject.setCoords();
          fabricCanvas.renderAll();
          fabricCanvas.fire('object:modified');
        }
      });

      // delete object on del key
      document.addEventListener('keydown', (e) => {
        const key = e.which || e.keyCode;
        if (
          key === 46 &&
          document.querySelectorAll('textarea:focus, input:focus').length === 0
        ) {
          fabricCanvas.getActiveObjects().forEach(obj => {
            fabricCanvas.remove(obj);
          });

          fabricCanvas.discardActiveObject().requestRenderAll();
          fabricCanvas.fire('object:modified');
        }
      });

      // remove selection on click outside canvas
      document.addEventListener('mousedown', (event) => {
        const canvasElement = document.getElementById('canvas-holder');
        if (canvasElement === event.target) {
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();
        }
      });

      // setTimeout(() => {
      //   let currentState = fabricCanvas.toJSON();
      //   this.history.push(JSON.stringify(currentState));
      // }, 1000);

      return fabricCanvas;
    } catch (_) {
      console.error("can't create canvas instance", _);
      return null;
    }
  }

  window.ImageEditor.prototype.initializeCanvas = canvas;
})();
