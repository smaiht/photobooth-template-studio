/**
 * Define action to add shape to canvas
 */
(function () {
  'use strict';
  const defaultImages = [
    // `screenshots/editor.jpg`,
  ]

  var images = function () {
    const _self = this;

    let ImageList = defaultImages;
    if (Array.isArray(this.images) && this.images.length) ImageList = this.images; //ImageList.push(...this.images);
    
    $(`${this.containerSelector} .main-panel`).append(`<div class="toolpanel" id="images-panel"><div class="content"><p class="title">Images</p></div></div>`);
    
    $(`${this.containerSelector} .toolpanel#images-panel .content`).append('<div class="drag-drop-input"><div>Drag & drop files<br>or click to browse.<br>JPG, PNG, WEBP or SVG only!</div></div>')

    $(`${this.containerSelector} .toolpanel#images-panel .content`).append('<div class="list-images"></div>')
   
    ImageList.forEach(img => {
      $(`${this.containerSelector} .toolpanel#images-panel .content .list-images`).append(`<div class="button"><img src="${img}" /></div>`)
    })

    $(`${this.containerSelector} .toolpanel#images-panel .content .list-images`).on('click', '.button', function () {
      let img = $(this).find('img').attr('src');
      try {
        _self.addImageFromUrl(img)
      } catch (_) {
        console.error("can't add image",_);
      }
    })
  }  

  window.ImageEditor.prototype.initializeImages = images;
})();