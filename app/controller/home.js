'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const data = await this.ctx.service.index.getIndex();
    await this.ctx.render('index.html', data);
  }

  // 爬取数据
  async spider() {
    const type = parseInt(this.ctx.params.type);
    this.ctx.body = await this.ctx.service.spider.getData(type);
  }
}

module.exports = HomeController;