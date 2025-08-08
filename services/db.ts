
import type { UploadedFile, AnalysisRecord, KnowledgeItem, Timeframe, SavedAnalysisRecord, WatchlistItem, LearnedTechnique } from '../types';

const DB_NAME = 'FinancialAnalystDB';
const DB_VERSION = 9;
const FILES_STORE_NAME = 'files';
const ANALYSIS_STORE_NAME = 'analyses';
const KNOWLEDGE_STORE_NAME = 'knowledge';
const SAVED_ANALYSIS_STORE_NAME = 'savedAnalyses';
const WATCHLIST_STORE_NAME = 'watchlist';
const TECHNIQUES_STORE_NAME = 'techniques';


let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      const transaction = (event.target as IDBOpenDBRequest).transaction;


      if (oldVersion < 2) {
          if (!dbInstance.objectStoreNames.contains(FILES_STORE_NAME)) {
            dbInstance.createObjectStore(FILES_STORE_NAME, { keyPath: 'name' });
          }
          if (!dbInstance.objectStoreNames.contains(ANALYSIS_STORE_NAME)) {
            dbInstance.createObjectStore(ANALYSIS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
          }
      }
      
      if (oldVersion < 3) {
          if (transaction) {
            const fileStore = transaction.objectStore(FILES_STORE_NAME);
            if (!fileStore.indexNames.contains('by_hash')) {
                fileStore.createIndex('by_hash', 'contentHash', { unique: true });
            }
          }
      }
      
      if (oldVersion < 4) {
        if (!dbInstance.objectStoreNames.contains(KNOWLEDGE_STORE_NAME)) {
            const knowledgeStore = dbInstance.createObjectStore(KNOWLEDGE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            knowledgeStore.createIndex('by_symbol_timeframe', ['symbol', 'timeframe'], { unique: false });
            knowledgeStore.createIndex('by_type', 'type', { unique: false });
            knowledgeStore.createIndex('by_timestamp', 'timestamp', { unique: false });
            knowledgeStore.createIndex('by_source_id', 'sourceAnalysisId', { unique: false });
        }
      }
      
       if (oldVersion < 5) {
          if (!dbInstance.objectStoreNames.contains(SAVED_ANALYSIS_STORE_NAME)) {
            const savedStore = dbInstance.createObjectStore(SAVED_ANALYSIS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            savedStore.createIndex('by_timestamp', 'timestamp', { unique: false });
          }
      }

      if (oldVersion < 6) {
          if(transaction) {
            const analysisStore = transaction.objectStore(ANALYSIS_STORE_NAME);
            if (!analysisStore.indexNames.contains('by_timezone')) {
                analysisStore.createIndex('by_timezone', 'timezone', { unique: false });
            }
            const savedAnalysisStore = transaction.objectStore(SAVED_ANALYSIS_STORE_NAME);
             if (!savedAnalysisStore.indexNames.contains('by_timezone')) {
                savedAnalysisStore.createIndex('by_timezone', 'timezone', { unique: false });
            }
          }
      }
       if (oldVersion < 7) {
          if (!dbInstance.objectStoreNames.contains(WATCHLIST_STORE_NAME)) {
            const watchlistStore = dbInstance.createObjectStore(WATCHLIST_STORE_NAME, { keyPath: 'symbol' });
            watchlistStore.createIndex('by_added_at', 'addedAt', { unique: false });
          }
      }
      if (oldVersion < 8) {
          if (!dbInstance.objectStoreNames.contains(TECHNIQUES_STORE_NAME)) {
            const techStore = dbInstance.createObjectStore(TECHNIQUES_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            techStore.createIndex('by_type', 'type', { unique: false });
            techStore.createIndex('by_name', 'name', { unique: false });
            techStore.createIndex('by_createdAt', 'createdAt', { unique: false });
          }
      }
       if (oldVersion < 9) {
          if (dbInstance.objectStoreNames.contains(FILES_STORE_NAME)) {
              dbInstance.deleteObjectStore(FILES_STORE_NAME);
          }
          const fileStore = dbInstance.createObjectStore(FILES_STORE_NAME, { keyPath: ['symbol', 'name'] });
          fileStore.createIndex('by_symbol', 'symbol', { unique: false });
      }
    };
  });
  return dbPromise;
};

// --- Generic Helper for Replacing Store Content ---
const replaceStoreContent = async <T>(storeName: string, items: T[]): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();

        store.clear();
        items.forEach(item => {
            // For auto-incrementing stores, we must not provide the id.
            // For other stores, the keyPath is part of the item.
             if (store.autoIncrement && 'id' in (item as any)) {
                const { id, ...itemWithoutId } = item as any;
                store.add(itemWithoutId);
            } else {
                store.add(item);
            }
        });
    });
};

