const Controller = require('egg').Controller;

class DebugjobController extends Controller {
  async lifehook() {
    await this.ctx.service.debugjob.lifehook();
  }
}
module.exports = DebugjobController;