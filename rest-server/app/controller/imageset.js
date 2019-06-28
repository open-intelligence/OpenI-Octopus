'use strict';

const Controller = require('egg').Controller;

class ImageSetController extends Controller {
  async get() {
    // no use for get image from id
  }

  async list() {
    const { ctx, service } = this;
    const { platformKey } = ctx.query;
    const images = await service.imageSet.getImageSetList({ platformKey });
    ctx.success(images);
  }
}

module.exports = ImageSetController;
