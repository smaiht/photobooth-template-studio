/**
 * Define copy/paste actions on fabric js canvas
 */
(function () {
  'use strict';
  const copyPaste = (canvas) => {

    // copy
    document.addEventListener('copy', (e) => {
      const activeObject = canvas.getActiveObject();
      if (
        !activeObject
        || activeObject.kind === 'photo-slot'
        || activeObject.getObjects?.().some(object => object.kind === 'photo-slot')
      ) return

      // copy image as dataUrl
      if (activeObject.type === 'image') {
        e.preventDefault()

        e.clipboardData.setData('text/plain', activeObject.toDataURL())
      }


      // if selection is not an image, copy as JSON
      if (activeObject.type !== 'image') {
        e.preventDefault()
        activeObject.clone((cloned) => {
          e.clipboardData.setData('text/plain', JSON.stringify(cloned.toJSON()))
        })
      }
    })

    // JSON string validator
    const isJSONObjectString = (s) => {
      try {
        const o = JSON.parse(s);
        return !!o && (typeof o === 'object') && !Array.isArray(o)
      } catch {
        return false
      }
    }

    // base64 validator
    const isBase64String = (str) => {
      try {
        str = str.split('base64,').pop()
        window.atob(str)
        return true
      } catch (e) {
        return false
      }
    }

    // paste
    document.addEventListener('paste', (e) => {
      let pasteTextData = e.clipboardData.getData('text')

      // check if base64 image
      if (pasteTextData && isBase64String(pasteTextData)) {
        fabric.Image.fromURL(pasteTextData, (img) => {
          img.set({
            left: 0,
            top: 0,
            crossOrigin: 'anonymous'
          })
          img.scaleToHeight(100)
          img.scaleToWidth(100)
          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.fire('object:modified')
        }, {
          crossorigin: 'anonymous'
        })

        return
      }

      // check if there's an image in clipboard items
      if (e.clipboardData.items.length > 0) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          if (e.clipboardData.items[i].type.indexOf('image') === 0) {
            let blob = e.clipboardData.items[i].getAsFile()
            if (blob !== null) {
              let reader = new FileReader()
              reader.onload = (f) => {
                fabric.Image.fromURL(f.target.result, (img) => {
                  img.set({
                    left: 0,
                    top: 0,
                    crossOrigin: 'anonymous'
                  })
                  img.scaleToHeight(100)
                  img.scaleToWidth(100)
                  canvas.add(img)
                  canvas.setActiveObject(img)
                  canvas.fire('object:modified')
                }, {
                  crossorigin: 'anonymous'
                })
              }
              reader.readAsDataURL(blob)
            }
          }
        }
      }

      // check if JSON and type is valid
      let validTypes = ['rect', 'circle', 'line', 'path', 'polygon', 'polyline', 'i-text', 'group']
      if (isJSONObjectString(pasteTextData)) {
        let obj = JSON.parse(pasteTextData)
        if (!validTypes.includes(obj.type)) return

        // insert and select
        fabric.util.enlivenObjects([obj], function (objects) {
          objects.forEach(function (o) {
            const properties = {
              left: 0,
              top: 0
            };
            if (o.type === 'i-text') {
              const align = o.textAlign === 'left' || o.textAlign === 'right'
                ? o.textAlign
                : 'center';
              Object.assign(properties, {
                originX: align,
                originY: 'center',
                textAlign: align,
                centeredRotation: false,
                strokeUniform: true,
                styles: {},
              });
            }
            o.set(properties)
            canvas.add(o)
            o.setCoords()
            canvas.setActiveObject(o)
          })
          canvas.renderAll()
          canvas.fire('object:modified')
        })
      }
    })
  }

  window.ImageEditor.prototype.initializeCopyPaste = copyPaste;
})()
