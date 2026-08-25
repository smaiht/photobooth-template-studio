(function () {
  'use strict';
  const backgroundIcon = `<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3V3Zm2 2v14h14V5H5Zm1 11 3.4-4.2 2.4 2.8 1.8-2.1L18 17H6v-1Zm8.5-8.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>`;
  const addImageIcon = `<svg viewBox="0 0 24 24"><path d="M4 3h11v2H5v14h14v-7h2v9H3V3h1Zm3 13 3.2-4 2.4 2.9 1.9-2.2L18 16.5V17H7v-1Zm7-9h3V4h2v3h3v2h-3v3h-2V9h-3V7ZM9 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>`;
  const trimIcon = `<svg viewBox="0 0 24 24"><path d="M6 2h2v4h8V2h2v4h4v2h-4v8h4v2h-4v4h-2v-4H6V8H2V6h4V2Zm2 6v8h8V8H8Z"/></svg>`;

  var defaultButtons = [
    {
      name: 'select',
      title: 'Select/move object (V)',
      icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path d="M423.547,323.115l-320-320c-3.051-3.051-7.637-3.947-11.627-2.304s-6.592,5.547-6.592,9.856V480 c0,4.501,2.837,8.533,7.083,10.048c4.224,1.536,8.981,0.192,11.84-3.285l85.205-104.128l56.853,123.179 c1.792,3.883,5.653,6.187,9.685,6.187c1.408,0,2.837-0.277,4.203-0.875l74.667-32c2.645-1.131,4.736-3.285,5.76-5.973 c1.024-2.688,0.939-5.675-0.277-8.299l-57.024-123.52h132.672c4.309,0,8.213-2.603,9.856-6.592 C427.515,330.752,426.598,326.187,423.547,323.115z"></path></g></g></svg>`
    },
    {
      name: 'shapes',
      title: 'Shapes',
      icon: `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="9" height="9" rx="1"></rect><circle cx="17" cy="17" r="5"></circle></svg>`
    },
    {
      name: 'draw',
      title: 'Free draw',
      icon: `<svg viewBox="0 0 24 24"><path d="M3 17c4-8 7-12 10-12 2 0 2 3 0 6-2 4-1 6 2 6 2 0 4-1 6-3v4c-2 2-5 3-8 3-5 0-6-4-4-8-1 1-2 3-3 6z"></path></svg>`
    },
    {
      name: 'line',
      title: 'Line',
      icon: `<svg viewBox="0 0 24 24"><path d="M4 18.6 18.6 4 20 5.4 5.4 20z"></path><circle cx="4" cy="20" r="2"></circle><circle cx="20" cy="4" r="2"></circle></svg>`
    },
    {
      name: 'path',
      title: 'Lines and curves',
      icon: `<svg viewBox="0 0 24 24"><path d="M4 18c5 0 3-12 9-12h5v3h-5c-3 0-2 12-9 12z"></path><circle cx="4" cy="19" r="3"></circle><circle cx="19" cy="7" r="3"></circle></svg>`
    },
    // {
    //   name: 'shapes',
    //   title: 'Shapes',
    //   icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 490.927 490.927" xml:space="preserve"><path d="M336.738,178.502c-12.645,0-24.852,1.693-36.627,4.582L202.57,11.786c-5.869-10.321-22.84-10.321-28.709,0L2.163,313.311 c-2.906,5.105-2.889,11.385,0.078,16.466c2.953,5.088,8.389,8.216,14.275,8.216l166.314,0.009 c2.818,82.551,70.688,148.88,153.906,148.88c85.012,0,154.19-69.167,154.19-154.186S421.749,178.502,336.738,178.502z  M44.917,304.964l143.299-251.63L331.515,304.97L44.917,304.964z"></path></svg>`
    // },
    // {
    //   name: 'images',
    //   title: 'Images',
    //   icon: `<svg viewBox="0 0 576 512"><path d="M160 80H512c8.8 0 16 7.2 16 16V320c0 8.8-7.2 16-16 16H490.8L388.1 178.9c-4.4-6.8-12-10.9-20.1-10.9s-15.7 4.1-20.1 10.9l-52.2 79.8-12.4-16.9c-4.5-6.2-11.7-9.8-19.4-9.8s-14.8 3.6-19.4 9.8L175.6 336H160c-8.8 0-16-7.2-16-16V96c0-8.8 7.2-16 16-16zM96 96V320c0 35.3 28.7 64 64 64H512c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H160c-35.3 0-64 28.7-64 64zM48 120c0-13.3-10.7-24-24-24S0 106.7 0 120V344c0 75.1 60.9 136 136 136H456c13.3 0 24-10.7 24-24s-10.7-24-24-24H136c-48.6 0-88-39.4-88-88V120zm208 24a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/></svg>`
    // },
    // {
    //   name: 'draw',
    //   title: 'Free draw',
    //   icon: `<svg height="512pt" viewBox="0 -3 512 512" width="512pt"><g id="surface1"><path d="M 497.171875 86.429688 C 506.734375 76.867188 512 64.152344 512 50.628906 C 512 37.105469 506.734375 24.390625 497.171875 14.828125 C 487.609375 5.265625 474.894531 0 461.371094 0 C 447.847656 0 435.132812 5.265625 425.570312 14.828125 L 198.296875 242.105469 L 269.894531 313.703125 Z M 497.171875 86.429688 " style="stroke: none; fill-rule: nonzero; fill: rgb(0, 0, 0); fill-opacity: 1;"></path><path d="M 65.839844 506.65625 C 92.171875 507.21875 130.371094 496.695312 162.925781 459.074219 C 164.984375 456.691406 166.894531 454.285156 168.664062 451.855469 C 179.460938 435.875 184.695312 418.210938 183.855469 400.152344 C 182.945312 380.5625 174.992188 362.324219 161.460938 348.796875 C 150.28125 337.613281 134.722656 331.457031 117.648438 331.457031 C 95.800781 331.457031 73.429688 341.296875 56.277344 358.449219 C 31.574219 383.152344 31.789062 404.234375 31.976562 422.839844 C 32.15625 440.921875 32.316406 456.539062 11.101562 480.644531 L 0 493.257812 C 0 493.257812 26.828125 505.820312 65.839844 506.65625 Z M 65.839844 506.65625 " style="stroke: none; fill-rule: nonzero; fill: rgb(0, 0, 0); fill-opacity: 1;"></path><path d="M 209.980469 373.621094 L 248.496094 335.101562 L 176.894531 263.503906 L 137.238281 303.160156 C 154.691406 306.710938 170.464844 315 182.859375 327.394531 C 195.746094 340.285156 205.003906 356.1875 209.980469 373.621094 Z M 209.980469 373.621094 " style="stroke: none; fill-rule: nonzero; fill: rgb(0, 0, 0); fill-opacity: 1;"></path></g></svg>`
    // },
    // {
    //   name: 'line',
    //   title: 'Line',
    //   icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><path d="M349.091,0v124.516L124.516,349.091H0V512h162.909V387.484l224.574-224.574H512V0H349.091z M54.303,457.696v-54.303 h54.303v54.303H54.303z M457.696,108.605h-54.303V54.303h54.303V108.605z"></path></svg>`
    // },
    // {
    //   name: 'path',
    //   title: 'Connectable lines & curves',
    //   icon: '<svg id="svg8" viewBox="28 55 140 140"><path d="m 28.386086,150.01543 v 43.10301 H 71.489092 V 178.7505 H 120.75466 V 164.38283 H 71.355237 L 71.488872,150.0086 H 57.121421 c 0,-49.247 14.367449,-63.614929 63.633239,-63.614929 v -14.36768 c -63.633239,0 -78.000906,28.735609 -78.000906,77.982609 l -14.367888,0.007 z m 14.367669,28.73507 v -14.36767 h 14.367668 v 14.36767 z" id="path840" style="stroke-width: 0.264583;"></path><path d="m 120.74975,150.00843 v 43.10301 h 43.10301 V 150.0016 l -43.10301,0.007 z m 14.36767,28.73507 v -14.36767 h 14.36767 v 14.36767 z" id="path840-1" style="stroke-width: 0.264583;"></path><path d="m 120.74975,57.658601 v 43.103009 h 43.10301 V 57.651771 l -43.10301,0.007 z m 14.36767,28.73507 v -14.36767 h 14.36767 v 14.36767 z" id="path840-1-0" style="stroke-width: 0.264583;"></path></svg>'
    // },
    {
      name: 'textbox',
      title: 'Text box',
      icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><g><path d="M497,90c8.291,0,15-6.709,15-15V15c0-8.291-6.709-15-15-15h-60c-8.291,0-15,6.709-15,15v15H90V15c0-8.401-6.599-15-15-15 H15C6.599,0,0,6.599,0,15v60c0,8.399,6.599,15,15,15h15v332H15c-8.291,0-15,6.709-15,15v60c0,8.291,6.709,15,15,15h60 c8.291,0,15-6.709,15-15v-15h332v15c0,8.399,6.599,15,15,15h60c8.401,0,15-6.601,15-15v-60c0-8.401-6.599-15-15-15h-15V90H497z  M452,422h-15c-8.401,0-15,6.599-15,15v15H90v-15c0-8.291-6.709-15-15-15H60V90h15c8.401,0,15-6.601,15-15V60h332v15 c0,8.291,6.709,15,15,15h15V422z"></path></g></g><g><g><path d="M361,105H151c-8.291,0-15,6.709-15,15v60c0,6.064,3.647,11.543,9.258,13.857c5.625,2.329,12.056,1.04,16.348-3.252 L187.211,165H226v176.459l-27.48,42.221c-3.062,4.6-3.354,10.518-0.747,15.396S205.463,407,211,407h90 c5.537,0,10.62-3.047,13.228-7.925c2.608-4.878,2.314-10.796-0.747-15.396L286,341.459V165h38.789l25.605,25.605 c4.307,4.307,10.781,5.596,16.348,3.252c5.61-2.314,9.258-7.793,9.258-13.857v-60C376,111.709,369.291,105,361,105z"></path></g></g></svg>`
    },
    // {
    //   name: 'upload',
    //   title: 'Upload image',
    //   icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><path d="M412.907,214.08C398.4,140.693,333.653,85.333,256,85.333c-61.653,0-115.093,34.987-141.867,86.08 C50.027,178.347,0,232.64,0,298.667c0,70.72,57.28,128,128,128h277.333C464.213,426.667,512,378.88,512,320 C512,263.68,468.16,218.027,412.907,214.08z M298.667,277.333v85.333h-85.333v-85.333h-64L256,170.667l106.667,106.667H298.667z"></path></svg>`
    // },
    {
      name: 'trim',
      title: window.lang === 'ru' ? 'Показать обрезку печати' : 'Show print trim',
      label: window.lang === 'ru' ? 'Обрезка' : 'Trim',
      icon: trimIcon
    },
    {
      name: 'background',
      title: window.lang === 'ru' ? 'Фон макета' : 'Canvas background',
      label: window.lang === 'ru' ? 'Фон' : 'Background',
      icon: backgroundIcon
    },
    // {
    //   name: 'background',
    //   title: 'Canvas option',
    //   icon: `<svg viewBox="0 0 512 512"><path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/></svg>`
    // },
    {
      name: 'upload-image',
      title: window.lang === 'ru' ? 'Добавить картинку как объект' : 'Add image as an object',
      label: window.lang === 'ru' ? 'Картинка' : 'Image',
      icon: addImageIcon
    },
    {
      name: 'templates',
      title: 'Templates',
      icon: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.675 3h.825v18h-2.175c-3.59 0-5.385 0-6.61-.966a4.497 4.497 0 0 1-.749-.748C3 18.06 3 16.266 3 12.675v-1.35c0-3.59 0-5.385.966-6.61a4.5 4.5 0 0 1 .748-.749C5.94 3 7.734 3 11.325 3h1.35Zm6.61 17.034c-.926.73-2.178.909-4.285.952v-9.968h6v1.657c0 3.59 0 5.386-.966 6.61-.22.279-.47.53-.748.749Zm1.709-10.516H15V3.014c2.107.044 3.36.222 4.286.952.278.22.529.47.748.748.788 1 .933 2.38.96 4.804Z"></path></svg>`
    },
  ]

  const defaultExtendedButtons = [
    {
      name: 'download-image',
      title: 'Download PNG',
      icon: `<svg viewBox="0 0 512 512"><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>`
    },
    {
      name: 'animation',
      title: 'Play animations',
      icon: `<svg viewBox="0 0 16 16"><path d="m12 8-8 5V3z"></path></svg>`
    },
    // {
    //   name: 'animation',
    //   title: 'Play animation',
    //   icon: `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" >  <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393"/></svg>`
    // },
    {
      name: 'undo',
      title: 'Undo',
      icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512.011 512.011" xml:space="preserve"><path d="M511.136,286.255C502.08,194.863,419.84,128.015,328,128.015H192v-80c0-6.144-3.52-11.744-9.056-14.432 c-5.568-2.656-12.128-1.952-16.928,1.92l-160,128C2.208,166.575,0,171.151,0,176.015s2.208,9.44,5.984,12.512l160,128 c2.912,2.304,6.464,3.488,10.016,3.488c2.368,0,4.736-0.512,6.944-1.568c5.536-2.688,9.056-8.288,9.056-14.432v-80h139.392 c41.856,0,80,30.08,84.192,71.712c4.832,47.872-32.704,88.288-79.584,88.288H208c-8.832,0-16,7.168-16,16v64 c0,8.832,7.168,16,16,16h128C438.816,480.015,521.472,391.151,511.136,286.255z"></path></svg>`
    },
    {
      name: 'redo',
      title: 'Redo',
      icon: `<svg id="Capa_1" x="0px" y="0px" viewBox="0 0 512.011 512.011" xml:space="preserve" style="transform: scale(-1, 1);"><path d="M511.136,286.255C502.08,194.863,419.84,128.015,328,128.015H192v-80c0-6.144-3.52-11.744-9.056-14.432             c-5.568-2.656-12.128-1.952-16.928,1.92l-160,128C2.208,166.575,0,171.151,0,176.015s2.208,9.44,5.984,12.512l160,128             c2.912,2.304,6.464,3.488,10.016,3.488c2.368,0,4.736-0.512,6.944-1.568c5.536-2.688,9.056-8.288,9.056-14.432v-80h139.392             c41.856,0,80,30.08,84.192,71.712c4.832,47.872-32.704,88.288-79.584,88.288H208c-8.832,0-16,7.168-16,16v64             c0,8.832,7.168,16,16,16h128C438.816,480.015,521.472,391.151,511.136,286.255z"></path></svg>`
    },
    {
      name: 'clear',
      title: 'Clear',
      icon: `<svg class="bi bi-eraser-fill" viewBox="0 0 16 16"><path d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"/></svg>`
    },
    // {
    //   name: 'save',
    //   title: 'Save',
    //   icon: `<svg viewBox="0 0 448 512"><path d="M64 32C28.7 32 0 60.7 0 96V416c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V173.3c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32H64zm0 96c0-17.7 14.3-32 32-32H288c17.7 0 32 14.3 32 32v64c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V128zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>`
    // },
    // {
    //   name: 'download',
    //   title: 'Download',
    //   icon: `<svg viewBox="0 0 512 512"><path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32V274.7l-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7V32zM64 352c-35.3 0-64 28.7-64 64v32c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V416c0-35.3-28.7-64-64-64H346.5l-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352H64zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z"/></svg>`
    // },
    {
      name: 'fullscreen',
      title: 'Fullscreen',
      icon: `<svg viewBox="0 0 24 24"><path d="M3 3h8v3H6v5H3zm10 0h8v8h-3V6h-5zM3 13h3v5h5v3H3zm15 0h3v8h-8v-3h5z"></path></svg>`
    },
    // {
    //   name: 'fullscreen',
    //   title: 'Fullscreen',
    //   icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path d="M32 32C14.3 32 0 46.3 0 64v96c0 17.7 14.3 32 32 32s32-14.3 32-32V96h64c17.7 0 32-14.3 32-32s-14.3-32-32-32H32zM64 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H64V352zM320 32c-17.7 0-32 14.3-32 32s14.3 32 32 32h64v64c0 17.7 14.3 32 32 32s32-14.3 32-32V64c0-17.7-14.3-32-32-32H320zM448 352c0-17.7-14.3-32-32-32s-32 14.3-32 32v64H320c-17.7 0-32 14.3-32 32s14.3 32 32 32h96c17.7 0 32-14.3 32-32V352z"/></svg>`
    // }
  ]

  var toolbar = function () {
    const _self = this;
    let buttons = [];
    let extendedButtons = [];

    if (Array.isArray(this.buttons) && this.buttons.length) {
      defaultButtons.forEach(item => {
        if (this.buttons.includes(item.name)) buttons.push(item);
      });

      defaultExtendedButtons.forEach(item => {
        if (this.buttons.includes(item.name)) extendedButtons.push(item);
      })

    } else {
      buttons = defaultButtons;
      extendedButtons = defaultExtendedButtons;
    }

    try {
      this.containerEl.append(`
        <div id="toolbar" class="toolbar">
          <div class="studio-brand">
            <span class="studio-brand-mark">TS</span>
            <span class="studio-brand-copy">
              <strong>Template Studio</strong>
              <small>Photobooth layouts</small>
            </span>
          </div>
          <div class="main-buttons">
          </div>
        </div>

        <div id="footerbar" class="toolbar">
          <div class="footer-actions">
          </div>
          <div class="canvas-meta">
            <span>Grid canvas</span>
            <strong>${this.dimensions.width} × ${this.dimensions.height}</strong>
          </div>
          <div class="zoom-level-container">
          </div>
        </div>
      `);

      // buttons
      buttons.forEach(item => {
        $(`${this.containerSelector} #toolbar .main-buttons`).append(
          `<button type="button" id="${item.name}" class="${item.label ? 'toolbar-button-labeled' : ''}" title="${item.title}" aria-label="${item.title}">${item.icon}${item.label ? `<span class="toolbar-button-label">${item.label}</span>` : ''}</button>`
        );
      })

      extendedButtons.forEach(item => {
        $(`${this.containerSelector} #footerbar .footer-actions`).append(
          `<button type="button" id="${item.name}" title="${item.title}" aria-label="${item.title}">${item.icon}</button>`
        );
      })

      $(document).on('click', '.toolbar button', async function (e) {
        let id = $(this).attr('id');

        if (id === 'textbox') {
          let textbox = new fabric.IText('Your text goes here...', {
            left: _self.canvas.originalW / 2,
            top: _self.canvas.originalH / 2,
            fontSize: 43,
            fontFamily: "'Open Sans', sans-serif",
            fill: '#000000',
            originX: 'center',
            originY: 'center'
          });

          _self.canvas.add(textbox);
          _self.canvas.setActiveObject(textbox);
          _self.canvas.renderAll();

          return;
        }

        else if (id === 'upload-image') {
          $(`${_self.containerSelector} #btn-image-upload`).click();

          return;
        }

        else if (id === 'clear') {
          _self.canvas.historyProcessing = true; // disable history temporary

          _self.canvas.getObjects().forEach(obj => {
            _self.canvas.remove(obj);
          });

          _self.canvas.renderAll();

          _self.canvas.historyProcessing = false; // enable history and add new state
          _self.canvas._historySaveAction()

          return;
        }

        else if (id === 'download-image') { // as png
          let canvasCopy = _self.canvas;
          const currentZoom = canvasCopy.getZoom();
          canvasCopy.setZoom(1);

          const imageData = canvasCopy.toDataURL({
            format: 'png',
            multiplier: 1,
            width: canvasCopy.originalW,
            height: canvasCopy.originalH
          });

          canvasCopy.setZoom(currentZoom);
          _self.downloadImage(imageData);

          return;
        }

        else if (id === 'animation') {
          _self.animations.runAnimation();

          return;
        }

        else if (id === 'fullscreen') {
          return;
        }

        else if (id === 'download') {
          $(_self.containerSelector).append(`<div class="custom-modal-container">
              <div class="custom-modal-content">
                <div class="button-download" type="svg">Download as SVG</div>
                <div class="button-download" type="png">Download as PNG</div>
                <div class="button-download" type="jpg">Download as JPG</div>
                <div class="button-download" type="webp">Download as WEBP</div>
                <div class="button-download" type="json">Download as JSON</div>
              </div>
            </div>`)

          $(".custom-modal-container").click(function () {
            $(this).remove();
          })

          return;
        }

        else if (id === 'undo') {
          if (_self.canvas.canUndo && _self.canvas.canUndo()) {
            _self.canvas.undo(() => {
              _self.canvas.renderAll();
              console.log('Отмена выполнена');
            });
          }

          return;
        }

        else if (id === 'redo') {
          if (_self.canvas.canRedo && _self.canvas.canRedo()) {
            _self.canvas.redo(() => {
              _self.canvas.renderAll();
              console.log('Повтор выполнен');
            });
          }

          return;
        }

        else if (id === 'trim') {
          const panel = document.querySelector(
            `${_self.containerSelector} #trim-panel`,
          );

          if (!panel?.classList.contains('visible')) {
            _self.setTrimPreviewVisible(true);
          }
        }

        _self.setActiveTool(id, true);
      })

    } catch (_) {
      console.error("can't create toolbar");
    }
  }

  window.ImageEditor.prototype.initializeToolbar = toolbar;
})();
