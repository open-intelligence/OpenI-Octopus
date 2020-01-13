'use strict';

const Service = require('egg').Service;
const { ECode, LError } = require('../../lib');

class OrganizationService extends Service {
  constructor(...args) {
    super(...args);
    this.organizationModel = this.app.model.Organization;
  }

  async addOrganization(ogz) {
    if (!ogz.pid) {
      return await this.saveOrganization(ogz);
    }

    const parentOgz = await this.organizationModel.findOne({
      raw: true, where: { id: ogz.pid },
    });

    if (!parentOgz) {
      throw new LError(ECode.NOT_FOUND, 'parent ogz is not found');
    }
    return await this.saveOrganization(ogz, parentOgz);
  }

  async saveOrganization(ogz, parentOgz) {
    ogz.id = this.app.generateId(11);
    if (parentOgz) {
      ogz.pid = parentOgz.id;
      ogz.ids = parentOgz.ids.split(',');
      ogz.ids.push(ogz.id);
      ogz.ids = ogz.ids.join();
      ogz.names = parentOgz.names.split(',');
      ogz.names.push(ogz.name);
      ogz.names = ogz.names.join();
    } else {
      ogz.ids = ogz.id;
      ogz.names = ogz.name;
    }
    return await this.organizationModel.create(ogz, { raw: true });
  }

  async listOrganizations() {
    return await this.organizationModel.findAll({
      attributes: { exclude: [ 'ids', 'names', 'created_at', 'updated_at' ] },
      raw: true,
    });
  }

  async formatOgzs(ogzs) {
    const objMap = {},
      rootNodes = [];
      // 先计算出一个id的字典，还有根节点
    for (const i in ogzs) {
      objMap[ogzs[i].id] = ogzs[i];
      if (!ogzs[i].pid) {
        rootNodes.push(ogzs[i]);
      }
    }
    ogzs.forEach(function(item) {
      if (item.pid) {
        const node = objMap[item.pid];
        if (node && !node.children) {
          node.children = [];
        }
        node && node.children.push(item);
      }
    });
    return rootNodes;
  }
}

module.exports = OrganizationService;