// --- Generic Clear Function ---
const clearObjectStore = async (storeName: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};


// --- Files Store Functions ---

export const addFilesToDB = async (files: UploadedFile[]): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction(FILES_STORE_NAME, 'readwrite');
  const store = transaction.objectStore(FILES_STORE_NAME);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error);
    };
    files.forEach(file => {
      store.put(file);
    });
  });
};

export const getAllFilesFromDB = async (): Promise<UploadedFile[]> => {
  const db = await openDB();
  const transaction = db.transaction(FILES_STORE_NAME, 'readonly');
  const store = transaction.objectStore(FILES_STORE_NAME);
  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve((request.result as UploadedFile[]).sort((a,b) => a.name.localeCompare(b.name)));
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
};

export const removeFileFromDB = async (key: { symbol: string; name: string }): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(FILES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(FILES_STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = store.delete([key.symbol, key.name]);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const clearFilesFromDB = () => clearObjectStore(FILES_STORE_NAME);
export const replaceFilesInDB = (items: UploadedFile[]) => replaceStoreContent(FILES_STORE_NAME, items);


// --- Analysis History Store Functions ---

export const addAnalysisToDB = async (record: Omit<AnalysisRecord, 'id'>): Promise<number> => {
    const db = await openDB();
    const transaction = db.transaction(ANALYSIS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ANALYSIS_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.add(record);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
};

export const getAllAnalysesFromDB = async (): Promise<AnalysisRecord[]> => {
    const db = await openDB();
    const transaction = db.transaction(ANALYSIS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(ANALYSIS_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve((request.result as AnalysisRecord[]).sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject(request.error);
    });
};

export const removeAnalysisFromDB = async (id: number): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction([ANALYSIS_STORE_NAME, KNOWLEDGE_STORE_NAME], 'readwrite');
    const analysisStore = transaction.objectStore(ANALYSIS_STORE_NAME);
    const knowledgeStore = transaction.objectStore(KNOWLEDGE_STORE_NAME);
    const knowledgeIndex = knowledgeStore.index('by_source_id');

    return new Promise((resolve, reject) => {
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve();

        const getKnowledgeRequest = knowledgeIndex.getAll(id);
        getKnowledgeRequest.onsuccess = () => {
            const knowledgeItemsToDelete = getKnowledgeRequest.result as KnowledgeItem[];
            knowledgeItemsToDelete.forEach(item => {
                if (item.id) {
                    knowledgeStore.delete(item.id);
                }
            });
            analysisStore.delete(id);
        };
    });
};

export const updateAnalysisRecordInDB = async (id: number, updates: Partial<AnalysisRecord>): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(ANALYSIS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ANALYSIS_STORE_NAME);
    const getRequest = store.get(id);

    return new Promise((resolve, reject) => {
        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => {
            const record = getRequest.result;
            if (record) {
                const updatedRecord = { ...record, ...updates };
                const putRequest = store.put(updatedRecord);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                reject(new Error(`Record with id ${id} not found in history.`));
            }
        };
    });
};

export const clearAnalysesFromDB = () => clearObjectStore(ANALYSIS_STORE_NAME);
export const replaceHistoryInDB = (items: AnalysisRecord[]) => replaceStoreContent(ANALYSIS_STORE_NAME, items);


// --- Knowledge Base Store Functions ---

export const addKnowledgeItemsToDB = async (items: Omit<KnowledgeItem, 'id'>[]): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(KNOWLEDGE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(KNOWLEDGE_STORE_NAME);

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        items.forEach(item => store.add(item));
    });
};

export const getKnowledgeForContextFromDB = async (symbol: string, timeframe: Timeframe, limit: number): Promise<KnowledgeItem[]> => {
    const db = await openDB();
    const transaction = db.transaction(KNOWLEDGE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(KNOWLEDGE_STORE_NAME);
    const index = store.index('by_symbol_timeframe');
    const request = index.getAll(IDBKeyRange.only([symbol, timeframe]));

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const allItems = request.result as KnowledgeItem[];
            const sortedItems = allItems.sort((a, b) => b.timestamp - a.timestamp);
            resolve(sortedItems.slice(0, limit));
        };
        request.onerror = () => {
            reject(request.error);
        };
    });
};

export const getAllKnowledgeItemsFromDB = async (): Promise<KnowledgeItem[]> => {
    const db = await openDB();
    const transaction = db.transaction(KNOWLEDGE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(KNOWLEDGE_STORE_NAME);
    const index = store.index('by_timestamp');
    const request = index.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve((request.result as KnowledgeItem[]).sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject(request.error);
    });
};

