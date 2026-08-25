/**
 * Define action to draw text
 */
(function () {
  const textDrawing = function (fabricCanvas) {
    const _self = this;
    fabricCanvas.on('mouse:down', (o) => {
      if (!fabricCanvas.isDrawingTextMode) return;

      const pointer = fabricCanvas.getPointer(o.e);
      const localFont = _self.getDefaultTextFont?.();
      const text = new fabric.IText(window.lang == 'ru' ? 'Введите текст' : 'Enter text', {
        left: pointer.x,
        top: pointer.y,
        originX: 'center',
        originY: 'center',
        fontSize: 30,
        fontFamily: localFont?.family || 'Arial',
        fontFile: localFont?.fileName || null,
        fill: '#000000',
        stroke: '#000000',
        strokeWidth: 0,
        lineHeight: 1.2,
        charSpacing: 0,
        paintFirst: 'stroke',
        textAlign: 'center',
        centeredRotation: false,
        strokeUniform: true,
        styles: {},
        kind: 'template-text',
      });
      fabricCanvas.add(text).setActiveObject(text);
      fabricCanvas.fire('object:modified', { target: text });
    });
  }

  window.ImageEditor.prototype.initializeTextDrawing = textDrawing;
})();
