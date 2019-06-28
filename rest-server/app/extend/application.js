'use strict';
const path = require('path');
const nanoid = require('nanoid');
const generate = require('nanoid/generate');
const DANDAREA = '1234567890abcdefghijklmnopqrstuvwxyz';
const fs = require('fs-extra')
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');

module.exports = {
  get idGenerator() {
    return nanoid;
  },
  generateId(len = 32) {
    return generate(DANDAREA, len);
  },
  async initProxyDB() {
    // init proxy db
    const { proxyDB: { fileDB: { filePath, fileName } } } = this.config;
    await fs.ensureDir(filePath);
    const adapter = new FileAsync(path.join(path.resolve(filePath), fileName));
    return await low(adapter);
  },
  async initJobConifgDB() {
        // init proxy db
        const { jobConfigDB: { fileDB: { filePath, fileName } } } = this.config;
        await fs.ensureDir(filePath);
        const adapter = new FileAsync(path.join(path.resolve(filePath), fileName));
        return await low(adapter);
    },
};
