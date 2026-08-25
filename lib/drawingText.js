/**
 * Define action to draw text
 */
(function () {
  const textBoxDrawing = function (fabricCanvas) {
    const _self = this;

    let isDrawingText = false,
      textboxRect, origX, origY, pointer;


    fabricCanvas.on('mouse:down', (o) => {
      if (!fabricCanvas.isDrawingTextMode) return;

      isDrawingText = true;
      pointer = fabricCanvas.getPointer(o.e);
      origX = pointer.x;
      origY = pointer.y;
      textboxRect = new fabric.Rect({
        left: origX,
        top: origY,
        originX: 'left',
        originY: 'top',
        width: 0,
        height: 0,
        strokeWidth: 1,
        stroke: '#C00000',
        fill: 'rgba(192, 0, 0, 0.2)',
        transparentCorners: false
      });
      fabricCanvas.add(textboxRect);
    });


    fabricCanvas.on('mouse:move', (o) => {
      if (!isDrawingText) return;

      pointer = fabricCanvas.getPointer(o.e);

      textboxRect.set({
        left: Math.min(origX, pointer.x),
        top: Math.min(origY, pointer.y),
        width: Math.abs(origX - pointer.x),
        height: Math.abs(origY - pointer.y),
      });

      fabricCanvas.renderAll();
    });


    fabricCanvas.on('mouse:up', () => {
      if (!isDrawingText) return;

      isDrawingText = false;

      // get final rect coords and replace it with textbox
      const localFont = _self.getDefaultTextFont?.();
      let textbox = new fabric.Textbox(window.lang == 'ru' ? 'Введите текст' : 'Enter text', {
        left: textboxRect.left,
        top: textboxRect.top,
        originX: 'left',
        originY: 'top',

        width: textboxRect.width < 80 ? 80 : textboxRect.width,
        fontSize: 30,
        fontFamily: localFont?.family || 'Arial',
        fontFile: localFont?.fileName || null,
        stroke: '#000000',
        strokeWidth: 0,
        lineHeight: 1.2,
        charSpacing: 0,
        paintFirst: 'stroke',
        kind: 'template-text',
      });
      fabricCanvas.remove(textboxRect);
      fabricCanvas.add(textbox).setActiveObject(textbox)
      // textbox.setControlsVisibility({
      //   'mb': false
      // });
      // textbox.controls.mt.visible = false;
      // textbox.controls.mb.visible = false;
      // textbox.controls.ml.visible = false;
      // textbox.controls.mr.visible = false;

      fabricCanvas.fire('object:modified')
    });

  }

  window.ImageEditor.prototype.initializeTextBoxDrawing = textBoxDrawing;
})();
