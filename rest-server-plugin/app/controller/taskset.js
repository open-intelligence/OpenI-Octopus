const Controller = require('egg').Controller;

class TasksetController extends Controller {
  async translator() {
    await this.ctx.service.taskset.translator();
  }
}
module.exports = TasksetController;