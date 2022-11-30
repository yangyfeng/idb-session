// idb api
import IdbStore from './idb';
import { log, errInfo, object2Json, isJSON, json2Object, supportIndexDb } from './utils';

// -----------------indexDb 模拟session Api-------------
/**
 * @description 保存数据到 idbSession
 * @param {string} key 键
 * @param {*} value 值
 * @param {*} idbStore 实例
 */
const setItem = (key, value, idbStore) => {
  return new Promise((resolve, reject) => {
    idbStore
      .get(key)
      .then((val) => {
        // 有值了，执行跟新
        if (val !== undefined && val !== null) {
          idbStore
            .update(key, () => value)
            .then(() => resolve())
            .catch((err) => reject(err));
        } else {
          // 没有值，执行设置
          idbStore
            .set(key, value)
            .then(() => resolve())
            .catch((err) => reject(err));
        }
      })
      .catch((err) => reject(err));
  });
};

/**
 * @description 从 idbSession 获取数据
 * @param {*} idbStore 实例
 * @param {string} key 键
 */
const getItem = (key, idbStore) => {
  return new Promise((resolve, reject) => {
    idbStore
      .get(key)
      .then((val) => resolve(val))
      .catch((err) => reject(err));
  });
};

/**
 * @description 从 idbSession 删除保存的数据
 * @param {string | array} key 键或键的集合 支持一次删除多个
 * @param {*} idbStore 实例
 */
const removeItem = (key, idbStore) => {
  // 多个键
  const isManyKey =
    Array.isArray(key) && key.length !== 0 && key.every((k) => typeof k === 'string');
  // 单个键
  const isSingleKey = key && typeof key === 'string';

  // 要删除键
  let arr = [];
  if (isSingleKey) {
    arr = [key];
  }
  if (isManyKey) {
    arr = key;
  }

  return new Promise((resolve, reject) => {
    idbStore
      .delMany(arr)
      .then(() => resolve())
      .catch((err) => reject(err));
  });
};

/**
 * @description 从 idbSession 删除所有保存的数据
 * @param {*} idbStore 实例
 */
const clear = (idbStore) => {
  return new Promise((resolve, reject) => {
    idbStore
      .clear()
      .then(() => resolve())
      .catch((err) => reject(err));
  });
};

/**
 * @description 从 idbSession 获取所有保存的数据
 * @param {*} idbStore 实例
 * @returns {object} data 数据
 */
const getAllItem = (idbStore) => {
  return new Promise((resolve, reject) => {
    idbStore
      .entries()
      .then((entries) => {
        const data = {};
        for (let index = 0; index < entries.length; index++) {
          const [key, value] = entries[index];
          data[key] = value;
        }
        resolve(data);
      })
      .catch((err) => reject(err));
  });
};

/**
 * @description 从 idbSession 获取所有保存的数据的key
 * @param {*} idbStore 实例
 * @returns {object} data 数据的key
 */
const getAllKey = (idbStore) => {
  return new Promise((resolve, reject) => {
    idbStore
      .keys()
      .then((keys) => resolve(keys))
      .catch((err) => reject(err));
  });
};

// -------------------------返回数据--------------------
class IdbSession {
  constructor({ dbName, storeName, code }) {
    dbName = dbName || 'RyFastCreate';
    if (code) {
      dbName = dbName + '-' + code;
    }
    this.dbOptions = {
      dbName,
      storeName: storeName || 'KeyValue',
    };
    this.idbStore = new IdbStore(this.dbOptions);
    this.canUseIdb = supportIndexDb();
  }

  /**
   * @description 设置值
   * @param {string} key
   * @param {*} value
   * @param {bool} use 是不是使用session,默认使用indexDb
   */
  async setItem(key, value, use) {
    // 传入的值有值并且为true
    const uses = typeof use === 'boolean' && use === true;
    // 用idb
    const useIdb = !uses && this.canUseIdb;
    // 用session
    const useSession = uses || !this.canUseIdb;
    try {
      if (useIdb) {
        await setItem(key, value, this.idbStore);
      }
      if (useSession) {
        window.sessionStorage.setItem(key, object2Json(value));
      }
    } catch (error) {
      errInfo('stroage.setItem', error);
    }
  }

