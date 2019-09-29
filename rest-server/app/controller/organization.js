'use strict';

const Controller = require('egg').Controller;

class OrganizationController extends Controller {
  async addOrganization() {
    const { ctx, service } = this;
    let organization = ctx.request.body;

    organization = await service.organization.addOrganization(organization);
    ctx.success(organization);
  }


  async listOrganizations() {
    const { ctx, service } = this;
    let organizations = await service.organization.listOrganizations();
    organizations = await service.organization.formatOgzs(organizations);
    ctx.success(organizations);
  }
}

module.exports = OrganizationController;
