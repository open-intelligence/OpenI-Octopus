'use strict';
const _ = require('lodash');
const Service = require('egg').Service;
const marked = require('marked');
const LError = require('../error/proto');
const ECode = require('../error/code');
const utils = require('../../util');

class ImageSetService extends Service {
  constructor(...args) {
    super(...args);
    this.imageSetModel = this.app.model.ImageSet;
    this.jobPlatformModel = this.app.model.JobPlatform;
    this.imageSetJobPlatformRelationModel = this.app.model.ImageSetJobPlatformRelation;
  }

  async getImageSetList(condition) {
    let dbImages = [];
    const filter = {};
    if (condition.platformKey) {
      const jobPlatform = await this.jobPlatformModel.findOne({
        raw: true,
        attributes: [ 'id' ],
        where: { platformKey: condition.platformKey },
      });
      if (utils.isEmptyObject(jobPlatform)) {
        return {};
      }
      const relations = await this.imageSetJobPlatformRelationModel.findAll({
        attributes: [ 'imageSetId' ],
        where: { jobPlatformId: jobPlatform.id },
      });
      filter.id = _.map(relations, 'imageSetId');
    }

    dbImages = await this.imageSetModel.findAll({
      where: filter,
    });
    const images = {};
    for (const dbImage of dbImages) {
      try{
          dbImage.dataValues.description = marked(dbImage.dataValues.description);
      }catch (e) {
          this.logger.error("getImageSetList error",e);
      }

      images[dbImage.dataValues.id] = dbImage.dataValues;
    }
    return images;
  }

  async addImage(username,imagePath,bindingGPUTypeArray,imageDescription=""){

      let imageInfo = {
          name: username,
          place: imagePath,
          description: imageDescription,
          provider:username,
          createtime: new Date()
      };

      await this.imageSetModel.upsert(imageInfo);

      let imageIdInfo = await this.imageSetModel.findOne({
          raw: true,
          attributes: ['id'],
          where: { name: username },
      });

      for(let gpuTypeItem of bindingGPUTypeArray)
      {
          let imageSetJobPlatformRelationInfo = {
              imageSetId: imageIdInfo.id,
              jobPlatformId: gpuTypeItem.id
          };

          await this.imageSetJobPlatformRelationModel.upsert(imageSetJobPlatformRelationInfo);
      }

      return imageIdInfo;
  }
}

module.exports = ImageSetService;
