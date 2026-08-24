/**
 * Define action to draw line by mouse actions
 */
(function () {
  var animation = function (fabricCanvas) {

    class FabricAnimations {
      constructor(canvas) {
        this.canvas = canvas;
        this.animations = {
          slideInLeft: (obj) => this.slideIn(obj, 'left', this.canvas),
          slideInRight: (obj) => this.slideIn(obj, 'right', this.canvas),
          slideInTop: (obj) => this.slideIn(obj, 'top', this.canvas),
          slideInBottom: (obj) => this.slideIn(obj, 'bottom', this.canvas),
          fade: (obj) => this.fade(obj, 1, this.canvas),
          zoom: (obj) => this.zoom(obj, 1, this.canvas),
          spin: (obj) => this.spin(obj, 360, this.canvas),
          swing: (obj) => this.swing(obj, this.canvas),
          float: (obj) => this.float(obj, 30, this.canvas),
          typewriter: (obj) => this.typewriter(obj, this.canvas),
        };
      }

      runAnimation() {
        this.canvas.renderAll.bind(this.canvas)
        this.canvas.getObjects().forEach((obj) => {          
          if (obj.animation) {            
            const { type, duration, easing } = obj.animation;
            if (this.animations[type]) {
              this.animations[type](obj);
              console.log('Animação carregada:', obj.animation);
            }
          }
        });
      }

      slideIn(obj, direction = 'left') {
        const startPosition = { left: obj.left, top: obj.top };
        if (direction === 'left') obj.left = -obj.width;
        if (direction === 'right') obj.left = this.canvas.width + obj.width;
        if (direction === 'top') obj.top = -obj.height;
        if (direction === 'bottom') obj.top = this.canvas.height + obj.height;

        obj.animate({ left: startPosition.left, top: startPosition.top }, {
          duration: 1000,
          easing: fabric.util.ease.easeOutCubic,
          onChange: this.canvas.renderAll.bind(this.canvas),
        });
      }

      fade(obj, opacity = 1) {
        obj.opacity = opacity === 1 ? 0 : obj.opacity; 
        obj.animate('opacity', opacity, {
          duration: 1000,
          easing: fabric.util.ease.easeInOutQuad,
          onChange: this.canvas.renderAll.bind(this.canvas),
        });
      }
      
      zoom(obj, scale = 2) {
        const startScale = obj.scaleX; 
        const center = obj.getCenterPoint();
        obj.set({
          originX: 'center',
          originY: 'center',
          left: center.x,
          top: center.y
        });
        obj.animate({ scaleX: scale, scaleY: scale }, {
          duration: 1000,
          easing: fabric.util.ease.easeInOutCubic,
          onChange: this.canvas.renderAll.bind(this.canvas),
          onComplete: () => {
            obj.animate({ scaleX: startScale, scaleY: startScale }, { 
              duration: 1000,
              easing: fabric.util.ease.easeInOutCubic,
              onChange: this.canvas.renderAll.bind(this.canvas),
            });
          },
        });
      }

      // Animação: Spin (Girar)
      spin(obj, angle = 360) {
        const startAngle = obj.angle;
        const center = obj.getCenterPoint();
        obj.set({
          originX: 'center',
          originY: 'center',
          left: center.x,
          top: center.y
        });
        obj.animate('angle', startAngle + angle, {
          duration: 1000,
          easing: fabric.util.ease.easeOutBack,
          onChange: this.canvas.renderAll.bind(this.canvas),
        });
      }
     
      swing(obj) {
        const startAngle = obj.angle;
        const center = obj.getCenterPoint();
        obj.set({
          originX: 'center',
          originY: 'center',
          left: center.x,
          top: center.y
        });
        obj.animate('angle', startAngle + 10, {
          duration: 300,
          easing: fabric.util.ease.easeInOutCubic,
          onChange: this.canvas.renderAll.bind(this.canvas),
          onComplete: () => {
            obj.animate('angle', startAngle - 10, {
              duration: 300,
              easing: fabric.util.ease.easeInOutCubic,
              onChange: this.canvas.renderAll.bind(this.canvas),
              onComplete: () => {
                obj.animate('angle', startAngle, {
                  duration: 300,
                  easing: fabric.util.ease.easeInOutCubic,
                  onChange: this.canvas.renderAll.bind(this.canvas),
                });
              },
            });
          },
        });
      }
      
      float(obj, distance = 20) {
        const startTop = obj.top;
        obj.animate('top', startTop - distance, {
          duration: 1000,
          easing: fabric.util.ease.easeInOutQuad,
          onChange: this.canvas.renderAll.bind(this.canvas),
          onComplete: () => {
            obj.animate('top', startTop, {
              duration: 1000,
              easing: fabric.util.ease.easeInOutQuad,
              onChange: this.canvas.renderAll.bind(this.canvas),
            });
          },
        });
      }

      // Animação: Typewriter (Máquina de Escrever)
      typewriter(textObj) {
        const fullText = textObj.text;
        textObj.text = '';
        let index = 0;

        const interval = setInterval(() => {
          if (index < fullText.length) {
            textObj.text += fullText[index];
            index++;
            this.canvas.renderAll();
          } else {
            clearInterval(interval);
          }
        }, 100); // Intervalo entre cada letra
      }
    }

    this.animations = new FabricAnimations(fabricCanvas);

  }

  window.ImageEditor.prototype.initializeAnimations = animation;
})();
