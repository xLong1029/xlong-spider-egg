'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  // async index() {
  //   const { ctx } = this;
  //   ctx.body = 'hi, welcome to xlong-spider-egg.';
  // }

  // 首页
	async index() {
		const data = await this.ctx.service.index.getIndex();
		await this.ctx.render('index.html', data);
	}
}

module.exports = HomeController;
