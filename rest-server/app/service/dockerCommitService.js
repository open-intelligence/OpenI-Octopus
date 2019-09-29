'use strict';

const Service = require('egg').Service;
const ImageFactoryApi = require('../third-service-apis/image-factory');
class ImageCommitService extends Service {

  constructor(...args) {
    super(...args);
    this.userModel = this.app.model.User;
    this.jobPlatformModel = this.app.model.JobPlatform;
    this.organizationModel = this.app.model.Organization;
    this.imageFactoryApi = ImageFactoryApi.config(this.config.imageFactory);

    this.userCommitImageTimerMap = {};
  }

  async _invokeService(url, options = { dataType: 'json', timeout: 30000 }) {
    const requestRes = await this.ctx.curl(url, options);
    const requestResJson = typeof requestRes.data === 'object' && !Buffer.isBuffer(requestRes.data) ?
      requestRes.data : JSON.parse(requestRes.data);
    return requestResJson;
  }


  async commitContainer(username, ip, containerId, imageDescription) {
    const imageFactoryApi = this.imageFactoryApi;

    const imageName = this.config.docker.registry + '/user-images/' + username;

    const url = imageFactoryApi.imageCommitPath();

    const res = await this._invokeService(url, {
      method: 'POST',
      contentType: 'json',
      dataType: 'json',
      data: {
        ip,
        author: username,
        container: containerId,
        image: imageName,
        note: imageDescription,
        hub_user: this.config.docker.username,
        hub_pwd: this.config.docker.password,
        hub_addr: this.config.docker.registry,
      },
    });

    if (res.success) {

      const serviceInstance = this;

      await this.startCheckCommitResultTimer(serviceInstance, username, containerId, imageName, imageDescription);
    }

    return res;
  }

  async startCheckCommitResultTimer(serviceInstance, username, containerId, imageName, imageDescription) {

    clearInterval(this.userCommitImageTimerMap[username]);

    const intervalTimer = setInterval(function(serviceInstance, username, containerId, imageName, imageDescription) {

      serviceInstance.queryImageStatus(containerId).then(function(imageStatus) {

        if (imageStatus.success) {
          if (imageStatus.commit.status === 'SUCCEEDED') {
            clearInterval(serviceInstance.userCommitImageTimerMap[username]);
            serviceInstance.userCommitImageTimerMap[username] = undefined;
            serviceInstance.logger.info('Commit Image Successed:', imageName, imageStatus);


            serviceInstance.jobPlatformModel.findAll({
              raw: true,
              attributes: [ 'id', 'platformKey' ],
            }).then(function(jobGPUTypeArray) {
              serviceInstance.logger.info('For Save Image, Get GPU Type Array:', jobGPUTypeArray);

              serviceInstance.service.imageSet.addImage(username, imageName, jobGPUTypeArray, imageDescription).then(function(insertImageInfo) {

                serviceInstance.logger.info('Save Image Successed:', imageName, insertImageInfo);

              }).catch(function(err) {
                clearInterval(serviceInstance.userCommitImageTimerMap[username]);
                serviceInstance.userCommitImageTimerMap[username] = undefined;
                serviceInstance.logger.error('Save Image Error:', err);
              });

            }).catch(function(err) {
              clearInterval(serviceInstance.userCommitImageTimerMap[username]);
              serviceInstance.userCommitImageTimerMap[username] = undefined;
              serviceInstance.logger.error('For Save Image,Get GPU Type Error:', err);
            });

          } else if (imageStatus.commit.status === 'FAILED' || imageStatus.commit.status === 'NOT_FOUND') {
            clearInterval(serviceInstance.userCommitImageTimerMap[username]);
            serviceInstance.userCommitImageTimerMap[username] = undefined;
            serviceInstance.logger.error('Commit Image Failed or not found:', imageName, imageStatus);
          }
        } else {
          clearInterval(serviceInstance.userCommitImageTimerMap[username]);
          serviceInstance.userCommitImageTimerMap[username] = undefined;
        }

      }).catch(function(err) {
        clearInterval(serviceInstance.userCommitImageTimerMap[username]);
        serviceInstance.userCommitImageTimerMap[username] = undefined;
        serviceInstance.logger.error('Commit Image Error: ', err);
      });

    }, 2000, serviceInstance, username, containerId, imageName, imageDescription);

    this.userCommitImageTimerMap[username] = intervalTimer;
  }

  async queryImageStatus(containerId) {
    // image status is a temp status in image factory
    const imageFactoryApi = this.imageFactoryApi;
    const imageStatus = await this._invokeService(imageFactoryApi.imageStatusPath(containerId));
    return imageStatus;
  }

  async queryImageSize(ip, containerId) {
    const imageFactoryApi = this.imageFactoryApi;

    const imageSize = await this._invokeService(imageFactoryApi.imageSizePath(ip, containerId));

    return imageSize;
  }

}

module.exports = ImageCommitService;
