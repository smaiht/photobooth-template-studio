/**
 * Define utils to save/load canvas status with local storage
 */
window.saveInBrowser = {
  save: (name, value) => {
    // if item is an object, stringify
    if (value instanceof Object) {
      value = JSON.stringify(value);
    }

    localStorage.setItem(name, value);

    // Dispatch a event after saving
    const event = new CustomEvent('ImageEditor.storageSave', { detail: { name, value } });
    window.dispatchEvent(event);
  },
  load: (name) => {
    let value = localStorage.getItem(name);
    value = JSON.parse(value);

    return value;
  },
  remove: (name) => {
    localStorage.removeItem(name);
  }
};
