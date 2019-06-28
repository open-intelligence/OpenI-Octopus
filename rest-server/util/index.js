'use strict';

module.exports = {
  deepCopy: function deepExtend(source, obj) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object') {
          source[key] = deepExtend(obj[key]); // 递归复制
        } else {
          source[key] = obj[key];
        }
      }
    }
    return source;
  },
  isEmptyObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return true;
    }
    return Object.keys(obj).length < 1;
  },
};
