'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  // async index() {
  //   const { ctx } = this;
  //   ctx.body = 'hi, welcome to xlong-spider-egg.';
  // }

	async index() {
		const data = await this.ctx.service.index.getIndex();
		await this.ctx.render('index.html', data);
  }

  // 获取数据
  async spider() {
    const type = parseInt(this.ctx.params.type);
    this.ctx.body = await this.ctx.service.spider.getData(type);
  }
}

module.exports = HomeController;
