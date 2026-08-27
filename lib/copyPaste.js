/**
 * Copy and paste canvas objects through the regular system clipboard.
 */
(function () {
  'use strict';

  const CLIPBOARD_MARKER = 'template-studio-objects-v1';
  const COPY_PROPERTIES = [
    'kind',
    'assetFileName',
    'assetFileSize',
    'previewType',
    'previewFileName',
    'photoAspectRatio',
    'photoSymmetryEnabled',
    'photoSymmetryOffsetX',
    'photoSymmetryOffsetY',
    'photoColumnEnabled',
    'photoColumnGap',
    'excludeFromExport',
    'excludeFromHistory',
    'fontFile',
  ];
  const VALID_TYPES = new Set([
    'activeSelection',
    'circle',
    'ellipse',
    'group',
    'i-text',
    'image',
    'line',
    'path',
    'polygon',
    'polyline',
    'rect',
    'text',
    'textbox',
    'triangle',
  ]);

  function isTyping(event, canvas) {
    const target = event.target;
    return Boolean(
      target?.closest?.('input, textarea, select, [contenteditable="true"]')
      || canvas.getActiveObject()?.isEditing,
    );
  }

  function containsPhotoSlot(object) {
    return object?.kind === 'photo-slot'
      || Boolean(object?.getObjects?.().some(containsPhotoSlot));
  }

  function normalizeObject(object) {
    if (object.type === 'i-text') {
      const align = object.textAlign === 'left' || object.textAlign === 'right'
        ? object.textAlign
        : 'center';
      object.set({
        originX: align,
        originY: 'center',
        textAlign: align,
        centeredRotation: false,
        strokeUniform: true,
        styles: {},
      });
    }

    object.getObjects?.().forEach(normalizeObject);
  }

  function parseFabricObject(text) {
    if (!text) return null;

    try {
      const parsed = JSON.parse(text);
      const object = parsed?.marker === CLIPBOARD_MARKER
        ? parsed.object
        : parsed;
      return object && VALID_TYPES.has(object.type) ? object : null;
    } catch (_) {
      return null;
    }
  }

  function initializeCopyPaste(canvas) {
    const editor = this;

    const saveOneHistoryStep = wasProcessing => {
      if (!wasProcessing && typeof canvas._historySaveAction === 'function') {
        canvas._historySaveAction();
      }
    };

    const addObject = (object, placement) => {
      const wasProcessing = Boolean(canvas.historyProcessing);
      canvas.historyProcessing = true;
      canvas.discardActiveObject();
      normalizeObject(object);

      if (placement === 'center') {
        canvas.centerObject(object);
      } else {
        object.set({
          left: object.left + 20,
          top: object.top + 20,
        });
      }

      if (object.type === 'activeSelection') {
        object.canvas = canvas;
        object.forEachObject(child => canvas.add(child));
        object.setCoords();
      } else {
        canvas.add(object);
        object.setCoords();
      }

      canvas.setActiveObject(object);
      canvas.historyProcessing = wasProcessing;
      canvas.requestRenderAll();
      saveOneHistoryStep(wasProcessing);
    };

    const enlivenAndAdd = (objectData, placement) => {
      const revision = canvas.projectRevision || 0;
      fabric.util.enlivenObjects([objectData], objects => {
        if ((canvas.projectRevision || 0) !== revision) return;
        const object = objects[0];
        if (!object || containsPhotoSlot(object)) return;
        addObject(object, placement);
      });
    };

    const serializeActiveObject = () => {
      const activeObject = canvas.getActiveObject();
      if (!activeObject || containsPhotoSlot(activeObject)) return null;
      return activeObject.toObject(COPY_PROPERTIES);
    };

    editor.duplicateActiveObjects = () => {
      const objectData = serializeActiveObject();
      if (!objectData) return false;
      enlivenAndAdd(objectData, 'offset');
      return true;
    };

    const writeSelectionToClipboard = event => {
      const object = serializeActiveObject();
      if (!object) return false;

      event.preventDefault();
      event.clipboardData.setData('text/plain', JSON.stringify({
        marker: CLIPBOARD_MARKER,
        object,
      }));
      return true;
    };

    document.addEventListener('copy', event => {
      if (isTyping(event, canvas)) return;
      writeSelectionToClipboard(event);
    });

    document.addEventListener('cut', event => {
      if (isTyping(event, canvas)) return;
      if (writeSelectionToClipboard(event)) {
        editor.deleteActiveObjects();
      }
    });

    document.addEventListener('paste', event => {
      if (isTyping(event, canvas)) return;

      const text = event.clipboardData.getData('text/plain');
      const object = parseFabricObject(text);
      if (object) {
        event.preventDefault();
        enlivenAndAdd(object, 'center');
        return;
      }

      if (/^data:image\/(?:png|jpe?g|webp);base64,/i.test(text)) {
        event.preventDefault();
        editor.addImageFromUrl(text);
        return;
      }

      const imageItems = Array.from(event.clipboardData.items || [])
        .filter(item => item.type.startsWith('image/'));
      if (!imageItems.length) return;

      event.preventDefault();
      const revision = canvas.projectRevision || 0;
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          if ((canvas.projectRevision || 0) === revision) {
            editor.addImageFromUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
    });
  }

  window.ImageEditor.prototype.initializeCopyPaste = initializeCopyPaste;
})();
