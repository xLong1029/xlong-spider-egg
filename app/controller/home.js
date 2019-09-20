'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  // async index() {
  //   const { ctx } = this;
  //   ctx.body = 'hi, welcome to xlong-spider-egg.';
  // }

  async index() {
    const data = await this.ctx.service.index.getIndex();
    // 获取代理服务列表
    // if(!this.app.proxyList){      
    //   this.app.proxyList = await this.ctx.service.proxy.getProxyList();
    //   console.log(this.app.proxyList);
    // }
    await this.ctx.render('index.html', data);
  }

  // 爬取数据
  async spider() {
    const type = parseInt(this.ctx.params.type);
    this.ctx.body = await this.ctx.service.spider.getData(type);
  }
}

module.exports = HomeController;