export const updateKnowledgeItemInDB = async (item: KnowledgeItem): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(KNOWLEDGE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(KNOWLEDGE_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteKnowledgeItemFromDB = async (id: number): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(KNOWLEDGE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(KNOWLEDGE_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};


export const clearKnowledgeFromDB = () => clearObjectStore(KNOWLEDGE_STORE_NAME);
export const replaceKnowledgeInDB = (items: KnowledgeItem[]) => replaceStoreContent(KNOWLEDGE_STORE_NAME, items);

// --- Saved Analysis Store Functions ---

export const addSavedAnalysisToDB = async (record: Omit<SavedAnalysisRecord, 'id'>): Promise<number> => {
    const db = await openDB();
    const transaction = db.transaction(SAVED_ANALYSIS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SAVED_ANALYSIS_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.add(record);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
};

export const getAllSavedAnalysesFromDB = async (): Promise<SavedAnalysisRecord[]> => {
    const db = await openDB();
    const transaction = db.transaction(SAVED_ANALYSIS_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SAVED_ANALYSIS_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve((request.result as SavedAnalysisRecord[]).sort((a, b) => b.timestamp - a.timestamp));
        };
        request.onerror = () => reject(request.error);
    });
};

export const removeSavedAnalysisFromDB = async (id: number): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(SAVED_ANALYSIS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SAVED_ANALYSIS_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const updateSavedAnalysisRecordInDB = async (id: number, updates: Partial<SavedAnalysisRecord>): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(SAVED_ANALYSIS_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SAVED_ANALYSIS_STORE_NAME);
    const getRequest = store.get(id);

    return new Promise((resolve, reject) => {
        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => {
            const record = getRequest.result;
            if (record) {
                const updatedRecord = { ...record, ...updates };
                const putRequest = store.put(updatedRecord);
                putRequest.onsuccess = () => resolve();
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                reject(new Error(`Record with id ${id} not found in saved analyses.`));
            }
        };
    });
};

export const clearSavedAnalysesFromDB = () => clearObjectStore(SAVED_ANALYSIS_STORE_NAME);
export const replaceSavedAnalysesInDB = (items: SavedAnalysisRecord[]) => replaceStoreContent(SAVED_ANALYSIS_STORE_NAME, items);


// --- Watchlist Store Functions ---

export const addSymbolToWatchlistDB = async (item: WatchlistItem): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(WATCHLIST_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(WATCHLIST_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getAllWatchlistItemsDB = async (): Promise<WatchlistItem[]> => {
    const db = await openDB();
    const transaction = db.transaction(WATCHLIST_STORE_NAME, 'readonly');
    const store = transaction.objectStore(WATCHLIST_STORE_NAME);
    const index = store.index('by_added_at');
    const request = index.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve((request.result as WatchlistItem[]).sort((a, b) => b.addedAt - a.addedAt));
        };
        request.onerror = () => reject(request.error);
    });
};

export const removeSymbolFromWatchlistDB = async (symbol: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(WATCHLIST_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(WATCHLIST_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.delete(symbol);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const clearWatchlistFromDB = () => clearObjectStore(WATCHLIST_STORE_NAME);
export const replaceWatchlistInDB = (items: WatchlistItem[]) => replaceStoreContent(WATCHLIST_STORE_NAME, items);

// --- Learned Techniques Store Functions ---

export const addTechniquesToDB = async (techniques: Omit<LearnedTechnique, 'id'>[]): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(TECHNIQUES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(TECHNIQUES_STORE_NAME);
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e);
        techniques.forEach(tech => store.add(tech));
    });
};

export const getAllTechniquesFromDB = async (): Promise<LearnedTechnique[]> => {
    const db = await openDB();
    const transaction = db.transaction(TECHNIQUES_STORE_NAME, 'readonly');
    const store = transaction.objectStore(TECHNIQUES_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            resolve((request.result as LearnedTechnique[]).sort((a, b) => b.createdAt - a.createdAt));
        };
        request.onerror = () => reject(request.error);
    });
};

export const updateTechniqueInDB = async (technique: LearnedTechnique): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(TECHNIQUES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(TECHNIQUES_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.put(technique);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteTechniqueFromDB = async (id: number): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction(TECHNIQUES_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(TECHNIQUES_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const clearTechniquesFromDB = () => clearObjectStore(TECHNIQUES_STORE_NAME);
export const replaceTechniquesInDB = (items: LearnedTechnique[]) => replaceStoreContent(TECHNIQUES_STORE_NAME, items);
