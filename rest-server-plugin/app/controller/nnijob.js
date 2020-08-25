const Controller = require('egg').Controller;

class NNIjobController extends Controller {
  async lifehook() {
    await this.ctx.service.nnijob.lifehook();
  }
}
module.exports = NNIjobController;