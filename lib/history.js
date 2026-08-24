/**
 * Override the initialize function for the _historyInit();
 */
fabric.Canvas.prototype.initialize = (function (originalFn) {
  return function (...args) {
    originalFn.call(this, ...args);
    // this._historyInit(); 
    return this;
  };
})(fabric.Canvas.prototype.initialize);

/**
 * Override the dispose function for the _historyDispose();
 */
fabric.Canvas.prototype.dispose = (function (originalFn) {
  return function (...args) {
    originalFn.call(this, ...args);
    this._historyDispose();
    return this;
  };
})(fabric.Canvas.prototype.dispose);

/**
 * Returns current state of the string of the canvas
 */
fabric.Canvas.prototype._historyNext = function () {
  const historyData = this.toJSON(this.extraProps);

  // The background is a project asset, not an editable canvas action. Keeping
  // it here would copy a large data/blob URL into every undo state.
  delete historyData.background;
  delete historyData.backgroundImage;
  delete historyData.overlay;
  delete historyData.overlayImage;

  historyData.objects = historyData.objects.filter((obj, index) => {
    const canvasObj = this.getObjects()[index];

    if (canvasObj?.excludeFromHistory) {
      return false;
    }

    if (canvasObj && canvasObj.uniqueId) {
      obj.uniqueId = canvasObj.uniqueId;
    }

    return true;
  });

  return JSON.stringify(historyData);
};

/**
 * Returns an object with fabricjs event mappings
 */
fabric.Canvas.prototype._historyEvents = function () {
  return {
    'object:added': (e) => this._historySaveAction(e),
    'object:removed': (e) => this._historySaveAction(e),
    'object:modified': (e) => this._historySaveAction(e),
    'object:skewing': (e) => this._historySaveAction(e),

    'object:property-realy-changed': (e) => this._historySaveProperty(e),
  };
};

/**
 * Initialization
 */
fabric.Canvas.prototype._historyInit = function () {
  if (this.historyInitialized) {
    console.log('История уже была инициализирована');
    return;
  }

  console.log('Инициализация истории...');
  this.historyUndo = [];
  this.historyRedo = [];
  this.extraProps = [
    'uniqueId',
    'selectable',
    'editable',
    'kind',
    'photoIndex',
    'excludeFromExport',
    'excludeFromHistory',
  ];
  this.historyInitialized = true;
  
  this.on(this._historyEvents());
};

/**
 * Remove the custom event listeners
 */
fabric.Canvas.prototype._historyDispose = function () {
  this.off(this._historyEvents());
};

fabric.Canvas.prototype._areStatesEqual = function(state1, state2) {
  if (!state1 || !state2) return false;
  
  try {
    return JSON.stringify(state1) === JSON.stringify(state2);
  } catch (e) {
    console.error('Ошибка при сравнении состояний:', e);
    return false;
  }
};

/**
 * It pushes the state of the canvas into history stack
 */
fabric.Canvas.prototype._historySaveAction = function (e) {
  if (this.historyProcessing) {
    return;
  }
  
  this.historyRedo = [];
  console.log('Очищена альтернативная ветка истории');

  if (!e || (e.target && !e.target.excludeFromHistory)) {
    const json = this._historyNext();
    const lastState = this.historyUndo[this.historyUndo.length - 1];

    if (json !== lastState) {
      console.log('+ 1 к истории', JSON.parse(json));
      this.historyUndo.push(json);
    }
  }
};

fabric.Canvas.prototype._historySaveProperty = function (e) {
  if (this.historyProcessing) {
    return;
  }
  
  this.historyRedo = [];
  console.log('Очищена альтернативная ветка истории');

  const currentState = this._historyNext();
  const lastState = this.historyUndo[this.historyUndo.length - 1];

  if (currentState !== lastState) {
    console.log('🔥 Saving New State', JSON.parse(currentState));
    this.historyUndo.push(currentState);
    
  } else {
    console.log('⏩ State Unchanged, Skipping Save');
  }
};


/**
 * Undo
 */
fabric.Canvas.prototype.undo = function (callback) {
  this.historyProcessing = true;

  if (this.historyUndo.length > 1) { // Должно быть хотя бы 2 состояния: начальное и текущее
    const currentState = this.historyUndo.pop(); // Удаляем текущее состояние из historyUndo
    this.historyRedo.push(currentState); // Сохраняем его в historyRedo
    console.log('Состояние сохранено в Redo. Доступно для повтора:', this.historyRedo.length);
    
    const previousState = this.historyUndo[this.historyUndo.length - 1]; // Берем предыдущее состояние
    this.historyNextState = previousState;
    this._loadHistory(previousState, 'history:undo', callback); // Загружаем предыдущее состояние
    console.log('Отмена действия. Состояний в Undo:', this.historyUndo.length);

  } else {
    console.log('Нет действий для отмены');
    this.historyProcessing = false;
  }
};


/**
 * Redo
 */
fabric.Canvas.prototype.redo = function (callback) {
  this.historyProcessing = true;
  
  if (this.historyRedo.length > 0) { // Должно быть хотя бы одно состояние для повтора
    const stateToRedo = this.historyRedo.pop(); // Берем последнее состояние из historyRedo
    this.historyUndo.push(stateToRedo); // Добавляем его в historyUndo
    console.log('Состояние восстановлено из Redo в Undo. Состояний в Undo:', this.historyUndo.length);
    
    this.historyNextState = stateToRedo;
    this._loadHistory(stateToRedo, 'history:redo', callback); // Загружаем состояние на холст
    console.log('Повтор действия. Состояний в Redo:', this.historyRedo.length);

  } else {
    console.log('Нет действий для повтора');
    this.historyProcessing = false;
  }
};



// looks like applyTemplate method
fabric.Canvas.prototype._loadHistory = function (history, event, callback) {
  const that = this;
  const parsedHistory = JSON.parse(history);

  const lastActiveObjectIds = that.getActiveObjects()
    .map(obj => obj.uniqueId);

  that.getObjects().forEach(obj => {
    that.remove(obj);
  });

  if (parsedHistory.objects) {
    fabric.util.enlivenObjects(parsedHistory.objects, (objects) => {
      const objectsToSelect = [];

      objects.forEach(obj => {
        that.add(obj);

        if (lastActiveObjectIds.includes(obj.uniqueId)) {
          objectsToSelect.push(obj);
        }
      });

      // Восстанавливаем выделение
      if (objectsToSelect.length > 0) {
        const selection = new fabric.ActiveSelection(objectsToSelect, {
          canvas: that
        });
        that.setActiveObject(selection);
      } else {
        that.discardActiveObject();
      }

      that.renderAll();
      that.fire(event);
      that.historyProcessing = false;

      if (callback && typeof callback === 'function') callback();
    });
  }
};

/**
 * Clear undo and redo history stacks
 */
fabric.Canvas.prototype.clearHistory = function () {
  this.historyUndo = [];
  this.historyRedo = [];
  this.fire('history:clear');
};

/**
 * On the history
 */
fabric.Canvas.prototype.onHistory = function () {
  this.historyProcessing = false;

  this._historySaveAction();
};

/**
 * Check if there are actions that can be undone
 */

fabric.Canvas.prototype.canUndo = function () {
  return this.historyUndo.length > 1;
};

/**
 * Check if there are actions that can be redone
 */
fabric.Canvas.prototype.canRedo = function () {
  return this.historyRedo.length > 0;
};

/**
 * Off the history
 */
fabric.Canvas.prototype.offHistory = function () {
  this.historyProcessing = true;
};