  /**
   * @description 获取值
   * @param {string} key
   * @param {bool} use 是不是使用session,默认使用indexDb
   */
  async getItem(key, use) {
    // 传入的值有值并且为true
    const uses = typeof use === 'boolean' && use === true;
    // 用idb
    const useIdb = !uses && this.canUseIdb;
    // 用session
    const useSession = uses || !this.canUseIdb;
    let res = null;
    try {
      if (useIdb) {
        res = await getItem(key, this.idbStore);
      }
      if (useSession) {
        res = window.sessionStorage.getItem(key);
        res = json2Object(res);
      }
    } catch (error) {
      errInfo('stroage.getItem', error);
    }
    return res;
  }

  /**
   * @description 删除值
   * @param {string} key
   * @param {bool} use 是不是使用session,默认使用indexDb
   */
  async removeItem(key, use) {
    // 传入的值有值并且为true
    const uses = typeof use === 'boolean' && use === true;
    // 用idb
    const useIdb = !uses && this.canUseIdb;
    // 用session
    const useSession = uses || !this.canUseIdb;
    try {
      if (useIdb) {
        await removeItem(key, this.idbStore);
      }
      if (useSession) {
        // 多个键
        const isManyKey =
          Array.isArray(key) && key.length !== 0 && key.every((k) => typeof k === 'string');
        // 单个键
        const isSingleKey = key && typeof key === 'string';
        // 要删除键
        let arr = [];
        if (isSingleKey) {
          arr = [key];
        }
        if (isManyKey) {
          arr = key;
        }
        for (let index = 0; index < arr.length; index++) {
          const k = arr[index];
          window.sessionStorage.removeItem(k);
        }
      }
    } catch (error) {
      errInfo('stroage.removeItem', error);
    }
  }

  /**
   * @description 清空所有值
   * @param {bool} use 是不是使用session,默认使用indexDb
   */
  async clear(use) {
    // 传入的值有值并且为true
    const uses = typeof use === 'boolean' && use === true;
    // 用idb
    const useIdb = !uses && this.canUseIdb;
    // 用session
    const useSession = uses || !this.canUseIdb;
    try {
      if (useIdb) {
        await clear(this.idbStore);
      }
      if (useSession) {
        window.sessionStorage.clear();
      }
    } catch (error) {
      errInfo('stroage.clear', error);
    }
  }

  /**
   * @description 获取所有值
   * @param {bool} use 是不是使用session,默认使用indexDb
   */
  async getAllItem(use) {
    // 传入的值有值并且为true
    const uses = typeof use === 'boolean' && use === true;
    // 用idb
    const useIdb = !uses && this.canUseIdb;
    // 用session
    const useSession = uses || !this.canUseIdb;
    let allData = null;
    try {
      const getAllSessionItem = () => {
        const keys = Object.keys(window.sessionStorage);
        const data = {};
        for (let index = 0; index < keys.length; index++) {
          const key = keys[index];
          const res = window.sessionStorage.getItem(key);
          data[key] = json2Object(res);
        }
      };
      if (useIdb) {
        allData = await getAllItem(this.idbStore);
      }
      if (useSession) {
        allData = getAllSessionItem();
      }
    } catch (error) {
      errInfo('stroage.getAllItem', error);
    }
    return allData;
  }

  /**
   * @description 获取所有值的key
   * @param {bool} use 是不是使用session,默认使用indexDb
   */
  async getAllKey(use) {
    // 传入的值有值并且为true
    const uses = typeof use === 'boolean' && use === true;
    // 用idb
    const useIdb = !uses && this.canUseIdb;
    // 用session
    const useSession = uses || !this.canUseIdb;
    let allData = null;
    try {
      const getAllSessionItem = () => {
        const keys = Object.keys(window.sessionStorage);
        const data = {};
        for (let index = 0; index < keys.length; index++) {
          const key = keys[index];
          const res = window.sessionStorage.getItem(key);
          data[key] = json2Object(res);
        }
      };
      if (useIdb) {
        allData = await getAllKey(this.idbStore);
      }
      if (useSession) {
        allData = getAllSessionItem();
        allData = Object.keys();
      }
    } catch (error) {
      errInfo('stroage.getAllKey', error);
    }
    return allData;
  }
}

export default IdbSession;
