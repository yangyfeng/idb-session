/*
 * @Date: 2022-11-30 16:00:03
 * @LastEditTime: 2022-11-30 16:08:38
 */
// promisify
export const promisifyRequest = (request) => {
  return new Promise((resolve, reject) => {
    // @ts-ignore - file size hacks
    request.oncomplete = request.onsuccess = () => {
      log('创建或打开数据库成功');
      resolve(request.result);
    };
    // @ts-ignore - file size hacks
    request.onabort = request.onerror = () => {
      errInfo('创建或打开数据库失败', request.error.message);
      reject(request.error);
    };
  });
};
// log
export const log = (name = '', message = '') => {
  console.info(`%c idb-session ->  ${name}`, 'font-size:14px;color:#ccc;', message);
};
// error
export const errInfo = (name = '', message = '') => {
  console.info(`%c idb-session ->  ${name}`, 'font-size:14px;color:#f00;', message);
};
// 转成json
export const object2Json = (value) => {
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }
  return value;
};
// 是不是一个json string
export const isJSON = (str) => {
  if (typeof str !== 'string') {
    return false;
  }
  try {
    const obj = JSON.parse(str);
    if (typeof obj == 'object' && obj) {
      return true;
    } else {
      return false;
    }
  } catch (e) {
    return false;
  }
};
// json装车object
export const json2Object = (value) => {
  if (isJSON(value)) {
    value = JSON.parse(value);
  }
  return value;
};
// 是否支持indexDb
export const supportIndexDb = () => {
  // 可能的不同浏览器indexDB的构造方法的名字
  const indexedDBKeys = ['indexedDB', 'webkitIndexedDB', 'mozIndexedDB', 'msIndexedDB'];
  // indexDB的api方法名
  const idbApiKeys = ['databases', 'deleteDatabase', 'open', 'cmp'];
  // 是不是哪一种类型的值
  const isType = (data, type) => Object.prototype.toString.call(data) === `[object ${type}]`;
  for (let index = 0; index < indexedDBKeys.length; index++) {
    const key = indexedDBKeys[index];
    const data = window[key];
    // 找到的值是一个IDBFactory Object
    const isDataIDBFactory = isType(data, 'IDBFactory') && isType(data.__proto__, 'IDBFactory');
    if (!isDataIDBFactory) {
      return false;
    }
    // 三个方法也要有
    const hasAllApis = idbApiKeys.every((key) => {
      const func = data[key] || data.__proto__[key];
      return isType(func, 'Function');
    });
    if (!hasAllApis) {
      return false;
    }
    return true;
  }
};
