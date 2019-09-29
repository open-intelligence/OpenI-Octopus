'use strict';

const Service = require('egg').Service;
const LError = require('../error/proto');
const ECode = require('../error/code');

class JobPlatformService extends Service {
  constructor(...args) {
    super(...args);
    this.jobPlatformModel = this.app.model.JobPlatform;
    this.imageSetModel = this.app.model.ImageSet;
    this.typeBlackWhiteListModel = this.app.model.TypeBlackwhiteList;
  }

  async listJobPlatforms(condition) {
    const jobPlatforms = await this.jobPlatformModel.findAll({
      where: condition,
      attributes: [ 'platformKey', 'name', 'standard', 'description' ],
    });

    return jobPlatforms;
  }

  async createJobPlatform(jobPlatform) {
    const hasPlatform = await this.jobPlatformModel.count({
      where: { platformKey: jobPlatform.platformKey },
    });
    if (hasPlatform) {
      throw new LError(ECode.RESOURCE_CONFLICT, 'job platform already exists');
    }
    return await this.jobPlatformModel.create(jobPlatform);
  }

  async listJobPlatformWithImageSets(user) {
    let jobPlatforms = await this.jobPlatformModel.findAll({
      include: {
        model: this.imageSetModel,
        through: {
          attributes: [ 'id' ],
        },
      },
    });

    if (!user.admin) {
      const username = user.username;

      const typeBlackWhiteList = await this.typeBlackWhiteListModel.findAll({
        attributes: [ 'type', 'local_limit', 'local_users', 'global_limit' ],
      });

      const typeBlackWhiteMap = {};
      for (const typeBlackWhiteItem of typeBlackWhiteList) {
        typeBlackWhiteMap[typeBlackWhiteItem.dataValues.type] = typeBlackWhiteItem.dataValues;
      }

      jobPlatforms = jobPlatforms.filter(jobPlatformInfo => {

        const typeBlackWhiteLimitInfo = typeBlackWhiteMap[jobPlatformInfo.platformKey];

        if (typeBlackWhiteLimitInfo) {
          // shouled return job platform info to webportal?
          if (typeBlackWhiteLimitInfo.global_limit === 'black') {
            const whiteLocalUsers = typeBlackWhiteLimitInfo.local_users.split(',');

            for (const whiteUser of whiteLocalUsers) {
              if (typeBlackWhiteLimitInfo.local_limit === 'white' && whiteUser === username) {
                return true;
              }
            }

            return false;
          } else if (typeBlackWhiteLimitInfo.global_limit === 'white') {
            const blackLocalUsers = typeBlackWhiteLimitInfo.local_users.split(',');

            for (const blackUser of blackLocalUsers) {
              if (typeBlackWhiteLimitInfo.local_limit === 'black' && blackUser === username) {
                return false;
              }
            }

            return true;
          }
        }

        return false;

      });
    }
    return jobPlatforms;
  }
}

module.exports = JobPlatformService;
