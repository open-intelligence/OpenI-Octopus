// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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
