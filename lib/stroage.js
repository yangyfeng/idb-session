// idb api
import IdbStore from './idb'

const idbStore = new IdbStore({ dbName: 'RyFastCreate', storeName: 'KeyValue' })

// log
const log = (name = '', data) => {
  console.log(`%c ${name}`, 'font-size:14px;color:red;', data)
}
// 转成json
const object2Json = value => {
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }
  return value
}
// 是不是一个json string
const isJSON = str => {
  if (typeof str !== 'string') {
    return false
  }
  try {
    const obj = JSON.parse(str)
    if (typeof obj == 'object' && obj) {
      return true
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}
// json装车object
const json2Object = value => {
  if (isJSON(value)) {
    value = JSON.parse(value)
  }
  return value
}
// 是否支持indexDb
const supportIndexDb = () => {
  // 可能的不同浏览器indexDB的构造方法的名字
  const indexedDBKeys = ['indexedDB', 'webkitIndexedDB', 'mozIndexedDB', 'msIndexedDB']
  // indexDB的api方法名
  const idbApiKeys = ['databases', 'deleteDatabase', 'open', 'cmp']
  // 是不是哪一种类型的值
  const isType = (data, type) => Object.prototype.toString.call(data) === `[object ${type}]`
  for (let index = 0; index < indexedDBKeys.length; index++) {
    const key = indexedDBKeys[index]
    const data = window[key]
    // 找到的值是一个IDBFactory Object
    const isDataIDBFactory = isType(data, 'IDBFactory') && isType(data.__proto__, 'IDBFactory')
    if (!isDataIDBFactory) {
      return false
    }
    // 三个方法也要有
    const hasAllApis = idbApiKeys.every(key => {
      const func = data[key] || data.__proto__[key]
      return isType(func, 'Function')
    })
    if (!hasAllApis) {
      return false
    }
    return true
  }
}

const canUseIdb = supportIndexDb()

// -----------------indexDb 模拟session Api-------------
/**
 * @description 保存数据到 idbSession
 * @param {string} key 键
 * @param {*} value 值
 */
const setItem = (key, value) => {
  return new Promise((resolve, reject) => {
    idbStore
      .get(key)
      .then(val => {
        // 有值了，执行跟新
        if (val !== undefined && val !== null) {
          idbStore
            .update(key, () => value)
            .then(() => resolve())
            .catch(err => reject(err))
        } else {
          // 没有值，执行设置
          idbStore
            .set(key, value)
            .then(() => resolve())
            .catch(err => reject(err))
        }
      })
      .catch(err => reject(err))
  })
}

/**
 * @description 从 idbSession 获取数据
 * @param {string} key 键
 */
const getItem = key => {
  return new Promise((resolve, reject) => {
    idbStore
      .get(key)
      .then(val => resolve(val))
      .catch(err => reject(err))
  })
}

/**
 * @description 从 idbSession 删除保存的数据
 * @param {string | array} key 键或键的集合 支持一次删除多个
 */
const removeItem = key => {
  // 多个键
  const isManyKey = Array.isArray(key) && key.length !== 0 && key.every(k => typeof k === 'string')
  // 单个键
  const isSingleKey = key && typeof key === 'string'

  // 要删除键
  let arr = []
  if (isSingleKey) {
    arr = [key]
  }
  if (isManyKey) {
    arr = key
  }

  return new Promise((resolve, reject) => {
    idbStore
      .delMany(arr)
      .then(() => resolve())
      .catch(err => reject(err))
  })
}

/**
 * @description 从 idbSession 删除所有保存的数据
 */
const clear = () => {
  return new Promise((resolve, reject) => {
    idbStore
      .clear()
      .then(() => resolve())
      .catch(err => reject(err))
  })
}

/**
 * @description 从 idbSession 获取所有保存的数据
 * @returns {object} data 数据
 */
const getAllItem = () => {
  return new Promise((resolve, reject) => {
    idbStore
      .entries()
      .then(entries => {
        const [keys, values] = entries
        const data = {}
        for (let index = 0; index < keys.length; index++) {
          data[keys[index]] = values[index]
        }
        resolve(data)
      })
      .catch(err => reject(err))
  })
}

/**
 * @description 从 idbSession 获取所有保存的数据的key
 * @returns {object} data 数据的key
 */
 const getAllKey = () => {
  return new Promise((resolve, reject) => {
    idbStore
      .keys()
      .then(keys =>resolve(keys))
      .catch(err => reject(err))
  })
}

// -------------------------返回数据--------------------
const idbSession = {}

/**
 * @description 设置值
 * @param {string} key
 * @param {*} value
 * @param {bool} use 是不是使用session,默认使用indexDb
 */
idbSession.setItem = async (key, value, use) => {
  // 传入的值有值并且为true
  const uses = typeof use === 'boolean' && use === true
  // 用idb
  const useIdb = !uses && canUseIdb
  // 用session
  const useSession = uses || !canUseIdb
  try {
    if (useIdb) {
      await setItem(key, value)
    }
    if (useSession) {
      window.sessionStorage.setItem(key, object2Json(value))
    }
  } catch (error) {
    log('idbSession setItem', error)
  }
}

/**
 * @description 获取值
 * @param {string} key
 * @param {bool} use 是不是使用session,默认使用indexDb
 */
idbSession.getItem = async (key, use) => {
  // 传入的值有值并且为true
  const uses = typeof use === 'boolean' && use === true
  // 用idb
  const useIdb = !uses && canUseIdb
  // 用session
  const useSession = uses || !canUseIdb
  let res = null
  try {
    if (useIdb) {
      res = await getItem(key)
    }
    if (useSession) {
      res = window.sessionStorage.getItem(key)
      res = json2Object(res)
    }
  } catch (error) {
    log('idbSession getItem', error)
  }
  return res
}

/**
 * @description 删除值
 * @param {string} key
 * @param {bool} use 是不是使用session,默认使用indexDb
 */
idbSession.removeItem = async (key, use) => {
  // 传入的值有值并且为true
  const uses = typeof use === 'boolean' && use === true
  // 用idb
  const useIdb = !uses && canUseIdb
  // 用session
  const useSession = uses || !canUseIdb
  try {
    if (useIdb) {
      await removeItem(key)
    }
    if (useSession) {
      // 多个键
      const isManyKey =
        Array.isArray(key) && key.length !== 0 && key.every(k => typeof k === 'string')
      // 单个键
      const isSingleKey = key && typeof key === 'string'
      // 要删除键
      let arr = []
      if (isSingleKey) {
        arr = [key]
      }
      if (isManyKey) {
        arr = key
      }
      for (let index = 0; index < arr.length; index++) {
        const k = arr[index]
        window.sessionStorage.removeItem(k)
      }
    }
  } catch (error) {
    log('idbSession removeItem', error)
  }
}

/**
 * @description 清空所有值
 * @param {bool} use 是不是使用session,默认使用indexDb
 */
idbSession.clear = async use => {
  // 传入的值有值并且为true
  const uses = typeof use === 'boolean' && use === true
  // 用idb
  const useIdb = !uses && canUseIdb
  // 用session
  const useSession = uses || !canUseIdb
  try {
    if (useIdb) {
      await clear()
    }
    if (useSession) {
      window.sessionStorage.clear()
    }
  } catch (error) {
    log('idbSession clear', error)
  }
}

/**
 * @description 获取所有值
 * @param {bool} use 是不是使用session,默认使用indexDb
 */
idbSession.getAllItem = async use => {
  // 传入的值有值并且为true
  const uses = typeof use === 'boolean' && use === true
  // 用idb
  const useIdb = !uses && canUseIdb
  // 用session
  const useSession = uses || !canUseIdb
  let allData = null
  try {
    const getAllSessionItem = () => {
      const keys = Object.keys(window.sessionStorage)
      const data = {}
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        const res = window.sessionStorage.getItem(key)
        data[key] = json2Object(res)
      }
    }
    if (useIdb) {
      allData = await getAllItem()
    }
    if (useSession) {
      allData = getAllSessionItem()
    }
  } catch (error) {
    log('idbSession getAllItem', error)
  }
  return allData
}

/**
 * @description 获取所有值的key
 * @param {bool} use 是不是使用session,默认使用indexDb
 */
 idbSession.getAllKey = async use => {
  // 传入的值有值并且为true
  const uses = typeof use === 'boolean' && use === true
  // 用idb
  const useIdb = !uses && canUseIdb
  // 用session
  const useSession = uses || !canUseIdb
  let allData = null
  try {
    const getAllSessionItem = () => {
      const keys = Object.keys(window.sessionStorage)
      const data = {}
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        const res = window.sessionStorage.getItem(key)
        data[key] = json2Object(res)
      }
    }
    if (useIdb) {
      allData = await getAllKey()
    }
    if (useSession) {
      allData = getAllSessionItem()
      allData = Object.keys()
    }
  } catch (error) {
    log('idbSession getAllItem', error)
  }
  return allData
}


export default idbSession
