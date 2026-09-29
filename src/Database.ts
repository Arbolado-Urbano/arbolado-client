export const DB_NAME = "arboladoUrbano"
export const STORE_NAMES = { trees: "trees", meta: "meta" } as const
export const STORE_KEYS = { meta: { lastSync: "lastSync" }, trees: { all: "all" } } as const
const DB_VERSION = 1

type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES]

export class Database {
  private static _db?: Promise<IDBDatabase>

  /**
   * Returns an IndexedDB connection.
   * 
   * @return Promise that resolves to a IDBDatabase.
   */
  private static get db() {
    if (!Database._db) {
      const promise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION)
        request.addEventListener("error", () => reject(request.error))
        request.addEventListener("upgradeneeded", (event) => {
          const db = request.result
          if (event.oldVersion < 1) {
            db.createObjectStore(STORE_NAMES.trees)
            db.createObjectStore(STORE_NAMES.meta)
          }
        })
        request.addEventListener("blocked", () => {
          console.warn("IndexedDB upgrade blocked by another connection")
        })
        request.addEventListener("success", () => {
          const db = request.result
          db.addEventListener("versionchange", () => {
            db.close()
            Database.invalidate(promise)
          })
          db.addEventListener("close", () => Database.invalidate(promise))
          resolve(db)
        })
      })
      promise.catch(() => Database.invalidate(promise))
      Database._db = promise
    }
    return Database._db
  }

  private static invalidate(promise: Promise<IDBDatabase>) {
    if (Database._db === promise) Database._db = undefined
  }

  private static async transaction<T>(storeName: StoreName, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | void, retry = true): Promise<T> {
    const dbPromise = Database.db
    const db = await dbPromise
    let tx: IDBTransaction
    try {
      tx = db.transaction(storeName, mode, { durability: "relaxed" })
    } catch (error) {
      if (retry && error instanceof DOMException && error.name === "InvalidStateError") {
        Database.invalidate(dbPromise)
        return Database.transaction(storeName, mode, fn, false)
      }
      throw error
    }
    return new Promise<T>((resolve, reject) => {
      let request: IDBRequest<T> | void
      tx.addEventListener("complete", () => resolve((request as IDBRequest<T> | undefined)?.result as T))
      tx.addEventListener("abort", () => reject(tx.error ?? new DOMException("Transaction aborted", "AbortError")))
      try {
        request = fn(tx.objectStore(storeName))
      } catch (e) {
        reject(e)
        try { tx.abort() } catch { }
      }
    })
  }

  /**
   * Stores a value in the IndexedDB.
   * 
   * @param store - The name of the store on which to store the value on.
   * @param data - The data to store store in the DB.
   * @param key - Optional key for the value.
   * 
   * @return Promise that resolves when the value has been stored in the DB.
   */
  public static async put<T>(storeName: StoreName, data: T, key?: IDBValidKey) {
    return Database.transaction(storeName, "readwrite", store => store.put(data, key)).then(() => undefined)
  }

  /**
   * Stores multiple values in the IndexedDB.
   * 
   * @param store - The name of the store on which to store the value on.
   * @param data - The data to store store in the DB.
   * 
   * @return Promise that resolves when the value has been stored in the DB.
   */
  public static async putMany<T>(storeName: StoreName, data: T[], chunkSize = 5000) {
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      await Database.transaction<void>(storeName, "readwrite", (store) => {
        for (const item of chunk) {
          store.put(item)
        }
      })
      await new Promise((resolve) => setTimeout(resolve))
    }
  }

  /**
   * Retrieves a value from the IndexedDB.
   * 
   * @param store - The name of the store from which to fetch the value from.
   * @param key - Key of the value.
   * 
   * @return Promise that resolves to the value in the DB.
   */
  public static async get<T>(storeName: StoreName, key: IDBValidKey) {
    return Database.transaction<T | undefined>(storeName, "readonly", store => store.get(key))
  }

  /**
   * Retrieves a set of values from the IndexedDB.
   * 
   * @param store - The name of the store from which to fetch the values from.
   * 
   * @return Promise that resolves to the values found in the DB.
   */
  public static async getAll<T>(storeName: StoreName) {
    return Database.transaction<T[]>(storeName, "readonly", store => store.getAll())
  }

  /**
   * Deletes a value from the IndexedDB.
   * 
   * @param store - The name of the store from which to delete the value from.
   * @param key - Key of the value.
   * 
   * @return Promise that resolves when the value has been deleted from the DB.
   */
  public static async delete(storeName: StoreName, key: IDBValidKey) {
    return Database.transaction(storeName, "readwrite", store => store.delete(key)).then(() => undefined)
  }

  /**
   * Deletes a value from the IndexedDB.
   * 
   * @param store - The name of the store from which to delete the value from.
   * @param key - Key of the value.
   * 
   * @return Promise that resolves when the value has been deleted from the DB.
   */
  public static async deleteMany(storeName: StoreName, keys: IDBValidKey[], chunkSize = 5000) {
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize)
      await Database.transaction<void>(storeName, "readwrite", (store) => {
        for (const key of chunk) {
          store.delete(key)
        }
      })
      await new Promise((resolve) => setTimeout(resolve))
    }
  }
}