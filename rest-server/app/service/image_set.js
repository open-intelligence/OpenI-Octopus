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
const Service = require('egg').Service;
const marked = require('marked');
const LError = require('../error/proto');
const ECode = require('../error/code');

class ImageSetService extends Service {
  constructor(...args) {
    super(...args);
    this.imageSetModel = this.app.model.ImageSet;
  }

  async getImageSetList(condition) {
    let dbImages = [];
    try {
      dbImages = await this.imageSetModel.findAll({
        where: condition,
      });
    } catch (e) {
      this.logger.error('getAllImageSet error:' + e);
      throw new LError(ECode.INTERNAL_ERROR, e.message);
    }
    const images = {};
    for (const dbImage of dbImages) {
      dbImage.dataValues.description = marked(dbImage.dataValues.description);
      images[dbImage.dataValues.id] = dbImage.dataValues;
    }
    return images;
  }

}

module.exports = ImageSetService;
