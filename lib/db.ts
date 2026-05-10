/**
 * lib/db.ts — IndexedDB wrapper for Dark Factory Studio.
 * Provides a simple async API over IndexedDB with typed get/put/delete/getAll/clear.
 *
 * Database: dark-factory-db v1
 * Stores: apiKeys, uploads, generations, customModels
 */

function openDB(): IDBOpenDBRequest {
  const request = indexedDB.open('dark-factory-db', 1);

  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (!db.objectStoreNames.contains('apiKeys')) {
      db.createObjectStore('apiKeys', { keyPath: 'provider' });
    }
    if (!db.objectStoreNames.contains('uploads')) {
      db.createObjectStore('uploads', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('generations')) {
      db.createObjectStore('generations', { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('customModels')) {
      db.createObjectStore('customModels', { keyPath: 'id' });
    }
  };

  return request;
}

function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => T
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = openDB();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      try {
        const result = fn(store);
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    };
  });
}

export async function get<T>(store: string, key: string): Promise<T | undefined> {
  try {
    return await withStore(store, 'readonly', (s) => {
      const req = s.get(key);
      return new Promise<T | undefined>((res, rej) => {
        req.onsuccess = () => res(req.result as T | undefined);
        req.onerror = () => rej(req.error);
      });
    });
  } catch {
    return undefined;
  }
}

export async function put<T>(store: string, key: string, value: T): Promise<void> {
  try {
    await withStore(store, 'readwrite', (s) => {
      s.put({ ...value as object, [Object.keys(value as object).find(k => k === 'id' || k === 'provider') || 'id']: key });
    });
  } catch {
    // IndexedDB write failed — ignore
  }
}

export async function putRecord<T extends object>(store: string, record: T): Promise<void> {
  try {
    await withStore(store, 'readwrite', (s) => {
      s.put(record);
    });
  } catch {
    // IndexedDB write failed — ignore
  }
}

export async function deleteRecord(store: string, key: string): Promise<void> {
  try {
    await withStore(store, 'readwrite', (s) => {
      s.delete(key);
    });
  } catch {
    // IndexedDB delete failed — ignore
  }
}

export async function getAll<T>(store: string): Promise<T[]> {
  try {
    return await withStore(store, 'readonly', (s) => {
      const req = s.getAll();
      return new Promise<T[]>((res, rej) => {
        req.onsuccess = () => res(req.result as T[]);
        req.onerror = () => rej(req.error);
      });
    });
  } catch {
    return [];
  }
}

export async function clear(store: string): Promise<void> {
  try {
    await withStore(store, 'readwrite', (s) => {
      s.clear();
    });
  } catch {
    // IndexedDB clear failed — ignore
  }
}