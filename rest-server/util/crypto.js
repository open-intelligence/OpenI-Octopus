'use strict';
const crypto = require('crypto');

module.exports = {
  encryptWithSalt: (content, salt) => {
    const iterations = 10000;
    const keylen = 64;
    const _salt = crypto.createHash('md5').update(salt).digest('hex');
    const derivedKey = crypto.pbkdf2Sync(content, _salt, iterations, keylen, 'sha512').toString('hex');
    return derivedKey;
  },
  formatPrivateKey: (originKey, isWin) => {
    const str8629 = String.fromCharCode(8629);
    if (!isWin) {
      return originKey.replace(new RegExp(str8629, 'g'), '\n');
    }
    let priKeyArray = [];
    originKey.split('\n').forEach(function(item) {
      priKeyArray = priKeyArray.concat(item.split(str8629));
    });
    return priKeyArray;

  },
};
