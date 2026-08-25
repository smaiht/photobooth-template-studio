/**
 * Persistent storage for the current browser draft.
 */
(function () {
  'use strict';

  const DATABASE_NAME = 'template-studio';
  const STORE_NAME = 'draft';
  let databasePromise;

  function openDatabase() {
    if (!databasePromise) {
      databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, 2);

        request.onupgradeneeded = () => {
          if (request.result.objectStoreNames.contains(STORE_NAME)) {
            request.result.deleteObjectStore(STORE_NAME);
          }
          request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => {
          request.result.onversionchange = () => request.result.close();
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Browser storage is blocked'));
      });
    }

    return databasePromise;
  }

  async function runRequest(mode, createRequest) {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const request = createRequest(transaction.objectStore(STORE_NAME));
      let result = null;

      request.onsuccess = () => {
        result = request.result ?? null;
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || request.error);
      transaction.onabort = () => reject(transaction.error || request.error);
    });
  }

  window.saveInBrowser = {
    save(key, value) {
      return runRequest('readwrite', store => store.put(value, key));
    },

    load(key) {
      return runRequest('readonly', store => store.get(key));
    },
  };
})();
