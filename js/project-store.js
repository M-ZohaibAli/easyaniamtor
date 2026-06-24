const DB_NAME = 'EasyAnimationDB'
const DB_VER = 1
let db = null

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore('projects', { keyPath: 'id' })
      store.createIndex('updatedAt', 'updatedAt', { unique: false })
    }
    req.onsuccess = () => { db = req.result; resolve() }
    req.onerror = () => reject(req.error)
  })
}

const ProjectStore = {
  async list() {
    const tx = db.transaction('projects', 'readonly')
    const store = tx.objectStore('projects')
    const index = store.index('updatedAt')
    return new Promise((resolve, reject) => {
      const result = []
      const req = index.openCursor(null, 'prev')
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) { result.push(cursor.value); cursor.continue() }
        else resolve(result)
      }
      req.onerror = () => reject(req.error)
      tx.onerror = () => reject(tx.error)
    })
  },

  async get(id) {
    const tx = db.transaction('projects', 'readonly')
    return new Promise((resolve, reject) => {
      const req = tx.objectStore('projects').get(id)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
      tx.onerror = () => reject(tx.error)
    })
  },

  async save(project) {
    project.updatedAt = Date.now()
    const tx = db.transaction('projects', 'readwrite')
    return new Promise((resolve, reject) => {
      const req = tx.objectStore('projects').put(project)
      req.onerror = () => reject(req.error)
      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  },

  async delete(id) {
    const tx = db.transaction('projects', 'readwrite')
    return new Promise((resolve, reject) => {
      const req = tx.objectStore('projects').delete(id)
      req.onerror = () => reject(req.error)
      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  }
}
